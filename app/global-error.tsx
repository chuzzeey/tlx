"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FFFFFF", color: "#171717", fontFamily: "Arial, sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <section style={{ maxWidth: "420px" }}>
            <p style={{ fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              A quick pause
            </p>
            <h1 style={{ fontSize: "32px", fontWeight: 400 }}>This page couldn&apos;t load.</h1>
            <p style={{ color: "#666", lineHeight: 1.6 }}>
              Check your connection and try again. Your other pages may still be available.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "16px",
                border: 0,
                borderRadius: "999px",
                background: "#171717",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: "12px 20px",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
