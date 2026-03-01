#!/usr/bin/env node
/**
 * Deploy Hashmark contract using Foundry (forge create).
 *
 * Usage:
 *   npm run node:local          → starts anvil (separate terminal)
 *   npm run deploy:local        → deploys to localhost anvil
 *   npm run deploy:sepolia      → deploys to Sepolia testnet
 *
 * Auto-updates back/.env and root .env with the deployed contract address.
 */

"use strict";
require("dotenv").config();

const { execSync } = require("child_process");
const fs           = require("fs");
const path         = require("path");

const NETWORK = process.argv[2] || "local";

const RPC = {
  local:   process.env.RPC_URL      || "http://127.0.0.1:8545",
  sepolia: process.env.SEPOLIA_RPC_URL || "",
}[NETWORK];

const KEY = process.env.DEPLOY_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

if (!RPC) {
  console.error(`\n❌  No RPC URL for network "${NETWORK}".`);
  console.error(`    Set SEPOLIA_RPC_URL in back/.env for Sepolia.\n`);
  process.exit(1);
}
if (!KEY) {
  console.error("\n❌  No private key found.");
  console.error("    Set DEPLOY_PRIVATE_KEY (or PRIVATE_KEY) in back/.env\n");
  console.error("    For local testing, anvil prints 10 funded accounts — use one of those keys.\n");
  process.exit(1);
}

console.log("\n═══════════════════════════════════════════════════════");
console.log("  Hashmark Protocol — Foundry Deploy");
console.log(`  Network : ${NETWORK}  (${RPC})`);
console.log("═══════════════════════════════════════════════════════\n");

let output;
try {
  output = execSync(
    `forge create contracts/Hashmark.sol:Hashmark` +
    ` --rpc-url "${RPC}"` +
    ` --private-key "${KEY}"` +
    ` --broadcast`,
    { cwd: path.join(__dirname, ".."), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  );
} catch (err) {
  console.error("❌  forge create failed:\n", err.stderr || err.message);
  process.exit(1);
}

console.log(output);

// Parse deployed address from forge output
const match = output.match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/);
if (!match) {
  console.error("❌  Could not parse deployed address from forge output.");
  process.exit(1);
}
const address = match[1];

// ── Auto-patch back/.env ──
function patchEnv(filePath, key, value) {
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const re = new RegExp(`^${key}=.*`, "m");
  if (re.test(content)) {
    content = content.replace(re, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
  fs.writeFileSync(filePath, content);
}

const backEnv  = path.join(__dirname, "../.env");
const rootEnv  = path.join(__dirname, "../../.env");

patchEnv(backEnv, "CONTRACT_ADDRESS", address);
patchEnv(rootEnv, "VITE_CONTRACT_ADDRESS", address);

// Sync ABI from forge out/ to back/abi and src/abi
try {
  const forgeAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../out/Hashmark.sol/Hashmark.json"), "utf8")
  ).abi;
  const abiStr = JSON.stringify(forgeAbi, null, 2);
  fs.writeFileSync(path.join(__dirname, "../abi/Hashmark.json"),       abiStr);
  fs.writeFileSync(path.join(__dirname, "../../src/abi/Hashmark.json"), abiStr);
  console.log("✅  ABI synced to back/abi/ and src/abi/");
} catch {
  console.warn("⚠️  ABI sync skipped (forge out/ not found — run forge build first).");
}

console.log("\n✅  Contract deployed:", address);
console.log("📝  .env files updated automatically.\n");
console.log("═══════════════════════════════════════════════════════");
console.log("  Next steps:");
console.log("  1. Restart backend : cd back && npm start");
console.log("  2. Restart frontend: npm run dev  (from project root)");
console.log("═══════════════════════════════════════════════════════\n");
