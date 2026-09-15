import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "Print the review QR code | Navratri Handmade Jewellery" },
      {
        name: "description",
        content:
          "Show or print this QR code at the stall so shoppers can scan and leave a rating, review and photo of their handmade jewellery purchase.",
      },
      { property: "og:title", content: "Print the review QR code" },
      {
        property: "og:description",
        content: "A scannable QR code that takes shoppers straight to the review page.",
      },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.origin + "/");
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-primary">Navratri stall</p>
      <h1 className="mt-3 text-4xl font-semibold">Scan to leave a review</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Print this page or show it on a phone at the stall. Scanning opens the review form.
      </p>

      <div className="panel mt-9 p-8">
        <div className="rounded-xl bg-foreground p-5">
          {url ? (
            <QRCodeSVG value={url} size={240} level="M" marginSize={0} />
          ) : (
            <div className="size-[240px]" />
          )}
        </div>
        <p className="mt-5 break-all text-xs text-muted-foreground">{url}</p>
      </div>

      <Link
        to="/"
        className="mt-8 rounded-full border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
      >
        Open the review page
      </Link>
    </main>
  );
}
