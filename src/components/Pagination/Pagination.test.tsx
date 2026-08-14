/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  afterEach(() => cleanup());

  it("renders nothing when only one page", () => {
    const { container } = render(
      <Pagination currentPage={0} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("navigates between pages", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
        ariaLabel="Pagination test"
      />,
    );

    expect(screen.getByText("2 / 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Page précédente" }));
    fireEvent.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(onPageChange).toHaveBeenCalledWith(0);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
