# Contract between FE and BE

Use schema available at `src/graphql/schema.graphql` and error codes as outlined in `src/graphql/errorCodes.ts`.

### Schema defines:

- A `paymentMethods` query.
- An `addPaymentMethod` mutation accepting a preset ID, nickname, and client-generated `idempotencyKey`, returning the saved method.

### Card presets

- Card presets live in `src/domain/presets.ts` and are shared by the FE and the mock BE. They are **not** fetched from the server.
- A preset stands in for a card token that a payment provider SDK would give the browser, so the FE never sends raw card details.
- The server only validates `presetId`. Unknown preset or blank nickname → `BAD_USER_INPUT`, nothing saved.

### The mock should support following scenarios:

- normally, it should initialize with 2 seeded payment methods inside mock store (BE mock)
- it should support scenario and time delay updates programmatically on the go through a configurable js function call (troggered through a admin panel kind of UI)
- the delay applies to every operation (query and mutation)
- if `scenario = "query_failure"`, then the `paymentMethods` query gives a network error. Mutations work normally.
- if `scenario = "mutation_rejected"`, then `addPaymentMethod` rejects with `PAYMENT_METHOD_REJECTED` and nothing is stored in its mock store. Queries work normally.
- if `scenario = "response_lost"`, then `addPaymentMethod` saves the data in its store, but the client gets a network error instead of the response (similar to success on server side processing, but response sending pipeline broke). Queries work normally.
- if `scenario = "normal"`, then return normal response from the store.
- if `scenario = "empty_response"`, then the `paymentMethods` query returns an empty list (`[]`) with success. Mutations work normally.
- In the mock API, store the result by key so retrying after a lost response returns the original method and creates no duplicate. Reject reuse of a key with different input (`IDEMPOTENCY_KEY_REUSED`).
