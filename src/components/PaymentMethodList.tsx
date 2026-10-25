import { useQuery } from "@apollo/client/react";
import { GET_PAYMENT_METHODS } from "../graphql/operations";
import { describePaymentMethod, formatExpiry } from "../domain/paymentMethod";

const PaymentMethodList = () => {
	const { data, loading, error, refetch } = useQuery(GET_PAYMENT_METHODS);

	if (loading && !data) {
		return <p role="status">Loading payment methods...</p>;
	}

	if (error && !data) {
		return (
			<div role="alert">
				<p>We couldn't load your payment methods. {error.message}</p>
				<button
					className="mt-2 rounded-md border border-neutral-400 px-3 py-1"
					onClick={() =>
						refetch().catch((err) =>
							console.error("Error refetching payment methods:", err),
						)
					}
				>
					Try Again
				</button>
			</div>
		);
	}

	const methods = data?.paymentMethods || [];

	if (methods.length === 0) {
		return <p>You haven't added any payment methods yet.</p>;
	}

	return (
		<ul aria-label="Saved payment methods" className="space-y-2">
			{methods.map((method) => (
				<li
					key={method.id}
					className="rounded-md border border-neutral-200 px-4 py-3"
				>
					<span className="block font-semibold">{method.nickName}</span> -{" "}
					<span>
						{describePaymentMethod(method)}, expires {formatExpiry(method)}
					</span>
				</li>
			))}
		</ul>
	);
};

export default PaymentMethodList;
