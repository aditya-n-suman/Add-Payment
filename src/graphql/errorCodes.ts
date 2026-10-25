export const ErrorCode = {
	BadUserInput: "BAD_USER_INPUT",
	PaymentMethodRejected: "PAYMENT_METHOD_REJECTED",
	IdempotencyKeyReused: "IDEMPOTENCY_KEY_REUSED",
};

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const NOTHING_SAVED_CODES: readonly string[] = [
	ErrorCode.BadUserInput,
	ErrorCode.PaymentMethodRejected,
];
