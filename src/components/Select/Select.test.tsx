/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "", label: "Toutes" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
];

describe("Select component", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens list and selects an option", () => {
    const onChange = vi.fn();
    render(
      <Select
        id="source"
        label="Source"
        value=""
        options={options}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    fireEvent.click(screen.getByRole("option", { name: "LinkedIn" }));

    expect(onChange).toHaveBeenCalledWith("linkedin");
  });

  it("closes on Escape", () => {
    render(
      <Select
        id="source"
        label="Source"
        value=""
        options={options}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    expect(screen.getByRole("listbox")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("supports controlled open state", () => {
    const onOpenChange = vi.fn();
    render(
      <Select
        id="source"
        label="Source"
        value=""
        options={options}
        onChange={vi.fn()}
        openId="source"
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    expect(onOpenChange).toHaveBeenCalledWith(null);
  });
});
