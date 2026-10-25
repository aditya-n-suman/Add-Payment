import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CARD_PRESETS, describePreset } from "../domain/presets";
import { MAX_NICKNAME_LENGTH } from "../constants";
import useAddPaymentForm from "../hooks/useAddPaymentForm";
import { buttonLabel } from "../utils/paymentUtility";
import AddFeedback from "./AddFeedback";

type ValidationError = {
	presetId?: string;
	nickName?: string;
};

const AddPaymentMethodForm = () => {
	const { state, submit, retry } = useAddPaymentForm();
	const [selectedPreset, setSelectedPreset] = useState<string>("");
	const [nickname, setNickname] = useState<string>("");

	const presetRef = useRef<HTMLSelectElement>(null);
	const nicknameRef = useRef<HTMLInputElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const [validationErrors, setValidationErrors] = useState<ValidationError>({});
	const isPending = state.status === "submitting";
	const isUnresolved = state.status === "unresolved";
	const isLocked = isPending || isUnresolved;

	const presetSelectionHandler = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			setSelectedPreset(event.target.value);
			setValidationErrors((errors) => ({ ...errors, presetId: undefined }));
		},
		[],
	);

	const nicknameChangeHandler = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setNickname(event.target.value);
			setValidationErrors((errors) => ({ ...errors, nickName: undefined }));
		},
		[],
	);

	const validateForm = useCallback(
		(presetId: string, nickName: string): ValidationError => {
			const errors: ValidationError = {};
			if (!presetId) {
				errors.presetId = "Please select a card.";
			}
			if (!nickName) {
				errors.nickName = "Please enter a nickname.";
			} else if (nickName.length > MAX_NICKNAME_LENGTH) {
				errors.nickName = `Nickname must be ${MAX_NICKNAME_LENGTH} characters or less.`;
			}
			flushSync(() => setValidationErrors(errors));
			return errors;
		},
		[],
	);

	const resetForm = useCallback(() => {
		setValidationErrors({});
		setSelectedPreset("");
		setNickname("");
	}, []);

	const handleSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();

			if (isPending) return;
			if (isUnresolved) {
				if ((await retry()) === "success") {
					resetForm();
				}
				return;
			}

			const presetId = presetRef.current?.value || "";
			const nickName = nicknameRef.current?.value || "";
			const errors = validateForm(presetId, nickName);

			if (errors.presetId || errors.nickName) {
				(errors.presetId ? presetRef : nicknameRef).current?.focus();
				return;
			}

			buttonRef.current?.focus();

			if ((await submit({ presetId, nickName })) === "success") {
				resetForm();
			}
		},
		[submit, resetForm, retry, validateForm, isPending, isUnresolved],
	);

	return (
		<form
			onSubmit={handleSubmit}
			aria-labelledby="add-heading"
			className="mt-8"
			noValidate
		>
			<h2 id="add-heading" className="mb-2 text-2xl font-semibold">
				Add Payment Method
			</h2>
			<p className="mb-5 text-sm text-neutral-600">All fields are required.</p>
			<fieldset disabled={isLocked} className="flex flex-col">
				<legend className="sr-only">Enter your card details:</legend>
				<div className="field mb-4 flex flex-col">
					<label htmlFor="preset" className="mb-1 font-semibold">
						Card
					</label>
					<select
						className={`bg-neutral-100 rounded border px-3 py-1.5 disabled:border-dashed disabled:bg-neutral-100 disabled:text-neutral-500 ${validationErrors.presetId ? "border-red-700" : "border-neutral-500"}`}
						id="preset"
						value={selectedPreset}
						onChange={presetSelectionHandler}
						required
						aria-invalid={Boolean(validationErrors.presetId)}
						aria-describedby={
							validationErrors.presetId ? "preset-error" : undefined
						}
						ref={presetRef}
					>
						<option value="">-- Select a card --</option>
						{CARD_PRESETS.map((card) => (
							<option key={card.id} value={card.id}>
								{describePreset(card)}
							</option>
						))}
					</select>
					{validationErrors.presetId && (
						<span id="preset-error" className="mt-1 text-sm text-red-700">
							{validationErrors.presetId}
						</span>
					)}
				</div>
				<div className="field flex flex-col">
					<label htmlFor="nickname" className="mb-1 font-semibold">
						Nickname
					</label>
					<p id="nickname-hint" className="mb-1 text-sm text-neutral-600">
						Up to {MAX_NICKNAME_LENGTH} characters.
					</p>
					<input
						className={`rounded border px-3 py-1.5 disabled:border-dashed disabled:bg-neutral-100 disabled:text-neutral-500 ${validationErrors.nickName ? "border-red-700" : "border-neutral-500"}`}
						id="nickname"
						type="text"
						value={nickname}
						onChange={nicknameChangeHandler}
						required
						aria-invalid={Boolean(validationErrors.nickName)}
						aria-describedby={
							validationErrors.nickName
								? "nickname-hint nickname-error"
								: "nickname-hint"
						}
						ref={nicknameRef}
						autoComplete="off"
					/>
					{validationErrors.nickName && (
						<span id="nickname-error" className="mt-1 text-sm text-red-700">
							{validationErrors.nickName}
						</span>
					)}
				</div>
			</fieldset>
			<button
				ref={buttonRef}
				type="submit"
				aria-disabled={isPending}
				className="mt-6 rounded-md bg-neutral-900 px-4 py-2 text-white aria-disabled:cursor-not-allowed aria-disabled:bg-neutral-500"
			>
				{buttonLabel(state)}
			</button>

			<AddFeedback state={state} />
		</form>
	);
};

export default AddPaymentMethodForm;
