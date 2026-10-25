// Integration tests: real components + real Apollo client + in-memory mock server.

import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { ApolloProvider } from "@apollo/client/react";
import { createMockClient } from "../mock/mockClient";
import { mockApi } from "../mock/mockServer";
import PaymentDetails from "./PaymentDetails";

// Renders the screen and waits until the seeded list has loaded
async function renderPaymentScreen() {
	render(
		<ApolloProvider client={createMockClient()}>
			<PaymentDetails />
		</ApolloProvider>,
	);
	await screen.findByRole("list", { name: "Saved payment methods" });
}

function getVisibleMethods() {
	const list = screen.getByRole("list", { name: "Saved payment methods" });
	return within(list).getAllByRole("listitem");
}

async function fillForm(user: UserEvent, nickName = "Travel") {
	await user.selectOptions(screen.getByLabelText("Card"), "amex-0005");
	await user.type(screen.getByLabelText("Nickname"), nickName);
}

function getAddButton() {
	return screen.getByRole("button", { name: "Add Payment Method" });
}

describe("Payment methods screen", () => {
	beforeEach(() => {
		mockApi.reset();
		// Short delay so the pending state is visible, but tests stay fast
		mockApi.setDelay(50);
	});

	it("shows validation errors and sends nothing when the form is invalid", async () => {
		const user = userEvent.setup();
		await renderPaymentScreen();

		await user.click(getAddButton());

		expect(screen.getByText("Please select a card.")).toBeInTheDocument();
		expect(screen.getByText("Please enter a nickname.")).toBeInTheDocument();

		await user.selectOptions(screen.getByLabelText("Card"), "amex-0005");
		await user.type(screen.getByLabelText("Nickname"), "x".repeat(41));
		await user.click(getAddButton());

		expect(
			screen.getByText("Nickname must be 40 characters or less."),
		).toBeInTheDocument();
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(2);
	});

	it("pending → success: adds the card to the cached list without refetching", async () => {
		const user = userEvent.setup();
		await renderPaymentScreen();
		expect(getVisibleMethods()).toHaveLength(2);

		// If the list were refetched now, the server would answer with [].
		// So seeing 3 items afterwards proves the cache was updated directly.
		mockApi.setScenario("empty_response");

		await fillForm(user);
		await user.click(getAddButton());

		// Pending: status is announced and the button can't be pressed again
		expect(screen.getByRole("status")).toHaveTextContent("Adding “Travel”…");
		expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();

		await waitFor(() =>
			expect(screen.getByRole("status")).toHaveTextContent(/Added “Travel”/),
		);
		expect(getVisibleMethods()).toHaveLength(3);
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(3);
	});

	it("rejection → retry: keeps the form values, then succeeds on resubmit", async () => {
		const user = userEvent.setup();
		await renderPaymentScreen();
		mockApi.setScenario("mutation_rejected");

		await fillForm(user);
		await user.click(getAddButton());

		expect(await screen.findByText("Not added.")).toBeInTheDocument();
		expect(screen.getByLabelText("Card")).toHaveValue("amex-0005");
		expect(screen.getByLabelText("Nickname")).toHaveValue("Travel");
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(2);

		mockApi.setScenario("normal");
		await user.click(getAddButton());

		await waitFor(() => expect(getVisibleMethods()).toHaveLength(3));
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(3);
	});

	it("saved but response lost → retry: exactly one new card in the store and the list", async () => {
		const user = userEvent.setup();
		await renderPaymentScreen();
		mockApi.setScenario("response_lost");

		await fillForm(user);
		await user.click(getAddButton());

		// The server saved it, but the client doesn't know yet
		const retryButton = await screen.findByRole("button", { name: "Retry" });
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(3);
		expect(getVisibleMethods()).toHaveLength(2);

		mockApi.setScenario("normal");
		await user.click(retryButton);

		await waitFor(() =>
			expect(screen.getByRole("status")).toHaveTextContent(/Added “Travel”/),
		);
		expect(mockApi.getStoredPaymentMethods()).toHaveLength(3);
		expect(getVisibleMethods()).toHaveLength(3);
		expect(screen.getAllByText("Travel")).toHaveLength(1);
		// A successful retry ends the flow: no new submit, no validation errors
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
