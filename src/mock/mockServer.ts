// A tiny in-memory "backend" that answers GraphQL requests using the real schema.
// Behaviour is described in CONTRACT.md.

import {
	buildSchema,
	execute,
	getOperationAST,
	GraphQLError,
	type DocumentNode,
	type FormattedExecutionResult,
} from "graphql";
import schemaSource from "../graphql/schema.graphql?raw";
import { ErrorCode } from "../graphql/errorCodes";
import { CARD_PRESETS } from "../domain/presets";
import type {
	AddPaymentMethodInput,
	PaymentMethod,
} from "../domain/paymentMethod";

export const SCENARIOS = [
	"normal",
	"query_failure",
	"mutation_rejected",
	"response_lost",
	"empty_response",
] as const;

export type Scenario = (typeof SCENARIOS)[number];

export type MockSettings = {
	scenario: Scenario;
	delayMs: number;
};

type SavedMutation = {
	input: AddPaymentMethodInput;
	result: PaymentMethod;
};

const DEFAULT_SETTINGS: MockSettings = { scenario: "normal", delayMs: 500 };

const schema = buildSchema(schemaSource);

// ---------- Utilities ----------

export function isScenario(value: unknown): value is Scenario {
	return SCENARIOS.some((scenario) => scenario === value);
}

// ---------- Mock store ----------

let settings: MockSettings = { ...DEFAULT_SETTINGS };
let paymentMethods: PaymentMethod[] = [];
let savedByIdempotencyKey = new Map<string, SavedMutation>();
let nextId = 1;

function createPaymentMethod(presetId: string, nickName: string) {
	const preset = CARD_PRESETS.find((p) => p.id === presetId);
	if (!preset) {
		return null;
	}

	const paymentMethod: PaymentMethod = {
		...preset,
		id: `pm-${nextId}`,
		nickName,
	};
	nextId++;
	return paymentMethod;
}

function resetStore() {
	settings = { ...DEFAULT_SETTINGS };
	savedByIdempotencyKey = new Map();
	nextId = 1;

	// Start with 2 seeded payment methods
	paymentMethods = [
		createPaymentMethod("visa-1111", "Personal card")!,
		createPaymentMethod("mastercard-5454", "Work card")!,
	];
}

resetStore();

// ---------- Resolvers ----------

function makeError(message: string, code: string) {
	return new GraphQLError(message, { extensions: { code } });
}

function isSameInput(a: AddPaymentMethodInput, b: AddPaymentMethodInput) {
	return a.presetId === b.presetId && a.nickName === b.nickName;
}

function addPaymentMethod(
	idempotencyKey: string,
	input: AddPaymentMethodInput,
) {
	// Retry with a key we have seen before: replay the original result
	const previous = savedByIdempotencyKey.get(idempotencyKey);
	if (previous) {
		if (isSameInput(previous.input, input)) {
			return previous.result;
		}
		throw makeError(
			"This idempotency key was already used with different input.",
			ErrorCode.IdempotencyKeyReused,
		);
	}

	const nickName = input.nickName.trim();
	if (nickName === "") {
		throw makeError("Nickname is required.", ErrorCode.BadUserInput);
	}

	const newPaymentMethod = createPaymentMethod(input.presetId, nickName);
	if (!newPaymentMethod) {
		throw makeError(
			`Unknown card preset "${input.presetId}".`,
			ErrorCode.BadUserInput,
		);
	}

	if (settings.scenario === "mutation_rejected") {
		throw makeError(
			"The payment method was rejected.",
			ErrorCode.PaymentMethodRejected,
		);
	}

	paymentMethods = [...paymentMethods, newPaymentMethod];
	savedByIdempotencyKey.set(idempotencyKey, {
		input,
		result: newPaymentMethod,
	});
	return newPaymentMethod;
}

const rootValue = {
	paymentMethods: () => {
		if (settings.scenario === "empty_response") {
			return [];
		}
		return paymentMethods;
	},

	addPaymentMethod: (args: {
		idempotencyKey: string;
		input: AddPaymentMethodInput;
	}) => addPaymentMethod(args.idempotencyKey, args.input),
};

// ---------- Request handler ----------

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Handles one GraphQL request. A rejected promise means a network error.
export async function handleRequest(
	document: DocumentNode,
	variables: Record<string, unknown> = {},
	operationName?: string,
): Promise<FormattedExecutionResult> {
	await wait(settings.delayMs);

	const operationType = getOperationAST(document, operationName)?.operation;

	if (operationType === "query" && settings.scenario === "query_failure") {
		throw new Error("Network error: failed to fetch.");
	}

	const result = await execute({
		schema,
		document,
		rootValue,
		variableValues: variables,
		operationName,
	});

	if (operationType === "mutation" && settings.scenario === "response_lost") {
		// The data is already saved, but the client never gets the response
		throw new Error("Network error: connection lost before response.");
	}

	// Turn errors into plain JSON, like a real server would send them
	return {
		data: result.data,
		errors: result.errors?.map((error) => error.toJSON()),
	};
}

// ---------- Admin controls (for the admin panel UI) ----------

export const mockApi = {
	getSettings: (): MockSettings => ({ ...settings }),

	setScenario: (scenario: Scenario) => {
		settings = { ...settings, scenario };
	},

	getScenario: (): Scenario => settings.scenario,

	setDelay: (delayMs: number) => {
		settings = { ...settings, delayMs: Math.max(0, delayMs) };
	},

	// Peek at what the "backend" has saved, ignoring scenarios
	getStoredPaymentMethods: (): PaymentMethod[] => [...paymentMethods],

	reset: resetStore,
};

export type MockApi = typeof mockApi;
