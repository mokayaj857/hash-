import { Link } from "react-router-dom";
import ThemeToggle from "../Components/ThemeToggle";
import { LogoFull } from "../Components/Logo";

const sections = [
  {
    title: "Abstract",
    content:
      "Era is a Substrate AppChain that anchors digital content to verified devices and decentralized identities (DIDs). It creates cryptographic proofs at capture-time, stores immutable hashes on-chain, and uses a jury-based Context Court to attach human-verified meaning. The result is a ledger of reality that proves what is real without chasing fakes.",
  },
  {
    title: "Problem Statement",
    content:
      "Detection alone cannot win the arms race against generative media. As generative capability grows faster than detection capability, the probability of reliably spotting fakes trends toward zero. Users, journalists, courts, and platforms need a way to prove authenticity instead of guessing at forgery.",
  },
  {
    title: "Design Principles",
    bullets: [
      "Hardware-rooted trust: signatures live in Secure Enclave / Android TEE, never exported.",
      "Identity-first: DIDs with granular rights (Update, Impersonate, Dispute) and device registration.",
      "Immutable proofs: Blake2-256 content IDs plus device ID, block height, signer, and metadata.",
      "Human oracle: juror staking, slashing, and escalation to resolve contextual disputes.",
      "Composable primitives: pallets expose traits so runtimes and other chains can integrate cleanly.",
    ],
  },
  {
    title: "Core Architecture",
    subsections: [
      {
        name: "Identity Registry Pallet",
        bullets: [
          "Creates DIDs and manages signatories with permanent or time-bound rights.",
          "Registers devices per DID; enforces permissions for downstream calls.",
          "Implements DidManager trait for loose coupling with other pallets.",
        ],
      },
      {
        name: "Content Registry Pallet",
        bullets: [
          "Accepts content from accounts holding Impersonate rights for a DID.",
          "Hashes content (Blake2-256) to create ContentId; prevents duplicates.",
          "Records proof: content hash, DID, device ID, block number, metadata, signer.",
          "Stores DID-to-content indexes for efficient lookup.",
        ],
      },
      {
        name: "Context Court Pallet",
        bullets: [
          "Dispute system for content meaning; requires Dispute right to open cases.",
          "Randomly summons jurors from a staked pool; tracks votes (Yay/Nay/Abstain).",
          "Escalates tied sessions to the full juror set; batches rewards and slashes on finalize.",
          "Emphasizes economic security (deposits, slashing) and randomness (upgradable to VRF).",
        ],
      },
    ],
  },
  {
    title: "Data Flows",
    bullets: [
      "Capture: Device hashes media and signs inside secure silicon. Client uploads media to IPFS (planned) and broadcasts hash + DID + signature + metadata.",
      "Registration: Identity Registry checks rights and device membership. Content Registry prevents duplicates and records immutable proof.",
      "Context Disputes: Accounts with Dispute rights open a case for a ContentId. Context Court summons jurors, records votes, escalates ties, and processes rewards/slashes.",
      "Verification: Verifiers recompute hashes, read on-chain proofs, and reference court outcomes to display trust badges.",
    ],
  },
  {
    title: "Security Model",
    bullets: [
      "Immutability: proofs are append-only; updates require new content IDs.",
      "Bounded storage: bounded vectors and double-maps limit state growth and weight.",
      "Economic incentives: deposits for DID creation and juror staking; slashing for non-participation or misbehavior.",
      "Randomness: on-chain randomness for juror selection; future VRF upgrade path.",
      "Permission checks: Update, Impersonate, and Dispute rights enforced for all critical actions.",
    ],
  },
  {
    title: "Roadmap",
    bullets: [
      "Mobile capture app with Secure Enclave / TEE integration.",
      "IPFS integration for content pinning.",
      "Public API and SDK for verification and content lookup.",
      "Cross-chain verification via XCM.",
      "Juror reputation system to weight voting and rewards.",
      "Firmware-level integrations with device manufacturers.",
    ],
  },
  {
    title: "Use Cases",
    bullets: [
      "Verified journalism and OSINT: authenticity guarantees for field media.",
      "Legal and insurance: evidentiary trails bound to DIDs and devices.",
      "Creator and marketplace trust: authenticity badges (\"Verified by Era\").",
      "Scientific data integrity: hash-and-prove datasets at collection time.",
      "Cross-chain truth: other parachains and L1s read Era proofs without new trust assumptions.",
    ],
  },
  {
    title: "Conclusion",
    content:
      "Era is open to contributors, integrators, and early capture partners. Fork the pallets, wire the DidManager trait into your runtime, or build verification badges on top of the on-chain events. If it matters, it is on Era.",
  },
];

export default function WhitepaperPage() {
  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <LogoFull height={32} />
          </Link>
          <div className="nav-links">
            <Link to="/#technology" className="nav-link">Technology</Link>
            <Link to="/#solutions" className="nav-link">Solutions</Link>
            <Link to="/#about" className="nav-link">About</Link>
            <Link to="/#explore" className="nav-link">Explore</Link>
            <Link to="/whitepaper" className="nav-cta">Whitepaper</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="whitepaper-hero">
        <div className="hero-badge">Era Whitepaper</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>
          Proof-of-Reality for a Post-Deepfake Internet
        </h1>
        <p className="hero-sub" style={{ maxWidth: 700, margin: "0 auto 32px" }}>
          This document describes the Era protocol: how we bind content to devices, enforce
          identity rights, and use a human oracle to resolve context disputes.
        </p>
        <div className="hero-buttons">
          <a href="/whitepaper.md" download className="btn btn-primary">
            Download Whitepaper
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </a>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </section>

      {/* Content */}
      <div className="whitepaper-content">
        {sections.map((section) => (
          <section className="wp-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.content && <p>{section.content}</p>}
            {section.bullets && (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.subsections &&
              section.subsections.map((sub) => (
                <div key={sub.name} style={{ marginTop: 32 }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
                    {sub.name}
                  </h3>
                  <ul>
                    {sub.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-bottom" style={{ borderTop: "none", paddingTop: 0 }}>
            <p className="footer-copy">© 2025 Era. If it matters, it&apos;s on Era.</p>
            <div className="footer-socials">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

