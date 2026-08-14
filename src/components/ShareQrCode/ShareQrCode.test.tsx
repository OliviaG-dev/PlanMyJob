/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareQrCode from "./ShareQrCode";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
  },
}));

describe("ShareQrCode", () => {
  afterEach(() => cleanup());

  it("renders QR image when generation succeeds", async () => {
    render(<ShareQrCode url="https://example.com/share/abc" />);

    await waitFor(() => {
      expect(document.querySelector(".share-qr__image")).toBeTruthy();
    });
    expect(screen.getByText("Scanner pour ouvrir le lien")).toBeTruthy();
  });
});
