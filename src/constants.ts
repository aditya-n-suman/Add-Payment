import type { Scenario } from "./mock/mockServer";

export const SCENARIO_DETAILS: Record<Scenario, string> = {
	normal: "Normal operation with no errors (initialized with seeded data).",
	empty_response:
		"Everything succeeds but the list of payment methods is empty.",
	query_failure: "Loading list of payment methods fails with an error.",
	mutation_rejected: "Adding a payment method fails with an error.",
	response_lost: "Adding a payment method succeeds but the response is lost.",
};

export const SCENARIO_NAMES: Record<Scenario, string> = {
	normal: "Normal",
	empty_response: "Empty Response",
	query_failure: "Query Failure",
	mutation_rejected: "Mutation Rejected",
	response_lost: "Saved, Response Lost",
};

export const MAX_NICKNAME_LENGTH = 40;
