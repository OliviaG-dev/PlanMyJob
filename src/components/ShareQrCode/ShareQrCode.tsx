import { useEffect, useState } from "react";
import QRCode from "qrcode";
import "./ShareQrCode.css";

type ShareQrCodeProps = {
  url: string;
  label?: string;
};

function ShareQrCode({ url, label = "Scanner pour ouvrir le lien" }: ShareQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      color: { dark: "#3d3836", light: "#ffffff" },
    })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de générer le QR code"
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <figure className="share-qr">
      {dataUrl ? (
        <img src={dataUrl} alt="" className="share-qr__image" aria-hidden />
      ) : error ? (
        <p className="share-qr__error" role="alert">
          {error}
        </p>
      ) : (
        <div className="share-qr__placeholder" aria-hidden />
      )}
      <figcaption className="share-qr__label">{label}</figcaption>
    </figure>
  );
}

export default ShareQrCode;
