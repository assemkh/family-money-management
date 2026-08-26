"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          background: "#f7f5ef",
          color: "#17211b",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: "1rem",
        }}
      >
        <main
          style={{
            background: "white",
            border: "1px solid #dedbd2",
            borderRadius: "1.25rem",
            boxShadow: "0 20px 50px rgb(31 41 35 / 10%)",
            maxWidth: "28rem",
            padding: "2rem",
            textAlign: "center",
            width: "100%",
          }}
        >
          <title>Something went wrong | Family Money Management</title>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>We hit a problem.</h1>
          <p style={{ color: "#667069", lineHeight: 1.6, margin: "0.75rem 0 0" }}>
            Your saved financial data was not changed. Try loading the workspace again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#24553d",
              border: 0,
              borderRadius: "0.75rem",
              color: "white",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 700,
              marginTop: "1.5rem",
              minHeight: "2.75rem",
              padding: "0 1.25rem",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
