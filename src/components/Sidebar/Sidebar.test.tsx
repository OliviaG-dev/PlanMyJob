/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

describe("Sidebar", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      signOut: vi.fn(),
    } as never);
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
    } as never);
  });

  it("renders navigation links", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Tableau de bord" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Candidatures" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Analyse" })).toBeTruthy();
  });

  it("calls onClose from overlay", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar isOpen onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fermer le menu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
