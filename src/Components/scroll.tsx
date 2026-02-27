import { Link } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

const technology = [
  {
    icon: "🆔",
    title: "Identity Registry",
    description:
      "Manage decentralized identifiers (DIDs) with granular rights: Update, Impersonate, and Dispute. Register devices for hardware-rooted trust.",
    features: ["DIDs", "Rights System", "Device Binding", "Temporal Permissions"],
  },
  {
    icon: "📄",
    title: "Content Registry",
    description:
      "Store immutable cryptographic proofs of content authenticity. Blake2-256 hashes bind media to DIDs and verified devices.",
    features: ["Blake2-256", "Proof Storage", "DID Binding", "Tamper Detection"],
  },
  {
    icon: "⚖️",
    title: "Context Court",
    description:
      "Decentralized jury system for dispute resolution. Staking, voting, and escalation ensure honest human verification of content context.",
    features: ["Jury Selection", "Staking", "Escalation", "Batch Rewards"],
  },
];

const solutions = [
  {
    icon: "📰",
    title: "Verified Journalism",
    description:
      "News organizations can require proof-backed media to defend against impersonation, claim spoofing, and AI-generated misinformation.",
  },
  {
    icon: "⚖️",
    title: "Legal & Insurance",
    description:
      "Create immutable evidence trails with DID-bound devices and timestamps. Prove authenticity in courts and claims processing.",
  },
  {
    icon: "🎨",
    title: "Creator Authenticity",
    description:
      "Marketplaces and platforms can badge listings with \"Verified by Era\" signatures to prevent counterfeit digital goods.",
  },
  {
    icon: "🔬",
    title: "Scientific Integrity",
    description:
      "Hash-and-prove research datasets at collection time. Ensure reproducibility and prevent data manipulation in studies.",
  },
];

const roadmap = [
  {
    status: "design",
    title: "Mobile Capture App",
    description: "Secure Enclave / TEE integration for hardware-rooted signing at capture.",
  },
  {
    status: "planned",
    title: "IPFS Integration",
    description: "Pin verified media off-chain while anchoring integrity proofs on-chain.",
  },
  {
    status: "planned",
    title: "API & SDK",
    description: "Expose verification, content lookup, and DID permissioning to third-party apps.",
  },
  {
    status: "research",
    title: "Cross-chain via XCM",
    description: "Let parachains and external chains attest to Era proofs trustlessly.",
  },
  {
    status: "research",
    title: "Juror Reputation",
    description: "Score juror performance to harden the Context Court against collusion.",
  },
  {
    status: "research",
    title: "Firmware Integration",
    description: "Embed signing at the OS or firmware level for born-authentic media.",
  },
];

const explore = [
  { title: "Whitepaper", description: "Deep dive into protocol design", href: "/whitepaper" },
  { title: "GitHub", description: "Explore the open-source code", href: "https://github.com" },
  { title: "Substrate Docs", description: "Learn the underlying framework", href: "https://docs.substrate.io" },
  { title: "Polkadot SDK", description: "Build parachains with Polkadot", href: "https://paritytech.github.io/polkadot-sdk" },
];

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">The Ledger of Reality</div>
        <h1>
          Prove what is <span className="gradient">real</span> at the moment of creation
        </h1>
        <p className="hero-sub">
          Era is a Substrate-based AppChain that binds digital content to verified devices and
          decentralized identities. Hardware-secured signatures, immutable proofs, and human
          context resolution form a permanent ledger of authenticity.
        </p>
        <div className="hero-buttons">
          <Link to="/whitepaper" className="btn btn-primary">
            Read the Whitepaper
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link to="#technology" className="btn btn-secondary">
            Explore Technology
          </Link>
        </div>
      </section>

      {/* Trusted By */}
      <section className="trusted">
        <div className="trusted-inner">
          <p className="trusted-label">Built with battle-tested technology</p>
          <div className="trusted-logos">
            {/* Substrate */}
            <div className="trusted-logo">
              <svg width="140" height="32" viewBox="0 0 140 32" fill="currentColor">
                <path d="M16 2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4zm0 10c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4zm0 10c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4zM26 2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4zm0 10c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4z"/>
                <text x="36" y="22" fontSize="16" fontWeight="600" fontFamily="var(--font-sans)">Substrate</text>
              </svg>
            </div>
            {/* Polkadot */}
            <div className="trusted-logo">
              <svg width="150" height="32" viewBox="0 0 150 32" fill="currentColor">
                <circle cx="16" cy="16" r="6" />
                <circle cx="16" cy="4" r="3" />
                <circle cx="16" cy="28" r="3" />
                <circle cx="6" cy="10" r="3" />
                <circle cx="26" cy="10" r="3" />
                <circle cx="6" cy="22" r="3" />
                <circle cx="26" cy="22" r="3" />
                <text x="36" y="22" fontSize="16" fontWeight="600" fontFamily="var(--font-sans)">Polkadot SDK</text>
              </svg>
            </div>
            {/* Rust */}
            <div className="trusted-logo">
              <svg width="80" height="32" viewBox="0 0 80 32" fill="currentColor">
                <g transform="translate(4, 4)">
                  <path d="M12 0l2.5 4.5L19 2l-1.5 5 5 1.5L19 12l4.5 2.5-4.5 2.5 3.5 3.5-5 1.5L19 26l-4.5-2.5L12 28l-2.5-4.5L5 26l1.5-5-5-1.5L5 16 .5 13.5 5 11 1.5 7.5l5-1.5L5 2l4.5 2.5L12 0z" fillOpacity="0.9"/>
                  <circle cx="12" cy="14" r="6" fill="var(--bg)"/>
                  <text x="10" y="18" fontSize="8" fontWeight="700" fill="currentColor">R</text>
                </g>
                <text x="32" y="22" fontSize="16" fontWeight="600" fontFamily="var(--font-sans)">Rust</text>
              </svg>
            </div>
            {/* Blake2 */}
            <div className="trusted-logo">
              <svg width="100" height="32" viewBox="0 0 100 32" fill="currentColor">
                <g transform="translate(2, 4)">
                  <rect x="0" y="0" width="6" height="24" rx="1"/>
                  <rect x="8" y="4" width="6" height="20" rx="1"/>
                  <rect x="16" y="8" width="6" height="16" rx="1"/>
                  <rect x="16" y="0" width="6" height="4" rx="1"/>
                </g>
                <text x="32" y="22" fontSize="16" fontWeight="600" fontFamily="var(--font-sans)">Blake2</text>
              </svg>
            </div>
            {/* FRAME */}
            <div className="trusted-logo">
              <svg width="100" height="32" viewBox="0 0 100 32" fill="currentColor">
                <g transform="translate(2, 2)">
                  <rect x="0" y="0" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                  <rect x="6" y="6" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <rect x="11" y="11" width="6" height="6" rx="1"/>
                </g>
                <text x="36" y="22" fontSize="16" fontWeight="600" fontFamily="var(--font-sans)">FRAME</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Technology</p>
            <h2 className="section-title">The Era Protocol Stack</h2>
            <p className="section-desc">
              Three modular pallets work together to provide end-to-end content verification—from
              identity management to dispute resolution.
            </p>
          </div>
          <div className="tech-grid">
            {technology.map((item) => (
              <div className="tech-card" key={item.title}>
                <div className="tech-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="tech-features">
                  {item.features.map((f) => (
                    <span className="tech-feature" key={f}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="section arch">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">How It Works</p>
            <h2 className="section-title">Architecture at a Glance</h2>
            <p className="section-desc">
              From capture to verification, Era creates an unbroken chain of trust anchored in hardware security.
            </p>
          </div>
          <div className="arch-flow">
            <div className="arch-step">
              <div className="arch-step-num">1</div>
              <h4>Capture</h4>
              <p>Media hashed and signed inside Secure Enclave or Android TEE</p>
            </div>
            <span className="arch-arrow">→</span>
            <div className="arch-step">
              <div className="arch-step-num">2</div>
              <h4>Register</h4>
              <p>Proof broadcast to Era chain with DID and device signature</p>
            </div>
            <span className="arch-arrow">→</span>
            <div className="arch-step">
              <div className="arch-step-num">3</div>
              <h4>Verify</h4>
              <p>Anyone can check proof integrity and identity on-chain</p>
            </div>
            <span className="arch-arrow">→</span>
            <div className="arch-step">
              <div className="arch-step-num">4</div>
              <h4>Dispute</h4>
              <p>Context Court resolves contextual disputes via jury voting</p>
            </div>
          </div>
          <div className="arch-cards">
            <div className="arch-card">
              <h4><span>📱</span> Capture Layer</h4>
              <ul>
                <li>Media hashed on-device immediately after creation</li>
                <li>Hardware security module signs with device-bound key</li>
                <li>Media stored off-chain (IPFS planned), hash on-chain</li>
                <li>DID permissions enforced via Identity Registry rights</li>
              </ul>
            </div>
            <div className="arch-card">
              <h4><span>⛓️</span> On-chain Layer</h4>
              <ul>
                <li>Content Registry stores immutable proofs: hash, DID, device, block</li>
                <li>Context Court summons jurors and manages dispute lifecycle</li>
                <li>Economic incentives: staking, rewards, and slashing</li>
                <li>Events enable downstream indexing and verification APIs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Solutions</p>
            <h2 className="section-title">What You Can Build</h2>
            <p className="section-desc">
              Era provides the infrastructure for a more truthful digital age. Here are some
              applications enabled by proof-of-reality.
            </p>
          </div>
          <div className="solutions-grid">
            {solutions.map((item) => (
              <div className="solution-card" key={item.title}>
                <div className="solution-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="section roadmap-section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Roadmap</p>
            <h2 className="section-title">What&apos;s Next for Era</h2>
            <p className="section-desc">
              Building the ledger was step one. The future is about making it the universal
              standard for digital truth.
            </p>
          </div>
          <div className="roadmap-timeline">
            {roadmap.map((item) => (
              <div className="roadmap-item" key={item.title}>
                <span className={`roadmap-status ${item.status}`}>{item.status}</span>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section">
        <div className="section-inner">
          <div className="about-content">
            <div className="about-text">
              <h2>We&apos;re building the ledger of reality</h2>
              <p>
                In an age of AI-generated content and deepfakes, detection is a losing game. Era
                flips the problem: instead of proving what&apos;s fake, we prove what&apos;s real.
              </p>
              <p>
                Our protocol creates cryptographic proofs at the moment of content creation,
                binds them to physical devices through hardware security, and stores immutable
                records on-chain. For contextual disputes, a decentralized human oracle—the
                Context Court—delivers final verdicts.
              </p>
              <p>
                Era is more than a blockchain. It&apos;s infrastructure for a more truthful digital
                age—a permanent, decentralized anchor for reality.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat">
                <div className="stat-value">3</div>
                <div className="stat-label">Core Pallets</div>
              </div>
              <div className="stat">
                <div className="stat-value">100%</div>
                <div className="stat-label">Open Source</div>
              </div>
              <div className="stat">
                <div className="stat-value">∞</div>
                <div className="stat-label">Immutable Proofs</div>
              </div>
              <div className="stat">
                <div className="stat-value">XCM</div>
                <div className="stat-label">Cross-chain Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section id="explore" className="section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Explore</p>
            <h2 className="section-title">Dive Deeper</h2>
            <p className="section-desc">
              Learn more about Era&apos;s protocol, explore the codebase, and discover how to integrate.
            </p>
          </div>
          <div className="explore-grid">
            {explore.map((item) => (
              <Link to={item.href} className="explore-card" key={item.title} target={item.href.startsWith("http") ? "_blank" : undefined}>
                <h4>{item.title} →</h4>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta">
        <div className="section-inner">
          <div className="cta-box">
            <h2>Ready to build on proof-of-reality?</h2>
            <p>
              Era is open to contributors, integration partners, and early adopters capturing proofs.
              Start with the whitepaper and reach out to embed authenticity in your product.
            </p>
            <div className="cta-buttons">
              <Link to="/whitepaper" className="btn btn-primary">
                Read the Whitepaper
              </Link>
              <a href="/whitepaper.md" download className="btn btn-secondary">
                Download (Markdown)
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
