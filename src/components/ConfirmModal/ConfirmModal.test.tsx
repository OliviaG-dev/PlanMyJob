/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConfirmModal from "./ConfirmModal";

describe("ConfirmModal", () => {
  afterEach(() => cleanup());

  it("renders nothing when closed", () => {
    render(
      <ConfirmModal
        isOpen={false}
        title="Titre"
        message="Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls confirm and cancel handlers", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        isOpen
        title="Supprimer"
        message="Action irréversible"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
