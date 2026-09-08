import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { ArrowLeft, ArrowUp, ExternalLink, ShieldCheck, Lock, FileText, CheckCircle2, Scale } from 'lucide-react';

const sections = [
  { id: 'overview', title: '1. Overview & Privacy Principles' },
  { id: 'collection', title: '2. Information We Collect' },
  { id: 'zero-training', title: '3. Zero Training on Private Research Data' },
  { id: 'usage', title: '4. How We Use Information & Inference Pipelines' },
  { id: 'grounding-privacy', title: '5. Real-Time Web Search & Grounding Privacy' },
  { id: 'security', title: '6. Security, Encryption & Storage Architecture' },
  { id: 'retention', title: '7. Data Retention & Deletion Schedules' },
  { id: 'cookies-storage', title: '8. Cookies, Local Storage & Session State' },
  { id: 'user-rights', title: '9. Global Compliance: GDPR, CCPA/CPRA & Your Rights' },
  { id: 'enterprise', title: '10. Enterprise Isolation & Workspace Governance' },
  { id: 'transfers', title: '11. International Data Transfers & Cross-Border Protections' },
  { id: 'children', title: '12. Children\'s Privacy' },
  { id: 'contact-dpo', title: '13. Data Protection Officer & Privacy Inquiries' },
];

export const Privacy = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const winScroll = window.scrollY || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrolled = docHeight > 0 ? Math.min(100, Math.max(0, (winScroll / docHeight) * 100)) : 0;
          setScrollProgress(scrolled);
          setShowBackToTop(winScroll > 360);

          const scrollPosition = winScroll + 160;
          for (let i = sections.length - 1; i >= 0; i--) {
            const element = document.getElementById(sections[i].id);
            if (element && element.offsetTop <= scrollPosition) {
              setActiveSection(sections[i].id);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="vercel-terms-layout">
      {/* Apple-style Reading Progress Bar */}
      <div
        className="apple-reading-progress"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
      />

      {/* Top sticky navigation bar matching Apple/Vercel standard */}
      <header className="vercel-terms-navbar">
        <div className="vercel-terms-nav-inner">
          <div className="vercel-terms-nav-left">
            <Link to="/" className="vercel-logo-link" aria-label="Delvo Home">
              <svg width="20" height="18" viewBox="0 0 76 65" fill="currentColor" aria-hidden="true">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
              <span className="vercel-logo-text">Delvo</span>
            </Link>
            <div className="vercel-terms-nav-badge">
              <Lock size={12} />
              <span>Privacy</span>
            </div>
          </div>

          <div className="vercel-terms-nav-right">
            <Link to="/login" className="vercel-btn-subtle auth-link">
              Log In
            </Link>
            <Link to="/register" className="vercel-btn-primary vercel-terms-signup-btn">
              Sign Up
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Header with Apple Ambient Glow */}
      <div className="vercel-terms-hero">
        <div className="vercel-terms-hero-inner">
          <h1 className="vercel-terms-title">Privacy Policy</h1>
          <div className="vercel-terms-meta">
            <span>Effective Date: September 8, 2026</span>
            <span className="vercel-terms-bullet">·</span>
            <span>Version 2.4</span>
            <span className="vercel-terms-bullet">·</span>
            <span className="vercel-terms-tag">Delvo Data Governance</span>
          </div>
        </div>
      </div>

      {/* Main Container with Two Columns */}
      <div className="vercel-terms-container">
        <div className="vercel-terms-grid">
          {/* Left Column: Privacy Policy Content */}
          <main className="vercel-terms-content">
            <div className="vercel-terms-lead-box">
              <p>
                At <strong>Delvo</strong>, your privacy and intellectual sovereignty are foundational to our mission.
                This Privacy Policy explains how Delvo Technologies Inc. (&ldquo;Delvo&rdquo;, &ldquo;we&rdquo;,
                &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, manages, processes, and safeguards information when
                you interact with our autonomous artificial intelligence research platform, real-time citation engines,
                multi-agent synthesis loops, APIs, and associated web services (collectively, the &ldquo;Platform&rdquo;).
              </p>
              <p>
                We believe that modern AI research should never come at the cost of confidentiality.
                By accessing Delvo or authenticating your account, you acknowledge the privacy practices outlined below.
                For terms governing usage rights and licensing, please review our{' '}
                <Link to="/terms">Terms of Service</Link>.
              </p>
            </div>

            {/* Section 1 */}
            <section id="overview" className="vercel-terms-section">
              <div className="vercel-terms-section-num">01</div>
              <h2>1. Overview &amp; Privacy Principles</h2>
              <p>
                Delvo adheres to strict Privacy by Design principles. We process personal and empirical research data
                strictly to deliver accurate, real-time autonomous research synthesis. Our foundational commitments include:
              </p>
              <ul>
                <li>
                  <strong>Data Minimization</strong>: We collect only what is strictly necessary to authenticate your
                  identity, execute your research tasks, and maintain low-latency bidirectional socket connections.
                </li>
                <li>
                  <strong>Zero Foundation Training</strong>: We never sell your personal data or utilize your proprietary
                  queries to train publicly accessible foundation models without explicit enterprise consent.
                </li>
                <li>
                  <strong>End-to-End Cryptography</strong>: All data in transit is encrypted using modern TLS 1.3 standards,
                  and database records are safeguarded by AES-256 encryption at rest.
                </li>
                <li>
                  <strong>User Sovereignty</strong>: You maintain comprehensive rights to inspect, export, or permanently
                  erase your research threads, citations, and account credentials at any time.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="collection" className="vercel-terms-section">
              <div className="vercel-terms-section-num">02</div>
              <h2>2. Information We Collect</h2>
              <p>Depending on how you interact with Delvo, we collect the following categories of information:</p>
              <ul>
                <li>
                  <strong>Account &amp; Identity Credentials</strong>: When registering, we collect your display username,
                  work email address, and cryptographically hashed password (salted via bcrypt with &ge; 10 rounds).
                </li>
                <li>
                  <strong>Federated Authentication Metadata</strong>: When authenticating via FIDO2 / WebAuthn Passkeys,
                  SAML 2.0 SSO, or third-party OAuth providers (Google, GitHub, OpenAI ChatGPT, Apple, GitLab, Bitbucket),
                  we receive verified identity tokens and email addresses directly from your identity provider.
                </li>
                <li>
                  <strong>Research Queries &amp; Agent Conversations</strong>: We store the search prompts, chain-of-thought
                  traces, intermediate reasoning hypotheses, and synthesized research reports generated during your sessions.
                </li>
                <li>
                  <strong>Telemetry &amp; Diagnostic Logs</strong>: To ensure 99.9% platform availability and mitigate
                  unauthorized rate flooding, our infrastructure logs IP addresses, browser user agent strings, request
                  latencies, and WebSocket handshake timestamps.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="zero-training" className="vercel-terms-section">
              <div className="vercel-terms-section-num">03</div>
              <h2>3. Zero Training on Private Research Data</h2>
              <div className="vercel-terms-highlight">
                <ShieldCheck size={18} />
                <span>
                  <strong>Our Privacy Guarantee:</strong> Delvo does not use your private research prompts, uploaded
                  documents, or synthesized agent conversations to train foundational public LLM models.
                </span>
              </div>
              <p>
                Unlike consumer search crawlers or public chatbots that pool user prompts for future model pretraining,
                Delvo treats your enterprise queries as strictly confidential ephemeral inputs. Any temporary caching
                used during active research loops exists solely to maintain conversational context and compute dynamic citations.
              </p>
              <p>
                Enterprise customers retain guaranteed zero-data-retention options where intermediate inference traces are
                flushed from memory immediately upon completion of the research session.
              </p>
            </section>

            {/* Section 4 */}
            <section id="usage" className="vercel-terms-section">
              <div className="vercel-terms-section-num">04</div>
              <h2>4. How We Use Information &amp; Inference Pipelines</h2>
              <p>We process collected information strictly for the following operational purposes:</p>
              <ul>
                <li>
                  <strong>Autonomous Task Execution</strong>: Formulating search sub-queries, navigating relevant domains,
                  and feeding context to our reasoning models (including Mistral AI architectures) to compile comprehensive briefs.
                </li>
                <li>
                  <strong>Bidirectional WebSocket Streaming</strong>: Establishing persistent, low-latency socket channels
                  (`ws://` and `wss://`) to stream token-by-token synthesis and live agent browsing status to your client.
                </li>
                <li>
                  <strong>Account Management &amp; Security Verification</strong>: Verifying session JWT tokens, validating
                  hardware Passkeys, and enforcing role-based enterprise access controls.
                </li>
                <li>
                  <strong>Fraud Prevention &amp; Rate Throttling</strong>: Monitoring API request frequency to prevent automated
                  abuse, credential stuffing attacks, and denial-of-service attempts.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="grounding-privacy" className="vercel-terms-section">
              <div className="vercel-terms-section-num">05</div>
              <h2>5. Real-Time Web Search &amp; Grounding Privacy</h2>
              <p>
                Delvo delivers empirical intelligence by integrating real-time web retrieval engines (including the Tavily Search API).
                When an agent executes an autonomous search step:
              </p>
              <ul>
                <li>
                  <strong>Query Sanitization</strong>: Only the formulated search string necessary to retrieve public web pages
                  is transmitted to our search partners. Your personal account identity, email, and unrelated chat history are
                  never forwarded to third-party search APIs.
                </li>
                <li>
                  <strong>Public Domain Extraction</strong>: Delvo agents inspect publicly indexed web data, academic preprints,
                  and official documentation to harvest citations. We do not attempt to bypass paywalls, crawl private intranets,
                  or access restricted databases.
                </li>
                <li>
                  <strong>Third-Party Links</strong>: Cited sources link directly to external web properties. Delvo is not
                  responsible for the privacy practices or cookie tracking of external websites visited via citation links.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="security" className="vercel-terms-section">
              <div className="vercel-terms-section-num">06</div>
              <h2>6. Security, Encryption &amp; Storage Architecture</h2>
              <p>
                We implement defense-in-depth engineering standards to protect user data against unauthorized access,
                alteration, disclosure, or destruction:
              </p>
              <ul>
                <li>
                  <strong>Encryption in Transit</strong>: All client-to-server HTTP and WebSocket streams are secured using
                  TLS 1.3 cryptographic protocols with modern cipher suites.
                </li>
                <li>
                  <strong>Encryption at Rest</strong>: Database records, user profiles, and chat collections stored in MongoDB
                  are protected using enterprise-grade AES-256 encryption.
                </li>
                <li>
                  <strong>Credential Hashing</strong>: Passwords are salted and hashed with bcrypt (&ge; 10 rounds). Delvo never
                  stores plaintext passwords under any circumstance.
                </li>
                <li>
                  <strong>Biometric Hardware Security</strong>: FIDO2 / WebAuthn passkey authentication processes biometrics
                  locally on your hardware enclave; biometric scan data never leaves your physical device.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="retention" className="vercel-terms-section">
              <div className="vercel-terms-section-num">07</div>
              <h2>7. Data Retention &amp; Deletion Schedules</h2>
              <p>
                We retain your research records only for as long as your account remains active or as required to fulfill
                the operational purposes described in this Privacy Policy:
              </p>
              <ul>
                <li>
                  <strong>User Chats &amp; Reports</strong>: Stored persistently in your account so you can reference historical
                  research threads. When you click <em>Delete Chat</em>, the thread and associated message records are
                  immediately purged from active database collections.
                </li>
                <li>
                  <strong>Account Deletion</strong>: You may request complete account termination at any time. Upon confirmation,
                  your profile, authentication credentials, and stored research threads are permanently deleted within 30 days.
                </li>
                <li>
                  <strong>Aggregated Telemetry</strong>: De-identified operational metrics and server log traces are rotated
                  and flushed every 90 days.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="cookies-storage" className="vercel-terms-section">
              <div className="vercel-terms-section-num">08</div>
              <h2>8. Cookies, Local Storage &amp; Session State</h2>
              <p>
                Delvo is committed to clean, tracking-free web architecture. We utilize browser storage strictly for core
                functional utilities:
              </p>
              <ul>
                <li>
                  <strong>Theme State (`localStorage`)</strong>: Persisting your selected display appearance (`dark` or `light` mode).
                </li>
                <li>
                  <strong>Authentication State (`localStorage` / HTTP Cookies)</strong>: Storing signed JWT tokens to maintain
                  authenticated sessions across page refreshes.
                </li>
                <li>
                  <strong>Zero Ad-Tracking Cookies</strong>: Delvo does not use third-party advertising cookies, social media tracking
                  pixels, or behavioral analytics brokers.
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="user-rights" className="vercel-terms-section">
              <div className="vercel-terms-section-num">09</div>
              <h2>9. Global Compliance: GDPR, CCPA/CPRA &amp; Your Rights</h2>
              <p>
                Regardless of your geographic location, Delvo provides uniform, comprehensive data rights in compliance
                with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA/CPRA):
              </p>
              <ul>
                <li>
                  <strong>Right to Access &amp; Portability</strong>: You may request an export of all queries, reports, and
                  stored metadata in standardized machine-readable formats (JSON, Markdown, PDF).
                </li>
                <li>
                  <strong>Right to Rectification</strong>: You may correct inaccurate profile data at any time via your account settings.
                </li>
                <li>
                  <strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;)</strong>: You may request the permanent deletion
                  of your user profile and all associated research content.
                </li>
                <li>
                  <strong>Notice to California Residents (CCPA)</strong>: Delvo does not sell, rent, or trade your personal information
                  to any third party for financial or promotional consideration.
                </li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="enterprise" className="vercel-terms-section">
              <div className="vercel-terms-section-num">10</div>
              <h2>10. Enterprise Isolation &amp; Workspace Governance</h2>
              <p>
                For enterprise teams and educational organizations, Delvo provides isolated multi-tenant architecture designed
                to meet institutional compliance mandates:
              </p>
              <ul>
                <li>
                  <strong>Tenant Segregation</strong>: Logical data partitioning ensures that enterprise research prompts and
                  custom knowledge bases are never accessible by other organizations.
                </li>
                <li>
                  <strong>Role-Based Access Control (RBAC)</strong>: Granular permissions allow workspace administrators to
                  manage member provisioning, audit research queries, and enforce security policies.
                </li>
                <li>
                  <strong>Custom Retention Policies</strong>: Enterprise tiers can configure custom automated purge windows
                  for compliance with industry regulations (e.g., HIPAA, SOC 2, ISO 27001).
                </li>
              </ul>
            </section>

            {/* Section 11 */}
            <section id="transfers" className="vercel-terms-section">
              <div className="vercel-terms-section-num">11</div>
              <h2>11. International Data Transfers &amp; Cross-Border Protections</h2>
              <p>
                Delvo operates cloud infrastructure located in the United States and the European Union. If you access the
                Services from outside these jurisdictions, your information may be transferred across international borders.
              </p>
              <p>
                When transferring data from the European Economic Area (EEA), the United Kingdom, or Switzerland, we rely on
                European Commission-approved Standard Contractual Clauses (SCCs) and robust technical safeguards to ensure
                an equivalent level of data protection.
              </p>
            </section>

            {/* Section 12 */}
            <section id="children" className="vercel-terms-section">
              <div className="vercel-terms-section-num">12</div>
              <h2>12. Children's Privacy</h2>
              <p>
                Delvo is designed as an advanced research and synthesis tool for professionals, researchers, and university students.
                Our Platform is not directed toward children under the age of 16.
              </p>
              <p>
                We do not knowingly collect personal data from individuals under 16. If we become aware that an account has been
                registered by a child under 16 without verified parental consent, we will promptly terminate the account and purge
                all associated data.
              </p>
            </section>

            {/* Section 13 */}
            <section id="contact-dpo" className="vercel-terms-section">
              <div className="vercel-terms-section-num">13</div>
              <h2>13. Data Protection Officer &amp; Privacy Inquiries</h2>
              <p>
                If you have questions, feedback, or data subject access requests regarding this Privacy Policy or our security
                practices, please reach out directly to our Data Protection Office:
              </p>
              <div className="vercel-terms-contact-card">
                <div className="vercel-terms-contact-row">
                  <strong>Delvo Technologies Inc.</strong>
                </div>
                <div className="vercel-terms-contact-row">
                  Data Protection &amp; Regulatory Compliance Office
                </div>
                <div className="vercel-terms-contact-row">
                  Privacy Desk:{' '}
                  <a href="mailto:privacy@delvo.ai" className="vercel-terms-email-link">
                    privacy@delvo.ai
                  </a>
                </div>
                <div className="vercel-terms-contact-row">
                  Data Protection Officer:{' '}
                  <a href="mailto:dpo@delvo.ai" className="vercel-terms-email-link">
                    dpo@delvo.ai
                  </a>
                </div>
                <div className="vercel-terms-contact-row">
                  Security Vulnerability Reporting:{' '}
                  <a href="mailto:security@delvo.ai" className="vercel-terms-email-link">
                    security@delvo.ai
                  </a>
                </div>
              </div>
            </section>

            {/* Bottom navigation actions */}
            <div className="vercel-terms-bottom-bar">
              <Link to="/terms" className="vercel-btn-subtle">
                <ArrowLeft size={14} />
                <span>Read Terms of Service</span>
              </Link>
              <Link to="/register" className="vercel-btn-primary" style={{ width: 'auto', padding: '0 20px' }}>
                <span>Create Delvo Account</span>
              </Link>
            </div>
          </main>

          {/* Right Column: Sticky Table of Contents Sidebar */}
          <aside className="vercel-terms-sidebar">
            <div className="vercel-terms-toc">
              <h4 className="vercel-terms-toc-title">On this page</h4>
              <nav aria-label="Table of contents">
                <ul className="vercel-terms-toc-list">
                  {sections.map((sec) => (
                    <li key={sec.id}>
                      <button
                        type="button"
                        className={`vercel-terms-toc-link ${
                          activeSection === sec.id ? 'is-active' : ''
                        }`}
                        onClick={() => scrollTo(sec.id)}
                      >
                        {sec.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="vercel-terms-toc-card">
                <ShieldCheck size={16} />
                <div>
                  <strong>Enterprise Privacy &amp; DPA</strong>
                  <p>Need a signed Data Processing Addendum (DPA) or custom EU data residency?</p>
                  <a href="mailto:privacy@delvo.ai" className="vercel-terms-toc-cta">
                    Request DPA <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Global Minimal Footer */}
      <footer className="vercel-terms-footer">
        <div className="vercel-terms-footer-inner">
          <div className="vercel-terms-footer-left">
            <span>&copy; {new Date().getFullYear()} Delvo Technologies Inc. All rights reserved.</span>
          </div>
          <div className="vercel-terms-footer-right">
            <Link to="/terms" className="vercel-footer-link">
              Terms
            </Link>
            <span>·</span>
            <Link to="/privacy" className="vercel-footer-link">
              Privacy Policy
            </Link>
            <span>·</span>
            <a href="#security" className="vercel-footer-link" onClick={(e) => e.preventDefault()}>
              Security
            </a>
            <span>·</span>
            <a href="#status" className="vercel-footer-link" onClick={(e) => e.preventDefault()}>
              System Status
            </a>
          </div>
        </div>
      </footer>

      {/* Apple-style floating Back to Top button */}
      {showBackToTop && (
        <button
          type="button"
          className="apple-back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <ArrowUp size={14} />
          <span>Top</span>
        </button>
      )}
    </div>
  );
};

export default Privacy;
