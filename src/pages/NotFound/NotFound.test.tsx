/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import NotFound from "./NotFound";

describe("NotFound", () => {
  afterEach(() => cleanup());

  it("renders home link", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Retour à l’accueil" })).toBeTruthy();
  });
});
