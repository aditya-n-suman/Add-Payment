import type { ApolloCache } from "@apollo/client";
import type { PaymentMethod } from "./paymentMethod";
import { GET_PAYMENT_METHODS } from "../graphql/operations";

export const addPaymentMethodToCache = (
	cache: ApolloCache,
	method: PaymentMethod,
) => {
	cache.updateQuery({ query: GET_PAYMENT_METHODS }, (data) => {
		if (!data) return;
		if (data.paymentMethods.some((existing) => existing.id === method.id)) {
			return;
		}
		return {
			...data,
			paymentMethods: [...data.paymentMethods, method],
		};
	});
};
