import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  hashFile,
  authenticateHash,
  verifyHash,
  type VerifyResult,
  type AuthenticateResult,
} from "../api";

type Status = "idle" | "hashing" | "authenticating" | "verifying" | "done" | "error";

export default function Verify() {
  const [file, setFile]               = useState<File | null>(null);
  const [hash, setHash]               = useState("");
  const [manualHash, setManualHash]   = useState("");
  const [status, setStatus]           = useState<Status>("idle");
  const [error, setError]             = useState("");
  const [authResult, setAuthResult]   = useState<AuthenticateResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  /* ── helpers ── */
  const reset = () => {
    setStatus("idle"); setError("");
    setAuthResult(null); setVerifyResult(null);
  };

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    reset();
    setHash("");
  }, []);

  /* ── Step 1: hash the file ── */
  const handleHash = async () => {
    if (!file) return;
    reset();
    setStatus("hashing");
    try {
      const result = await hashFile(file);
      setHash(result.hash);
      setStatus("idle");
    } catch (err: unknown) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  /* ── Step 2a: authenticate ── */
  const handleAuthenticate = async () => {
    const h = (hash || manualHash).trim();
    if (!h) return;
    reset();
    setStatus("authenticating");
    try {
      const result = await authenticateHash(h);
      setAuthResult(result);
      setStatus("done");
    } catch (err: unknown) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  /* ── Step 2b: verify ── */
  const handleVerify = async () => {
    const h = (hash || manualHash).trim();
    if (!h) return;
    reset();
    setStatus("verifying");
    try {
      const result = await verifyHash(h);
      setVerifyResult(result);
      setStatus("done");
    } catch (err: unknown) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  const activeHash = hash || manualHash;
  const busy = status === "hashing" || status === "authenticating" || status === "verifying";

  return (
    <div className="section" style={{ minHeight: "100vh" }}>
      <div className="section-inner" style={{ maxWidth: 720 }}>

        {/* Back link */}
        <Link to="/" style={{ fontSize: 14, opacity: 0.6, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          ← Back to Home
        </Link>

        <div className="section-header">
          <p className="section-label">Hashmark</p>
          <h2 className="section-title">Authenticate &amp; Verify Videos</h2>
          <p className="section-desc">
            Upload a video to compute its SHA-256 fingerprint, register it on-chain, or check
            whether a hash has already been authenticated.
          </p>
        </div>

        {/* ── File upload card ── */}
        <div className="tech-card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>1 · Upload &amp; Hash</h3>

          <label
            htmlFor="video-upload"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "2px dashed var(--border)", borderRadius: 12,
              padding: "32px 16px", cursor: "pointer", gap: 8,
              background: file ? "rgba(74,158,219,0.05)" : undefined,
              transition: "background 0.2s",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, opacity: 0.5 }}>
              <path d="M15 10l-4 4-4-4m4 4V3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ opacity: 0.7 }}>{file ? file.name : "Click to choose a video file"}</span>
            {file && <span style={{ fontSize: 12, opacity: 0.5 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</span>}
            <input id="video-upload" type="file" accept="video/*,audio/*" onChange={onFileChange} style={{ display: "none" }} />
          </label>

          <button
            className="btn btn-primary"
            style={{ marginTop: 16, width: "100%" }}
            onClick={handleHash}
            disabled={!file || busy}
          >
            {status === "hashing" ? "Hashing…" : "Compute Hash"}
          </button>

          {hash && (
            <div style={{ marginTop: 16, background: "rgba(62,201,122,0.08)", border: "1px solid rgba(62,201,122,0.3)", borderRadius: 8, padding: "12px 16px" }}>
              <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>SHA-256</p>
              <code style={{ fontSize: 13, wordBreak: "break-all" }}>{hash}</code>
            </div>
          )}
        </div>

        {/* ── Manual hash input ── */}
        <div className="tech-card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>or paste an existing hash</h3>
          <input
            type="text"
            placeholder="e.g. a1b2c3d4…"
            value={manualHash}
            onChange={(e) => { setManualHash(e.target.value); reset(); }}
            style={{
              width: "100%", padding: "10px 14px",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--text)", fontSize: 14, boxSizing: "border-box",
            }}
          />
        </div>

        {/* ── Actions ── */}
        {activeHash && (
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleAuthenticate}
              disabled={busy}
            >
              {status === "authenticating" ? "Authenticating…" : "Authenticate on-chain"}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={handleVerify}
              disabled={busy}
            >
              {status === "verifying" ? "Verifying…" : "Verify on-chain"}
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {status === "error" && (
          <div style={{ background: "rgba(219,74,74,0.1)", border: "1px solid rgba(219,74,74,0.4)", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <strong style={{ color: "#DB4A4A" }}>Error</strong>
            <p style={{ marginTop: 4, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {authResult && status === "done" && (
          <div style={{ background: "rgba(62,201,122,0.08)", border: "1px solid rgba(62,201,122,0.35)", borderRadius: 8, padding: "16px 20px" }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>✅ Authenticated on-chain</p>
            <Row label="Tx Hash"     value={authResult.txHash} />
            <Row label="Block"       value={String(authResult.blockNumber)} />
            <Row label="Creator"     value={authResult.creator} />
            <Row label="Timestamp"   value={new Date(authResult.timestamp * 1000).toLocaleString()} />
            <Row label="Video Hash"  value={authResult.hash} />
          </div>
        )}

        {verifyResult && status === "done" && (
          verifyResult.authenticated ? (
            <div style={{ background: "rgba(62,201,122,0.08)", border: "1px solid rgba(62,201,122,0.35)", borderRadius: 8, padding: "16px 20px" }}>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>✅ Hash is authenticated</p>
              <Row label="Creator"   value={verifyResult.creator!} />
              <Row label="Timestamp" value={new Date(verifyResult.timestamp! * 1000).toLocaleString()} />
              <Row label="Hash"      value={verifyResult.hash} />
            </div>
          ) : (
            <div style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 8, padding: "16px 20px" }}>
              <p style={{ fontSize: 16, fontWeight: 600 }}>⚠️ Not authenticated</p>
              <p style={{ marginTop: 8, opacity: 0.7, fontSize: 14 }}>
                No on-chain proof found for this hash. It has not been registered yet.
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
}

/* small helper row */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 13 }}>
      <span style={{ opacity: 0.55, minWidth: 100 }}>{label}</span>
      <code style={{ wordBreak: "break-all", flex: 1 }}>{value}</code>
    </div>
  );
}
