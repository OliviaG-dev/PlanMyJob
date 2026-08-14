/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DashboardDonutChart from "./DashboardDonutChart";

describe("DashboardDonutChart", () => {
  afterEach(() => cleanup());

  it("shows empty state when total is zero", () => {
    render(<DashboardDonutChart segments={[]} />);
    expect(screen.getByText("Aucune donnée")).toBeTruthy();
  });

  it("renders svg segments when data exists", () => {
    const { container } = render(
      <DashboardDonutChart
        segments={[
          { label: "CV envoyé", value: 3, color: "#4a90e2" },
          { label: "Entretien", value: 1, color: "#7b68ee" },
        ]}
      />,
    );
    expect(container.querySelector(".dashboard__donut-svg")).toBeTruthy();
  });
});
