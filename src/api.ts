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
