import { useMutation } from "@apollo/client/react";
import {
	ADD_PAYMENT_METHOD,
	type AddPaymentMethodVariables,
} from "../graphql/operations";
import { addPaymentMethodToCache } from "../domain/cacheUpdates";
import type {
	AddPaymentMethodInput,
	PaymentMethod,
} from "../domain/paymentMethod";
import { useRef, useState } from "react";
import {
	classifyAddError,
	createIdempotencyKey,
} from "../utils/paymentUtility";

export type AddState =
	| { status: "idle" }
	| { status: "submitting"; input: AddPaymentMethodVariables; isRetry: boolean }
	| { status: "success"; response: PaymentMethod }
	| { status: "rejected"; input: AddPaymentMethodVariables; message: string }
	| { status: "unresolved"; input: AddPaymentMethodVariables; message: string };

export type AddPaymentStatus = AddState["status"];

const useAddPaymentForm = () => {
	const [state, setState] = useState<AddState>({ status: "idle" });
	const inFlight = useRef(false);
	const [mutate] = useMutation(ADD_PAYMENT_METHOD, {
		update(cache, { data }) {
			if (data) addPaymentMethodToCache(cache, data.addPaymentMethod);
		},
	});

	const send = async (
		payload: AddPaymentMethodVariables,
		isRetry: boolean,
	): Promise<AddPaymentStatus> => {
		if (inFlight.current) return "submitting";
		inFlight.current = true;
		setState({ status: "submitting", input: payload, isRetry });
		try {
			const { data } = await mutate({ variables: payload });
			if (!data) {
				setState({
					status: "unresolved",
					input: payload,
					message: "No data returned from server.",
				});
				return "unresolved";
			}
			setState({ status: "success", response: data.addPaymentMethod });
			return "success";
		} catch (error) {
			const outcome = classifyAddError(error);
			setState({
				status: outcome.kind,
				input: payload,
				message: outcome.message,
			});
			return outcome.kind;
		} finally {
			inFlight.current = false;
		}
	};

	const submit = async (
		input: AddPaymentMethodInput,
	): Promise<AddPaymentStatus> => {
		if (state.status === "submitting" || state.status === "unresolved") {
			return Promise.resolve(state.status);
		}
		return send({ idempotencyKey: createIdempotencyKey(), input }, false);
	};

	const retry = async (): Promise<AddPaymentStatus> => {
		if (state.status !== "unresolved") {
			return Promise.resolve(state.status);
		}
		return send(state.input, true);
	};

	return {
		state,
		submit,
		retry,
	};
};

export default useAddPaymentForm;
