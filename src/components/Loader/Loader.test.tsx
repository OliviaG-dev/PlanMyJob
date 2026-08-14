/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Loader from "./Loader";

describe("Loader", () => {
  afterEach(() => cleanup());

  it("renders status with custom label", () => {
    render(<Loader label="Chargement des candidatures" />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Chargement des candidatures")).toBeTruthy();
  });
});
