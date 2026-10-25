import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
	AddPaymentMethodInput,
	PaymentMethod,
} from "../domain/paymentMethod";

const PAYMENT_METHOD_FIELDS = gql`
	fragment PaymentMethodFields on PaymentMethod {
		id
		brand
		last4
		expiryMonth
		expiryYear
		nickName
	}
`;

export type GetPaymentMethodsData = {
	paymentMethods: PaymentMethod[];
};

export const GET_PAYMENT_METHODS: TypedDocumentNode<
	GetPaymentMethodsData,
	Record<string, never>
> = gql`
	query GetPaymentMethods {
		paymentMethods {
			...PaymentMethodFields
		}
	}
	${PAYMENT_METHOD_FIELDS}
`;

export type AddPaymentMethodData = {
	addPaymentMethod: PaymentMethod;
};

export type AddPaymentMethodVariables = {
	idempotencyKey: string;
	input: AddPaymentMethodInput;
};

export const ADD_PAYMENT_METHOD: TypedDocumentNode<
	AddPaymentMethodData,
	AddPaymentMethodVariables
> = gql`
	mutation AddPaymentMethod(
		$idempotencyKey: ID!
		$input: AddPaymentMethodInput!
	) {
		addPaymentMethod(idempotencyKey: $idempotencyKey, input: $input) {
			...PaymentMethodFields
		}
	}
	${PAYMENT_METHOD_FIELDS}
`;
