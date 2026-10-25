# Payment methods screen

A single React + TypeScript screen that lists saved payment methods and adds new ones from fake card presets. All data goes through Apollo Client to an in-memory GraphQL mock, which can simulate failures so you can see the loading, error and retry behaviour.

Synthetic data only: no card numbers, CVVs or real payments.

## Prerequisites

- Node.js 20.19+ or 22.12+ (built with Node 22.22, npm 10.9)

## Commands

```bash
npm install
npm run dev        # start the app at http://localhost:5173
npm test           # run all tests once (Vitest + React Testing Library)
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

## Mock scenarios

The mock starts with 2 seeded cards and adds a **500 ms delay** to every request so pending states are visible. Data resets on a full page reload.

Pick a scenario with the **Mock API Controls** panel on the right (takes effect on the next request), or load the page with a `?scenario=` parameter to affect the first load:

| Scenario               | How to reproduce                                 | What you should see                                                                                                              |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Normal success         | Default, or select **Normal**                    | Add a card → "Adding…" → "Added…", card appears once in the list                                                                 |
| Query failure          | Open `/?scenario=query_failure`                  | List shows an error with **Try Again**. Select **Normal**, then press Try Again to recover                                       |
| Rejected before saving | Select **Mutation Rejected**, then add a card    | "Not added." alert, form keeps your values, nothing saved. Select **Normal** and submit again                                    |
| Saved, response lost   | Select **Saved, Response Lost**, then add a card | "We couldn't confirm…" alert, button becomes **Retry**, fields locked. Select **Normal** and press Retry → the card appears once |
| Empty state            | Open `/?scenario=empty_response`                 | "You haven't added any payment methods yet."                                                                                     |

Notes:

- A scenario stays active until you change it. While **Saved, Response Lost** is selected, every Retry is "lost" too (still saved only once), so switch to **Normal** to see the retry complete.
- The delay can only be changed in code: `DEFAULT_SETTINGS` in `src/mock/mockServer.ts`, or `mockApi.setDelay(ms)`.

## How it's built

| Path                             | What it does                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/graphql/schema.graphql`     | GraphQL schema: `paymentMethods` query, `addPaymentMethod(idempotencyKey, input)` mutation |
| `src/graphql/operations.ts`      | Typed operations (handwritten types, no codegen)                                           |
| `src/graphql/errorCodes.ts`      | Error codes shared by client and mock                                                      |
| `src/mock/mockServer.ts`         | In-memory store, scenarios, idempotency records; executes requests against the real schema |
| `src/mock/mockClient.ts`         | Apollo Client with a custom link that sends requests to the mock                           |
| `src/hooks/useAddPaymentForm.ts` | Add/retry state machine and idempotency keys                                               |
| `src/domain/cacheUpdates.ts`     | Cache update after a successful add                                                        |
| `CONTRACT.md`                    | Agreed behaviour between FE and mock BE                                                    |

Card presets (`src/domain/presets.ts`) are a static list shared by the FE and the mock. A preset stands in for the card token a payment provider SDK would give the browser, so the FE never handles card details. The server only validates the preset ID.

## Cache strategy

Apollo's `InMemoryCache` normalises each card by `__typename` + `id`. The server assigns the ID, so it stays stable across responses. The mutation returns the same fields as the list query, so the new card is a complete cache entry. A mutation `update` function then appends it to the cached `paymentMethods` list, but only if no card with that ID is already there. Because of that check, a replayed or repeated response can't create a duplicate. Nothing is refetched after an add. I left out optimistic updates on purpose: when a response is lost, an optimistic card would have to be shown, then hidden, then possibly shown again, which is confusing for a payment method.

## Retries and idempotency

- Each new add gets a fresh key from `crypto.randomUUID()`. The key and input are kept together in the hook's state.
- Errors are sorted into two outcomes:
  - **Rejected:** GraphQL errors with `BAD_USER_INPUT` or `PAYMENT_METHOD_REJECTED`. The server guarantees nothing was saved, so the form stays editable and the next submit is a new operation with a **new key**.
  - **Unresolved:** anything else, such as a network error. The card may or may not be saved. The card and nickname fields are **locked**, and Retry resends the **same key and input**.
- The mock stores each result by key. A retry returns the original card instead of saving a new one. Reusing a key with different input is refused with `IDEMPOTENCY_KEY_REUSED`.
- Double submits are blocked twice over: the button is disabled while pending, and the hook ignores a new request while one is in flight. Neither is what makes retries safe, though. The idempotency key is.

## Tests

- `src/components/PaymentDetails.test.tsx`: integration tests using the real components, Apollo client and mock:
  - validation errors and no request sent;
  - pending → success, with the card added to the cache without a refetch (the list would come back empty if it had been refetched);
  - rejection → values kept → resubmit;
  - saved but response lost → retry, ending with exactly one new card in both the mock store and the visible list.
- `src/mock/mockServer.test.ts`: every mock scenario plus the idempotency rules.

## Known gaps

- **No way to abandon an unresolved add.** The form stays locked until Retry succeeds. That's deliberate: it stops the user from creating a second card while the first one's outcome is unknown. A real app would want a way out, such as checking the list or cancelling.
- **The nickname isn't trimmed before validating.** A spaces-only nickname passes client validation, and the server rejects it, which shows as "Not added."
- **The delay isn't adjustable from the UI.**
- **Generated types:** operation types are handwritten to mirror the schema. Codegen would be the next step.
- **No end-to-end suite** (optional in the brief).

## Micro-frontend note

The screen is self-contained (`PaymentDetails`), so it could be exposed as a remote module, for example through Module Federation, with `react`, `react-dom` and `@apollo/client` shared as singletons. The host would pass in its own `ApolloClient`, so authentication and the real API link stay with the host. The mock link would only be used for local development. The remote would need its styles scoped so they don't leak into the host. It would report events such as "payment method added" back through a callback prop. Its GraphQL operations would be its own versioned contract with the backend.

## Time spent

3 hours 45 minutes, using local timer.

## AI tools used

I wrote these myself:

- **Contract and domain:** the schema, error codes, domain types, card presets and `CONTRACT.md`. The AI helped refine the scenario wording.
- **Add/retry logic:** `useAddPaymentForm`, the error classification (`classifyAddError`), idempotency key creation and button labels.
- **Cache update:** `cacheUpdates.ts`.
- **Components:** the form and its validation, feedback messages, the list and its states, the mock controls panel, and the app wiring (including `?scenario=`).

Claude Code (Claude Opus) was used to:

- generate the mock server, mock Apollo link and their tests from `CONTRACT.md`
- write the typed GraphQL operations
- set up Tailwind and style the screen. It was limited to `className` changes in my components
- write the integration tests for the cases the brief requires. I reviewed them against the scenarios
- draft this README.

How I checked the output:

- typecheck, lint and the test suite after every change
- a manual browser walkthrough of every scenario
- for the retry tests, I broke the code on purpose to confirm the tests catch it. This showed that one suspected bug (a duplicate save on retry) couldn't actually happen, because the hook's guard already blocked it.
