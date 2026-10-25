import { CombinedGraphQLErrors } from "@apollo/client";
import { NOTHING_SAVED_CODES } from "../graphql/errorCodes";
import type { AddState } from "../hooks/useAddPaymentForm";

export type FailedAddOutcome = {
	kind: "rejected" | "unresolved";
	message: string;
};

export function classifyAddError(error: unknown): FailedAddOutcome {
	if (CombinedGraphQLErrors.is(error) && error.errors.length > 0) {
		const nothingSaved = error.errors.every((graphQLError) =>
			NOTHING_SAVED_CODES.includes(String(graphQLError.extensions?.code)),
		);
		if (nothingSaved) {
			return {
				kind: "rejected",
				message: error.errors[0]?.message ?? "The payment method was rejected.",
			};
		}
	}
	const message = error instanceof Error ? error.message : "Unknown error.";
	return { kind: "unresolved", message };
}

export function createIdempotencyKey(): string {
	return crypto.randomUUID();
}

export const buttonLabel = (state: AddState): string => {
	switch (state.status) {
		case "submitting":
			return state.isRetry ? "Retrying..." : "Adding...";
		case "unresolved":
			return "Retry";
		default:
			return "Add Payment Method";
	}
};
