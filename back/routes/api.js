"use strict";

const express  = require("express");
const crypto   = require("crypto");
const QRCode   = require("qrcode");
const { ethers } = require("ethers");
const { upload }           = require("../middleware/upload");
const { getContractSetup } = require("../config/contract");

const router = express.Router();

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/health
   Quick liveness check.
───────────────────────────────────────────────────────────────────────────── */
router.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/hash/file
   Upload a file (multipart/form-data, field name "file") and receive its
   SHA-256 hex digest.  The hash can then be passed to /api/authenticate.

   Response: { hash: string, filename: string, size: number, mimetype: string }
───────────────────────────────────────────────────────────────────────────── */
router.post("/hash/file", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Use multipart field name 'file'." });
  }

  const hash = crypto
    .createHash("sha256")
    .update(req.file.buffer)
    .digest("hex");

  res.json({
    hash,
    filename: req.file.originalname,
    size:     req.file.size,
    mimetype: req.file.mimetype,
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/hash/raw
   Hash a raw string (e.g. a hex IPFS CID or custom identifier).
   Body (JSON): { value: string }

   Response: { hash: string }
───────────────────────────────────────────────────────────────────────────── */
router.post("/hash/raw", express.json(), (req, res) => {
  const { value } = req.body || {};
  if (typeof value !== "string" || !value.trim()) {
    return res.status(400).json({ error: "Body must contain a non-empty 'value' string." });
  }

  const hash = crypto.createHash("sha256").update(value.trim()).digest("hex");
  res.json({ hash });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/authenticate
   Store a video hash on-chain via the server wallet (requires PRIVATE_KEY).
   Body (JSON): { hash: string }

   If PRIVATE_KEY is not configured, returns 503 with instructions for client
   signing.

   Response: { txHash: string, blockNumber: number, creator: string, timestamp: number }
───────────────────────────────────────────────────────────────────────────── */
router.post("/authenticate", express.json(), async (req, res) => {
  const { hash } = req.body || {};
  if (typeof hash !== "string" || !hash.trim()) {
    return res.status(400).json({ error: "Body must contain a non-empty 'hash' string." });
  }

  const { contract, signer } = getContractSetup();

  if (!signer) {
    return res.status(503).json({
      error: "Server wallet not configured (PRIVATE_KEY missing). Sign the transaction from your client wallet.",
      clientSigning: true,
      contractAddress: process.env.CONTRACT_ADDRESS || "",
    });
  }

  try {
    const tx = await contract.authenticateVideo(hash.trim());
    const receipt = await tx.wait();

    res.json({
      txHash:      receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      creator:     await signer.getAddress(),
      timestamp:   Math.floor(Date.now() / 1000),
      hash:        hash.trim(),
    });
  } catch (err) {
    // Handle "Already authenticated" revert cleanly
    if (err?.reason?.includes("Already authenticated") || err?.message?.includes("Already authenticated")) {
      return res.status(409).json({ error: "Hash already authenticated on-chain.", hash: hash.trim() });
    }
    console.error("[authenticate]", err);
    res.status(500).json({ error: "Transaction failed.", detail: err.reason || err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/verify/:hash
   Read the on-chain proof for a video hash.

   Response: { authenticated: true, creator: string, timestamp: number, hash: string }
         or: { authenticated: false, hash: string }
───────────────────────────────────────────────────────────────────────────── */
router.get("/verify/:hash", async (req, res) => {
  const hash = req.params.hash?.trim();
  if (!hash) {
    return res.status(400).json({ error: "Hash parameter is required." });
  }

  const { contract } = getContractSetup();

  try {
    const [creator, timestamp] = await contract.verifyVideo(hash);
    res.json({
      authenticated: true,
      creator,
      timestamp: Number(timestamp),
      hash,
    });
  } catch (err) {
    // "Not authenticated" is a normal / expected revert
    if (err?.reason?.includes("Not authenticated") || err?.message?.includes("Not authenticated")) {
      return res.json({ authenticated: false, hash });
    }
    console.error("[verify]", err);
    res.status(500).json({ error: "Verification failed.", detail: err.reason || err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/info
   Return contract address and whether the server wallet is configured.
───────────────────────────────────────────────────────────────────────────── */
router.get("/info", (_req, res) => {
  const { signer } = getContractSetup();
  res.json({
    contractAddress:    process.env.CONTRACT_ADDRESS || null,
    rpcUrl:             process.env.RPC_URL           || null,
    serverWallet:       signer ? (/** @type {import("ethers").Wallet} */ (signer)).address : null,
    serverSigning:      !!signer,
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/stats
   Live on-chain stats: total proofs authenticated + 5 most-recent proofs.
   Returns zeros gracefully when the node is unreachable.
───────────────────────────────────────────────────────────────────────────── */
router.get("/stats", async (_req, res) => {
  const { contract, provider } = getContractSetup();
  try {
    const filter = contract.filters.VideoAuthenticated();
    const [events, blockNumber] = await Promise.all([
      contract.queryFilter(filter),
      provider.getBlockNumber(),
    ]);

    const recent = events
      .slice(-5)
      .reverse()
      .map((e) => ({
        videoHash:   e.args.videoHash,
        creator:     e.args.creator,
        timestamp:   Number(e.args.timestamp),
        blockNumber: Number(e.blockNumber),
        txHash:      e.transactionHash,
      }));

    res.json({ totalProofs: events.length, recentProofs: recent, blockNumber: Number(blockNumber) });
  } catch (err) {
    // Node not running — return safe zeros rather than an error
    if (err.code === "ECONNREFUSED" || err.code === "SERVER_ERROR") {
      return res.json({ totalProofs: 0, recentProofs: [], blockNumber: 0, offline: true });
    }
    console.error("[stats]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/recent?limit=20
   Paginated list of VideoAuthenticated events, newest first.
───────────────────────────────────────────────────────────────────────────── */
router.get("/recent", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { contract, provider } = getContractSetup();
  try {
    const filter = contract.filters.VideoAuthenticated();
    const [events, blockNumber] = await Promise.all([
      contract.queryFilter(filter),
      provider.getBlockNumber(),
    ]);

    const proofs = events
      .slice(-limit)
      .reverse()
      .map((e) => ({
        videoHash:   e.args.videoHash,
        creator:     e.args.creator,
        timestamp:   Number(e.args.timestamp),
        blockNumber: Number(e.blockNumber),
        txHash:      e.transactionHash,
      }));

    res.json({ proofs, total: events.length, blockNumber: Number(blockNumber) });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "SERVER_ERROR") {
      return res.json({ proofs: [], total: 0, blockNumber: 0, offline: true });
    }
    console.error("[recent]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/qr/:hash
   Generate a QR code PNG (data URL) linking to the verify page for this hash.
   The verify URL is: FRONTEND_URL/verify?hash=<hash>
───────────────────────────────────────────────────────────────────────────── */
router.get("/qr/:hash", async (req, res) => {
  const hash = req.params.hash?.trim();
  if (!hash) return res.status(400).json({ error: "Hash parameter is required." });

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const verifyUrl   = `${frontendUrl}/verify?hash=${encodeURIComponent(hash)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.json({ qrDataUrl, verifyUrl, hash });
  } catch (err) {
    console.error("[qr]", err);
    res.status(500).json({ error: "QR code generation failed.", detail: err.message });
  }
});

module.exports = router;
