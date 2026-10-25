import { beforeEach, describe, expect, it } from "vitest";
import { gql } from "@apollo/client";
import { createMockClient } from "./mockClient";
import { mockApi } from "./mockServer";
import type { PaymentMethod } from "../domain/paymentMethod";

type PaymentMethodsData = { paymentMethods: PaymentMethod[] };
type AddPaymentMethodData = { addPaymentMethod: PaymentMethod };

const PAYMENT_METHODS = gql`
	query PaymentMethods {
		paymentMethods {
			id
			brand
			last4
			nickName
		}
	}
`;

const ADD_PAYMENT_METHOD = gql`
	mutation AddPaymentMethod(
		$idempotencyKey: ID!
		$input: AddPaymentMethodInput!
	) {
		addPaymentMethod(idempotencyKey: $idempotencyKey, input: $input) {
			id
			nickName
		}
	}
`;

function fetchPaymentMethods() {
	return createMockClient().query<PaymentMethodsData>({
		query: PAYMENT_METHODS,
		fetchPolicy: "network-only",
	});
}

function addCard(idempotencyKey: string, nickName = "Travel card") {
	return createMockClient().mutate<AddPaymentMethodData>({
		mutation: ADD_PAYMENT_METHOD,
		variables: { idempotencyKey, input: { presetId: "amex-0005", nickName } },
	});
}

describe("mock server", () => {
	beforeEach(() => {
		mockApi.reset();
		mockApi.setDelay(0);
	});

	it("starts with 2 seeded payment methods", async () => {
		const { data } = await fetchPaymentMethods();
		expect(data?.paymentMethods).toHaveLength(2);
	});

	it("normal: saves and returns the new payment method", async () => {
		const { data } = await addCard("key-1");
		expect(data?.addPaymentMethod).toMatchObject({
			id: "pm-3",
			nickName: "Travel card",
		});
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(3);
	});

	it("query_failure: query gets a network error", async () => {
		mockApi.setScenario("query_failure");
		await expect(fetchPaymentMethods()).rejects.toThrow(/Network error/);
	});

	it("empty_response: query returns an empty list", async () => {
		mockApi.setScenario("empty_response");
		const { data } = await fetchPaymentMethods();
		expect(data?.paymentMethods).toEqual([]);
	});

	it("mutation_rejected: returns an error and saves nothing", async () => {
		mockApi.setScenario("mutation_rejected");
		await expect(addCard("key-1")).rejects.toThrow(/rejected/);
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(2);
	});

	it("response_lost: saves, and a retry with the same key creates no duplicate", async () => {
		mockApi.setScenario("response_lost");
		await expect(addCard("key-1")).rejects.toThrow(/Network error/);
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(3);

		mockApi.setScenario("normal");
		const { data } = await addCard("key-1");
		expect(data?.addPaymentMethod.id).toBe("pm-3");
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(3);
	});

	it("rejects reusing a key with different input", async () => {
		await addCard("key-1", "Travel card");
		await expect(addCard("key-1", "Other card")).rejects.toThrow(
			/idempotency key/,
		);
	});

	it("rejects an unknown preset", async () => {
		const result = createMockClient().mutate<AddPaymentMethodData>({
			mutation: ADD_PAYMENT_METHOD,
			variables: {
				idempotencyKey: "key-1",
				input: { presetId: "nope", nickName: "x" },
			},
		});
		await expect(result).rejects.toThrow(/Unknown card preset/);
	});
});
