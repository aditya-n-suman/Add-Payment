import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { Observable } from "rxjs";
import { handleRequest } from "./mockServer";

// Sends every Apollo request to the in-memory mock server instead of the network
const mockLink = new ApolloLink(
	(operation) =>
		new Observable((observer) => {
			handleRequest(
				operation.query,
				operation.variables,
				operation.operationName,
			)
				.then((result) => {
					observer.next(result);
					observer.complete();
				})
				.catch((error) => observer.error(error));
		}),
);

export function createMockClient() {
	return new ApolloClient({
		link: mockLink,
		cache: new InMemoryCache(),
	});
}
