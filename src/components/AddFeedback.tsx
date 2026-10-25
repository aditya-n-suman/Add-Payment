import { describePaymentMethod } from "../domain/paymentMethod";
import type { AddState } from "../hooks/useAddPaymentForm";

type AddFeedbackProps = {
	state: AddState;
};
const AddFeedback = ({ state }: AddFeedbackProps) => {
	return (
		<>
			{/* Always rendered so screen readers pick up changes to its text. */}
			<div role="status" className="add-form__status mt-4">
				{state.status === "submitting" &&
					`Adding “${state.input.input.nickName.trim()}”…`}
				{state.status === "success" &&
					`Added “${state.response.nickName}” (${describePaymentMethod(state.response)}).`}
			</div>

			{state.status === "rejected" && (
				<div
					role="alert"
					className="notice notice--error mt-4 space-y-2 rounded-md border border-red-700 bg-red-50 p-4"
				>
					<p>
						<strong>Not added.</strong> {state.message}
					</p>
					<p>Nothing was saved. You can change the details and try again.</p>
				</div>
			)}

			{state.status === "unresolved" && (
				<div
					role="alert"
					className="notice notice--warning mt-4 space-y-2 rounded-md border border-amber-600 bg-amber-50 p-4"
				>
					<p>
						<strong>
							We couldn't confirm whether "{state.input.input.nickName.trim()}"
							was saved.
						</strong>{" "}
						{state.message}
					</p>
					<p>
						Press Retry to resend the same request. It can't create a duplicate.
						The card and nickname are locked until we know the outcome.
					</p>
				</div>
			)}
		</>
	);
};

export default AddFeedback;
