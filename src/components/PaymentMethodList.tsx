import { useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_PAYMENT_METHODS } from "../graphql/operations";
import { describePaymentMethod, formatExpiry } from "../domain/paymentMethod";

const PaymentMethodList = () => {
	const { data, loading, error, refetch } = useQuery(GET_PAYMENT_METHODS);
	const headingRef = useRef<HTMLHeadingElement>(null);

	const methods = data?.paymentMethods || [];
	const isLoading = loading && !data;
	const hasFailed = !isLoading && !data && Boolean(error);
	const isEmpty = !isLoading && !hasFailed && methods.length === 0;

	const handleTryAgain = () => {
		headingRef.current?.focus();
		refetch().catch((err) =>
			console.error("Error refetching payment methods:", err),
		);
	};

	return (
		<div>
			<h2
				id="saved-methods-heading"
				ref={headingRef}
				tabIndex={-1}
				className="mb-3 text-lg font-semibold"
			>
				Saved payment methods
			</h2>

			<p role="status">{isLoading ? "Loading payment methods…" : ""}</p>

			{hasFailed && (
				<div>
					<p role="alert">
						We couldn't load your payment methods. {error?.message}
					</p>
					<button
						className="mt-2 rounded-md border border-neutral-500 px-3 py-1"
						onClick={handleTryAgain}
					>
						Try Again
					</button>
				</div>
			)}

			{isEmpty && <p>You haven't added any payment methods yet.</p>}

			{methods.length > 0 && (
				<ul aria-labelledby="saved-methods-heading" className="space-y-2">
					{methods.map((method) => (
						<li
							key={method.id}
							className="rounded-md border border-neutral-200 px-4 py-3"
						>
							<span className="block font-semibold break-words">
								{method.nickName}
							</span>{" "}
							-{" "}
							<span>
								{describePaymentMethod(method)}, expires {formatExpiry(method)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default PaymentMethodList;
