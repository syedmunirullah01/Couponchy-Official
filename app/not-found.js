import Link from "next/link";

export const metadata = {
  title: "404 – Page Not Found",
  description: "The page you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#030305",
        padding: "0 24px",
        textAlign: "center",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: "50%",
          top: "25%",
          width: 700,
          height: 500,
          transform: "translate(-50%, -50%)",
          borderRadius: "9999px",
          background: "rgba(139,92,246,0.06)",
          filter: "blur(140px)",
        }}
      />
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          bottom: "25%",
          right: "25%",
          width: 400,
          height: 300,
          borderRadius: "9999px",
          background: "rgba(88,28,135,0.12)",
          filter: "blur(100px)",
        }}
      />

      {/* Grid overlay */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: 0.025,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Watermark */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          userSelect: "none",
          textAlign: "center",
          fontSize: "22vw",
          fontWeight: 900,
          textTransform: "uppercase",
          lineHeight: 1,
          letterSpacing: "-0.05em",
          color: "rgba(255,255,255,0.025)",
        }}
      >
        404
      </div>

      {/* Main Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* 404 Number */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              display: "block",
              fontSize: 120,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(139,92,246,0.3))",
            }}
          >
            404
          </span>
          <div
            style={{
              margin: "4px auto 0",
              height: 1,
              width: 96,
              background:
                "linear-gradient(to right, transparent, rgba(139,92,246,0.6), transparent)",
            }}
          />
        </div>

        {/* Badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 9999,
            border: "1px solid rgba(139,92,246,0.2)",
            background: "rgba(139,92,246,0.08)",
            padding: "6px 16px",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#a78bfa",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "9999px",
              background: "#a78bfa",
            }}
          />
          Page Not Found
        </span>

        {/* Title */}
        <h1
          style={{
            maxWidth: 420,
            fontSize: 24,
            fontWeight: 900,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Oops! This page doesn&apos;t exist
        </h1>

        {/* Description */}
        <p
          style={{
            maxWidth: 380,
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.7,
            fontWeight: 500,
            margin: 0,
          }}
        >
          The link you followed may be broken, or the page may have been
          removed. Let us take you somewhere useful.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              height: 44,
              padding: "0 28px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(139,92,246,0.25)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: 16, height: 16 }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Website
          </Link>

          <Link
            href="/stores"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 44,
              padding: "0 24px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              textDecoration: "none",
            }}
          >
            Browse All Stores
          </Link>
        </div>

        {/* Divider */}
        <div
          style={{
            marginTop: 16,
            height: 1,
            width: 128,
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)",
          }}
        />

        {/* Footer note */}
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            fontWeight: 500,
            margin: 0,
          }}
        >
          Best Deals &amp; Coupon Codes
        </p>
      </div>
    </div>
  );
}
