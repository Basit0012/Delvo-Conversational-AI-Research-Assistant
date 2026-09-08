import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { ArrowLeft, ArrowUp, ExternalLink, ShieldCheck, Scale, FileText } from 'lucide-react';

const sections = [
  { id: 'acceptance', title: '1. Acceptance & Scope of Agreement' },
  { id: 'platform', title: '2. The Delvo AI Research Platform' },
  { id: 'accounts', title: '3. User Accounts, Authentication & Security' },
  { id: 'inference', title: '4. Autonomous Agent Operations & LLM Inference' },
  { id: 'grounding', title: '5. Real-Time Web Search & Data Grounding' },
  { id: 'ownership', title: '6. User Prompts, Intellectual Property & Ownership' },
  { id: 'acceptable-use', title: '7. Acceptable Use Policy & Restrictions' },
  { id: 'websocket', title: '8. WebSocket Streaming & Service Availability' },
  { id: 'billing', title: '9. Fees, Subscription Plans & Token Quotas' },
  { id: 'disclaimers', title: '10. Disclaimers & Accuracy of AI Synthesis' },
  { id: 'liability', title: '11. Limitation of Liability & Indemnity' },
  { id: 'termination', title: '12. Account Termination & Data Portability' },
  { id: 'contact', title: '13. Legal Inquiries & Contact Information' },
];

export const Terms = () => {
  const [activeSection, setActiveSection] = useState('acceptance');
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

      {/* Top sticky navigation bar matching Vercel standard */}
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
              <Scale size={13} />
              <span>Legal</span>
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

      {/* Hero Header */}
      <div className="vercel-terms-hero">
        <div className="vercel-terms-hero-inner">
          <h1 className="vercel-terms-title">Terms of Service</h1>
          <div className="vercel-terms-meta">
            <span>Effective Date: September 8, 2026</span>
            <span className="vercel-terms-bullet">·</span>
            <span>Version 2.4</span>
            <span className="vercel-terms-bullet">·</span>
            <span className="vercel-terms-tag">Delvo Platform Agreement</span>
          </div>
        </div>
      </div>

      {/* Main Container with Two Columns */}
      <div className="vercel-terms-container">
        <div className="vercel-terms-grid">
          {/* Left Column: Legal Content */}
          <main className="vercel-terms-content">
            <div className="vercel-terms-lead-box">
              <p>
                Welcome to <strong>Delvo</strong>. These Terms of Service (&ldquo;Terms&rdquo;) govern
                your access to and use of Delvo&rsquo;s autonomous artificial intelligence research
                platform, real-time citation engines, multi-agent synthesis loops, APIs, and associated
                software (collectively, the &ldquo;Platform&rdquo; or &ldquo;Services&rdquo;), provided
                by Delvo Technologies Inc. (&ldquo;Delvo&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or
                &ldquo;us&rdquo;).
              </p>
              <p>
                By creating an account, authenticating via OAuth, Passkey, or SSO, or querying our
                research agents, you confirm that you have read, understood, and agree to be bound by
                these Terms and our <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </div>

            {/* Section 1 */}
            <section id="acceptance" className="vercel-terms-section">
              <div className="vercel-terms-section-num">01</div>
              <h2>1. Acceptance &amp; Scope of Agreement</h2>
              <p>
                By registering for an account, accessing `delvo.ai` or its connected services, or executing
                any autonomous research task, you enter into a legally binding agreement with Delvo.
                If you are entering into these Terms on behalf of an enterprise, organization, or educational
                institution, you warrant that you possess the requisite authority to bind that entity to
                these Terms.
              </p>
              <p>
                If you do not agree to all provisions contained herein, you must immediately cease all access
                to and utilization of the Delvo Services.
              </p>
            </section>

            {/* Section 2 */}
            <section id="platform" className="vercel-terms-section">
              <div className="vercel-terms-section-num">02</div>
              <h2>2. The Delvo AI Research Platform</h2>
              <p>
                Delvo delivers next-generation autonomous research and insight synthesis. Unlike traditional
                static search engines or basic chatbots, Delvo leverages iterative reasoning loops, autonomous
                web navigation, multi-source citation validation, and dynamic report generation.
              </p>
              <p>
                Our platform incorporates deep reasoning architectures that decompose complex analytical
                questions into iterative sub-hypotheses, execute targeted retrieval pipelines, and compile
                rigorously cited academic, enterprise, and market intelligence briefs.
              </p>
            </section>

            {/* Section 3 */}
            <section id="accounts" className="vercel-terms-section">
              <div className="vercel-terms-section-num">03</div>
              <h2>3. User Accounts, Authentication &amp; Security</h2>
              <p>
                To utilize the full capabilities of Delvo, you must create a verified user account. Delvo
                supports multiple modern authentication standards designed to ensure zero-trust account security:
              </p>
              <ul>
                <li>
                  <strong>Work Email &amp; Password Authentication</strong>: Subject to strict cryptographic
                  hashing (bcrypt salt rounds &ge; 10) and minimum complexity requirements.
                </li>
                <li>
                  <strong>FIDO2 / WebAuthn Hardware Passkeys</strong>: Cryptographically verified biometric
                  and security key authentication bound to your device hardware.
                </li>
                <li>
                  <strong>Enterprise SAML 2.0 Single Sign-On (SSO)</strong>: Direct identity federation with
                  Okta, Azure Active Directory, Google Workspace, and Ping Identity.
                </li>
                <li>
                  <strong>Third-Party OAuth Providers</strong>: Secure token exchange via Google, GitHub,
                  OpenAI ChatGPT, Apple, GitLab, and Bitbucket.
                </li>
              </ul>
              <p>
                You are solely responsible for maintaining the confidentiality of your credentials and for
                all research tasks, API requests, and data queries executed under your account.
              </p>
            </section>

            {/* Section 4 */}
            <section id="inference" className="vercel-terms-section">
              <div className="vercel-terms-section-num">04</div>
              <h2>4. Autonomous Agent Operations &amp; LLM Inference</h2>
              <p>
                Delvo utilizes advanced large language model (LLM) inference engines (including Mistral AI
                architectures and custom fine-tuned weights) to evaluate information, generate intermediate
                chain-of-thought traces, and compose comprehensive research briefs.
              </p>
              <p>
                You acknowledge that generative AI models operate probabilistically. While Delvo employs
                multi-pass verification and source validation algorithms, outputs may occasionally contain
                imprecisions. You agree that Delvo agents act as intellectual research copilots, and critical
                decisions in medical, financial, or legal domains must be verified by licensed professionals.
              </p>
            </section>

            {/* Section 5 */}
            <section id="grounding" className="vercel-terms-section">
              <div className="vercel-terms-section-num">05</div>
              <h2>5. Real-Time Web Search &amp; Data Grounding</h2>
              <p>
                To provide up-to-the-minute empirical information, Delvo integrates real-time web search and
                retrieval capabilities via specialized search partners (including the Tavily Search API).
              </p>
              <p>
                When you initiate a query, Delvo agents formulate automated search strings, evaluate domain
                reputations, retrieve publicly available web content, and cite relevant URLs directly in your
                research report. Delvo does not alter or endorse third-party web content, and access to external
                links is governed by the respective third-party terms.
              </p>
            </section>

            {/* Section 6 */}
            <section id="ownership" className="vercel-terms-section">
              <div className="vercel-terms-section-num">06</div>
              <h2>6. User Prompts, Intellectual Property &amp; Ownership</h2>
              <div className="vercel-terms-highlight">
                <ShieldCheck size={18} />
                <span>
                  <strong>You retain 100% intellectual property ownership</strong> of your research questions,
                  uploaded documents, customized knowledge bases, and generated research reports.
                </span>
              </div>
              <p>
                Delvo claims zero ownership over your proprietary queries or the final synthesized research
                artifacts. We grant you an irrevocable, perpetual, worldwide, transferable license to reproduce,
                publish, monetize, or integrate any research output generated by Delvo for your account.
              </p>
              <p>
                Delvo does not use your private enterprise research queries or proprietary data to train our
                foundational public models without your explicit, opt-in enterprise authorization.
              </p>
            </section>

            {/* Section 7 */}
            <section id="acceptable-use" className="vercel-terms-section">
              <div className="vercel-terms-section-num">07</div>
              <h2>7. Acceptable Use Policy &amp; Restrictions</h2>
              <p>You agree not to use Delvo to:</p>
              <ul>
                <li>
                  Generate, distribute, or execute malware, cyber exploits, denial-of-service tools, or
                  unauthorized network vulnerability probes.
                </li>
                <li>
                  Facilitate the production of chemical, biological, or nuclear munitions, or promote acts
                  of severe violence or illegal weaponry fabrication.
                </li>
                <li>
                  Harass, defame, unlawfully surveil, or violate the constitutional or statutory rights of any individual.
                </li>
                <li>
                  Attempt to reverse-engineer, decompile, or extract the model weights, backend socket protocols,
                  or private infrastructure of the Delvo agent engine.
                </li>
                <li>
                  Bypass, disable, or circumvent established token quotas, billing limits, or API rate throttling.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="websocket" className="vercel-terms-section">
              <div className="vercel-terms-section-num">08</div>
              <h2>8. WebSocket Streaming &amp; Service Availability</h2>
              <p>
                Delvo provides low-latency bidirectional WebSocket communication (`ws://` and `wss://`)
                enabling token-by-token streaming of agent thoughts, live web-browsing status, and dynamic
                citation assembly.
              </p>
              <p>
                While we maintain enterprise infrastructure with 99.9% target uptime, Delvo does not warrant
                uninterrupted or error-free service during scheduled maintenance, distributed upstream ISP outages,
                or third-party LLM provider downtime.
              </p>
            </section>

            {/* Section 9 */}
            <section id="billing" className="vercel-terms-section">
              <div className="vercel-terms-section-num">09</div>
              <h2>9. Fees, Subscription Plans &amp; Token Quotas</h2>
              <p>
                Certain features of Delvo, including unlimited autonomous deep research loops, extended context
                windows, and high-frequency concurrent agent runs, require a paid subscription or token package.
              </p>
              <p>
                All fees are billed in advance on a recurring monthly or annual cycle. You may cancel your subscription
                at any time via your account settings; cancellation takes effect at the end of the current paid billing period.
              </p>
            </section>

            {/* Section 10 */}
            <section id="disclaimers" className="vercel-terms-section">
              <div className="vercel-terms-section-num">10</div>
              <h2>10. Disclaimers &amp; Accuracy of AI Synthesis</h2>
              <p className="vercel-terms-disclaimer-text">
                THE DELVO PLATFORM, AGENTS, AND ALL GENERATED RESEARCH FINDINGS ARE PROVIDED ON AN &ldquo;AS IS&rdquo;
                AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
                STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
                PURPOSE, NON-INFRINGEMENT, AND ACCURACY.
              </p>
              <p>
                Delvo makes no guarantee regarding the completeness, scientific accuracy, or reliability of
                autonomous web citations or synthesized text, and users assume all risks associated with empirical reliance.
              </p>
            </section>

            {/* Section 11 */}
            <section id="liability" className="vercel-terms-section">
              <div className="vercel-terms-section-num">11</div>
              <h2>11. Limitation of Liability &amp; Indemnity</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL DELVO, ITS DIRECTORS,
                EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL
                DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR RESEARCH OPPORTUNITIES, ARISING OUT OF OR IN
                CONNECTION WITH YOUR USE OF THE SERVICES.
              </p>
              <p>
                Delvo&rsquo;s aggregate liability for all claims arising under these Terms shall not exceed the
                total fees paid by you to Delvo during the twelve (12) months preceding the event giving rise to liability.
              </p>
            </section>

            {/* Section 12 */}
            <section id="termination" className="vercel-terms-section">
              <div className="vercel-terms-section-num">12</div>
              <h2>12. Account Termination &amp; Data Portability</h2>
              <p>
                You may terminate your account at any time by navigating to your profile settings. Upon termination,
                you retain the right to export all historical research threads, citations, and conversation logs
                in standardized formats (JSON, Markdown, PDF).
              </p>
              <p>
                Delvo reserves the right to suspend or terminate accounts that engage in repeated violations of our
                Acceptable Use Policy or fraudulent payment behavior.
              </p>
            </section>

            {/* Section 13 */}
            <section id="contact" className="vercel-terms-section">
              <div className="vercel-terms-section-num">13</div>
              <h2>13. Legal Inquiries &amp; Contact Information</h2>
              <p>
                If you have questions, feedback, or legal inquiries concerning these Terms of Service or enterprise
                compliance agreements, please contact our legal counsel:
              </p>
              <div className="vercel-terms-contact-card">
                <div className="vercel-terms-contact-row">
                  <strong>Delvo Technologies Inc.</strong>
                </div>
                <div className="vercel-terms-contact-row">
                  Legal Department &amp; Compliance Office
                </div>
                <div className="vercel-terms-contact-row">
                  Email:{' '}
                  <a href="mailto:legal@delvo.ai" className="vercel-terms-email-link">
                    legal@delvo.ai
                  </a>
                </div>
                <div className="vercel-terms-contact-row">
                  Security:{' '}
                  <a href="mailto:security@delvo.ai" className="vercel-terms-email-link">
                    security@delvo.ai
                  </a>
                </div>
              </div>
            </section>

            {/* Bottom navigation actions */}
            <div className="vercel-terms-bottom-bar">
              <Link to="/login" className="vercel-btn-subtle">
                <ArrowLeft size={14} />
                <span>Return to Log In</span>
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
                <FileText size={16} />
                <div>
                  <strong>Need custom enterprise terms?</strong>
                  <p>We offer tailored Master Service Agreements (MSAs) and BAAs for enterprise clusters.</p>
                  <a href="mailto:enterprise@delvo.ai" className="vercel-terms-toc-cta">
                    Contact Sales <ExternalLink size={12} />
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

export default Terms;
