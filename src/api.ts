// Frontend API client for Hashmark backend
// All endpoints route through the Vite proxy at /api → http://localhost:4000/api

const BASE = "/api";

export interface HashFileResult {
  hash: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface AuthenticateResult {
  txHash: string;
  blockNumber: number;
  creator: string;
  timestamp: number;
  hash: string;
}

export interface VerifyResult {
  authenticated: boolean;
  creator?: string;
  timestamp?: number;
  hash: string;
}

export interface InfoResult {
  contractAddress: string | null;
  rpcUrl: string | null;
  serverWallet: string | null;
  serverSigning: boolean;
}

export interface ProofEvent {
  videoHash: string;
  creator: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface StatsResult {
  totalProofs: number;
  recentProofs: ProofEvent[];
  blockNumber: number;
  offline?: boolean;
}

export interface RecentResult {
  proofs: ProofEvent[];
  total: number;
  blockNumber: number;
  offline?: boolean;
}

export interface QrResult {
  qrDataUrl: string;
  verifyUrl: string;
  hash: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

/** Upload a file and compute its SHA-256 hash on the server. */
export async function hashFile(file: File): Promise<HashFileResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/hash/file`, { method: "POST", body: form });
  return handleResponse<HashFileResult>(res);
}

/** Hash a raw string value. */
export async function hashRaw(value: string): Promise<{ hash: string }> {
  const res = await fetch(`${BASE}/hash/raw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  return handleResponse<{ hash: string }>(res);
}

/**
 * Authenticate a video hash on-chain via the server wallet.
 * Returns 503 + { clientSigning: true } when server has no private key.
 */
export async function authenticateHash(hash: string): Promise<AuthenticateResult> {
  const res = await fetch(`${BASE}/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
  });
  return handleResponse<AuthenticateResult>(res);
}

/** Verify whether a hash has been authenticated on-chain. */
export async function verifyHash(hash: string): Promise<VerifyResult> {
  const res = await fetch(`${BASE}/verify/${encodeURIComponent(hash)}`);
  return handleResponse<VerifyResult>(res);
}

/** Get live on-chain stats: total proofs + 5 most recent. */
export async function getStats(): Promise<StatsResult> {
  const res = await fetch(`${BASE}/stats`);
  return handleResponse<StatsResult>(res);
}

/** Get paginated list of recent VideoAuthenticated events. */
export async function getRecent(limit = 20): Promise<RecentResult> {
  const res = await fetch(`${BASE}/recent?limit=${limit}`);
  return handleResponse<RecentResult>(res);
}

/** Get a QR code data URL linking to the verify page for a hash. */
export async function getQrCode(hash: string): Promise<QrResult> {
  const res = await fetch(`${BASE}/qr/${encodeURIComponent(hash)}`);
  return handleResponse<QrResult>(res);
}

/** Get backend / contract info. */
export async function getInfo(): Promise<InfoResult> {
  const res = await fetch(`${BASE}/info`);
  return handleResponse<InfoResult>(res);
}

/** Check backend health. */
export async function healthCheck(): Promise<{ ok: boolean; timestamp: number }> {
  const res = await fetch(`${BASE}/health`);
  return handleResponse(res);
}
