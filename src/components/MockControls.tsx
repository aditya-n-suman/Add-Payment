import { useCallback, useState } from "react";
import { SCENARIO_DETAILS, SCENARIO_NAMES } from "../constants";
import { SCENARIOS, type MockApi, type Scenario } from "../mock/mockServer";

interface MockControlsProps {
	api: MockApi;
}
const MockControls = ({ api }: MockControlsProps) => {
	const [selectedScenario, updateScenario] = useState<Scenario>(
		api.getScenario(),
	);
	const handleScenarioChange = useCallback(
		(scenario: Scenario) => {
			updateScenario(scenario);
			api.setScenario(scenario);
		},
		[api],
	);

	return (
		<aside
			aria-labelledby="mock-controls-heading"
			className="w-88 rounded-md border border-dashed border-neutral-300 bg-white px-6 py-8 text-sm"
		>
			<h2 id="mock-controls-heading" className="mb-4 text-xl font-semibold">
				Mock API Controls
			</h2>
			<fieldset className="space-y-2">
				<legend className="mb-1">Scenarios:</legend>
				{SCENARIOS.map((scenario) => (
					<label key={scenario} className="flex items-start gap-2">
						<input
							className="mt-1"
							type="radio"
							name="scenario"
							value={scenario}
							checked={selectedScenario === scenario}
							onChange={() => handleScenarioChange(scenario)}
						/>
						<span>
							<strong>{SCENARIO_NAMES[scenario]}</strong> -{" "}
							{SCENARIO_DETAILS[scenario]}
						</span>
					</label>
				))}
			</fieldset>
			<p className="mt-4 text-neutral-600">
				Reload with{" "}
				<a className="text-blue-700 underline" href="?scenario=empty_response">
					?scenario=empty-response
				</a>{" "}
				for the empty state, or{" "}
				<a className="text-blue-700 underline" href="?scenario=query_failure">
					?scenario=query-failure
				</a>{" "}
				to fail the first load.
			</p>
		</aside>
	);
};

export default MockControls;
