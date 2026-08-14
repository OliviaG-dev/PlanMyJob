/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./Layout";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

describe("Layout", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ signOut: vi.fn() } as never);
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
    } as never);
  });

  it("opens sidebar from menu button and renders outlet", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<p>Dashboard content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard content")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu" }));
    expect(screen.getByRole("button", { name: "Fermer le menu" })).toBeTruthy();
  });
});
