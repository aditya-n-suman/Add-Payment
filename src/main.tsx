import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createMockClient } from "./mock/mockClient";
import { isScenario, mockApi } from "./mock/mockServer";

const api = mockApi;
const client = createMockClient();
if (window.location.search.includes("scenario=")) {
	const scenario = new URLSearchParams(window.location.search).get("scenario");
	if (scenario && isScenario(scenario)) {
		api.setScenario(scenario);
	}
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App client={client} api={api} />
	</StrictMode>,
);
