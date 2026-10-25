// Domain types shared by the client and the mock server.
// It mirrors src/graphql/schema.graphql by hand (no codegen)

export type CardBrand = "VISA" | "MASTERCARD" | "AMEX";

export type PaymentMethod = {
	id: string;
	brand: CardBrand;
	last4: string;
	expiryMonth: number;
	expiryYear: number;
	nickName: string;
};

export interface AddPaymentMethodInput {
	presetId: string;
	nickName: string;
}

export const BRAND_LABELS: Record<CardBrand, string> = {
	VISA: "Visa",
	MASTERCARD: "Mastercard",
	AMEX: "American Express",
};
