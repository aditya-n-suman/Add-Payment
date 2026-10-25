import PaymentMethodList from "./PaymentMethodList";

const PaymentDetails = () => {
	return (
		<section
			aria-labelledby="payment-methods-heading"
			className="rounded-md border border-neutral-300 bg-white px-6 py-8"
		>
			<h1 id="payment-methods-heading" className="mb-4 text-2xl font-semibold">
				Payment Methods
			</h1>
			<PaymentMethodList />
		</section>
	);
};

export default PaymentDetails;
