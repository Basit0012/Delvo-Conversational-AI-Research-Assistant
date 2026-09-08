import DelvoLogo from './DelvoLogo';
import { Search, Globe, CheckCircle2, Sparkles } from 'lucide-react';

export const AuthBrandPanel = () => {
  return (
    <div className="auth-brand-panel" aria-hidden="true">
      <div className="brand-header">
        <div className="brand-badge-row">
          <DelvoLogo size={32} />
          <span className="brand-wordmark">Delvo</span>
          <span className="brand-chip">
            <Sparkles size={12} className="brand-chip-icon" />
            AI Research
          </span>
        </div>
      </div>

      <div className="brand-hero">
        <h2 className="brand-tagline">
          Research, <br />
          <span className="brand-tagline-highlight">answered.</span>
        </h2>
        <p className="brand-description">
          Delvo explores the live web, verifies primary sources, and synthesizes complex topics into clear, cited answers.
        </p>
      </div>

      {/* Illustrative Synthesis Preview Card */}
      <div className="brand-visual-card">
        <div className="brand-visual-step">
          <div className="visual-dot visual-dot-query" />
          <div className="visual-line-content">
            <span className="visual-step-title">Autonomous Querying</span>
            <span className="visual-step-desc">Deconstructs research prompts</span>
          </div>
          <span className="visual-badge visual-badge-active">
            <Search size={12} />
            Exploring
          </span>
        </div>

        <div className="brand-visual-connector" />

        <div className="brand-visual-step">
          <div className="visual-dot visual-dot-search" />
          <div className="visual-line-content">
            <span className="visual-step-title">Multi-Source Web Crawl</span>
            <span className="visual-step-desc">Primary literature & live data</span>
          </div>
          <span className="visual-badge visual-badge-verified">
            <Globe size={12} />
            Verified
          </span>
        </div>

        <div className="brand-visual-connector" />

        <div className="brand-visual-step">
          <div className="visual-dot visual-dot-synthesis" />
          <div className="visual-line-content">
            <span className="visual-step-title">Structured Synthesis</span>
            <span className="visual-step-desc">Grounded with inline citations</span>
          </div>
          <span className="visual-badge visual-badge-done">
            <CheckCircle2 size={12} />
            Synthesized
          </span>
        </div>
      </div>

      {/* Highlights Footer */}
      <div className="brand-footer-pills">
        <div className="brand-pill">
          <span className="pill-dot pill-dot-yellow" />
          <span>Real-time web</span>
        </div>
        <div className="brand-pill">
          <span className="pill-dot pill-dot-green" />
          <span>Verified citations</span>
        </div>
        <div className="brand-pill">
          <span className="pill-dot pill-dot-primary" />
          <span>Deep synthesis</span>
        </div>
      </div>
    </div>
  );
};

export default AuthBrandPanel;
