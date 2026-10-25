import { BRAND_LABELS, type PaymentMethod } from "./paymentMethod";

export type CardPreset = Omit<PaymentMethod, "nickName">;

export const CARD_PRESETS: readonly CardPreset[] = [
	{
		id: "visa-1111",
		brand: "VISA",
		last4: "1111",
		expiryMonth: 8,
		expiryYear: 2029,
	},
	{
		id: "mastercard-5454",
		brand: "MASTERCARD",
		last4: "5454",
		expiryMonth: 3,
		expiryYear: 2030,
	},
	{
		id: "amex-0005",
		brand: "AMEX",
		last4: "0005",
		expiryMonth: 11,
		expiryYear: 2031,
	},
];

export function describePreset(preset: CardPreset): string {
	const month = String(preset.expiryMonth).padStart(2, "0");
	return `${BRAND_LABELS[preset.brand]} ending ${preset.last4} (expires ${month}/${preset.expiryYear})`;
}
