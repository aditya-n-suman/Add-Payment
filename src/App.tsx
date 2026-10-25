import type { ApolloClient } from "@apollo/client";
import type { MockApi } from "./mock/mockServer";
import { ApolloProvider } from "@apollo/client/react";
import MockControls from "./components/MockControls";
import PaymentDetails from "./components/PaymentDetails";

interface AppProps {
	client: ApolloClient;
	api: MockApi;
}

const App = ({ client, api }: AppProps) => {
	return (
		<ApolloProvider client={client}>
			<div className="w-full max-w-160">
				<PaymentDetails />
			</div>
			<MockControls api={api} />
		</ApolloProvider>
	);
};

export default App;
