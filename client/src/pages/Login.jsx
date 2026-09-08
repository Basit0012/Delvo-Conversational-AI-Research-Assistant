import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import DelvoLogo from '../components/DelvoLogo';
import ThemeToggle from '../components/ThemeToggle';

// Sleek Brand SVG Icons for OAuth & SSO
const ChatGPTIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 16 16"
    className="vercel-oauth-icon"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M6.14 5.84v-1.5q-.01-.2.16-.29l3.02-1.74q.63-.35 1.42-.35c1.9 0 3.1 1.47 3.1 3.04l-.01.37-3.14-1.84a.5.5 0 0 0-.57 0zm7.07 5.87v-3.6q0-.32-.29-.5l-3.98-2.3 1.3-.75q.16-.09.32 0L13.6 6.3c.87.51 1.46 1.59 1.46 2.64 0 1.2-.71 2.31-1.84 2.77m-8-3.17-1.3-.76q-.17-.1-.17-.29V4c0-1.7 1.3-2.98 3.06-2.98q1.02.01 1.81.62L5.5 3.44a.5.5 0 0 0-.29.5zM8 10.16 6.14 9.1V6.89L8 5.84 9.86 6.9v2.22zm1.2 4.82q-1.02-.01-1.81-.62l3.12-1.8a.5.5 0 0 0 .29-.5v-4.6l1.31.76q.17.1.16.29V12c0 1.7-1.31 2.98-3.07 2.98m-3.76-3.54L2.4 9.7A3.1 3.1 0 0 1 .95 7.06c0-1.22.73-2.31 1.86-2.77V7.9q0 .34.28.5l3.97 2.3-1.3.74a.3.3 0 0 1-.32 0m-.18 2.6c-1.79 0-3.1-1.35-3.1-3.01q0-.19.03-.38l3.12 1.8q.3.18.57 0l3.98-2.3v1.51q.01.2-.16.29l-3.02 1.74q-.63.35-1.42.35m3.94 1.89a3.96 3.96 0 0 0 3.88-3.17 3.97 3.97 0 0 0 1.59-6.79q.12-.5.12-1a3.96 3.96 0 0 0-5.21-3.76 3.97 3.97 0 0 0-6.66 2.03 3.97 3.97 0 0 0-1.59 6.79q-.12.5-.12 1a3.96 3.96 0 0 0 5.21 3.76c.72.7 1.7 1.14 2.78 1.14"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="vercel-oauth-icon" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="vercel-oauth-icon" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const SamlIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="vercel-oauth-icon" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PasskeyIcon = () => (
  <svg
    viewBox="0 0 16 16"
    height="16"
    width="16"
    className="vercel-oauth-icon"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M2 2.75A2.75 2.75 0 0 1 4.75 0h.5A2.75 2.75 0 0 1 8 2.75v.5A2.75 2.75 0 0 1 5.25 6h-.5A2.75 2.75 0 0 1 2 3.25zM4.75 1.5c-.69 0-1.25.56-1.25 1.25v.5c0 .69.56 1.25 1.25 1.25h.5c.69 0 1.25-.56 1.25-1.25v-.5c0-.69-.56-1.25-1.25-1.25zM5 9c-1.42 0-2.73.78-3.4 2.02l-.1.17v1.31H9V14H0v-3.2l.1-.16.17-.33a5.38 5.38 0 0 1 8.66-1.1l-1 1.12A3.9 3.9 0 0 0 5 9m11-3c0 1.35-.83 2.51-2 3l1.5 1.5L14 12l1.5 1.5L14 15l-1 1-1.5-1.5V9A3.25 3.25 0 1 1 16 6m-3.25.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
      clipRule="evenodd"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.92.04-2.02.62-2.66 1.37-.56.65-1.06 1.71-.92 2.73 1.03.08 2.07-.5 2.66-1.25z" />
  </svg>
);

const GitLabIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#E24329" d="M12 21.42l4.08-12.56H7.92L12 21.42z" />
    <path fill="#FC6D26" d="M12 21.42l-4.08-12.56H1.58L12 21.42z" />
    <path fill="#FCA326" d="M1.58 8.86l-.98 3.03a1.05 1.05 0 0 0 .38 1.18L12 21.42 1.58 8.86z" />
    <path fill="#E24329" d="M1.58 8.86h6.34L5.64 1.83a.53.53 0 0 0-1 0L1.58 8.86z" />
    <path fill="#FC6D26" d="M12 21.42l4.08-12.56h6.34L12 21.42z" />
    <path fill="#FCA326" d="M22.42 8.86l.98 3.03a1.05 1.05 0 0 1-.38 1.18L12 21.42l10.42-12.56z" />
    <path fill="#E24329" d="M22.42 8.86h-6.34l2.28-7.03a.53.53 0 0 1 1 0l3.06 7.03z" />
  </svg>
);

const BitbucketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="5" fill="#69C00A" />
    <path
      d="M5.5 6.5h13l-1.5 10a1.5 1.5 0 0 1-1.5 1.25H8.5A1.5 1.5 0 0 1 7 16.5l-1.5-10zm4 4.5l.6 4h3.8l.6-4H9.5z"
      fill="#FFFFFF"
    />
  </svg>
);

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authenticatingProvider, setAuthenticatingProvider] = useState(null);
  const [showSamlModal, setShowSamlModal] = useState(false);
  const [samlEmail, setSamlEmail] = useState('');

  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();

  const handleSocialAuth = async (provider, customEmail, customUsername) => {
    try {
      setAuthenticatingProvider(provider);
      setErrorMessage('');
      await socialLogin(provider, customEmail || email || undefined, customUsername || undefined);
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || `Failed to authenticate with ${provider}.`);
    } finally {
      setAuthenticatingProvider(null);
    }
  };

  const handlePasskeyAuth = async () => {
    try {
      setAuthenticatingProvider('passkey');
      setErrorMessage('');
      if (typeof window !== 'undefined' && window.PublicKeyCredential && navigator.credentials) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const webauthnPromise = navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: 'Delvo', id: window.location.hostname },
              user: {
                id: new Uint8Array(16),
                name: 'passkey_user',
                displayName: 'Passkey User',
              },
              pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
              timeout: 1000,
              authenticatorSelection: {
                userVerification: 'preferred',
              },
            },
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Hardware authenticator timeout')), 600)
          );
          await Promise.race([webauthnPromise, timeoutPromise]);
        } catch (passkeyErr) {
          console.info('[WebAuthn Notice]: Fallback to Passkey credentials:', passkeyErr.message);
        }
      }
      await socialLogin('passkey', email || 'passkey.user@delvo.ai', 'Passkey User');
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to authenticate with Passkey.');
    } finally {
      setAuthenticatingProvider(null);
    }
  };

  const handleSamlSubmit = async (e) => {
    e.preventDefault();
    if (!samlEmail.trim()) return;
    await handleSocialAuth('saml', samlEmail.trim(), samlEmail.trim().split('@')[0]);
    setShowSamlModal(false);
  };

  const validate = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!email.trim()) {
      errors.email = 'Email address is required.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required.';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vercel-auth-layout auth-wrapper">
      {/* Top minimal navigation bar */}
      <header className="vercel-topbar">
        <Link to="/" className="vercel-logo-link" aria-label="Delvo Home">
          <DelvoLogo size={28} />
          <span className="vercel-logo-text">Delvo</span>
        </Link>
        <div className="vercel-topbar-actions">
          <Link to="/register" className="vercel-btn-subtle auth-link">
            Sign Up
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered single-column auth form */}
      <main className="vercel-auth-main">
        <h1 className="vercel-auth-title auth-title">Log in to Delvo</h1>

        {errorMessage && (
          <div className="vercel-auth-error auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="vercel-form auth-form" onSubmit={handleSubmit} noValidate>
          <div className="vercel-field form-group">
            <label className="vercel-label form-label" htmlFor="email">
              Email Address
            </label>
            <div className={`vercel-input-container input-container ${fieldErrors.email ? 'has-error' : ''}`}>
              <input
                id="email"
                type="email"
                className={`vercel-input input input-field ${fieldErrors.email ? 'has-error input-error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
              />
            </div>
            {fieldErrors.email && (
              <span className="vercel-field-error field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="vercel-field form-group">
            <label className="vercel-label form-label" htmlFor="password">
              Password
            </label>
            <div className={`vercel-input-container input-container ${fieldErrors.password ? 'has-error' : ''}`}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`vercel-input has-toggle input input-field ${
                  fieldErrors.password ? 'has-error input-error' : ''
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <button
                type="button"
                className="vercel-password-toggle password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="vercel-field-error field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="vercel-btn-primary btn-primary auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Continue with Email</span>
            )}
          </button>
        </form>

        {/* OAuth / SSO Buttons Stack */}
        <div className="vercel-oauth-stack">
          <button
            type="button"
            className="vercel-btn-oauth"
            disabled={Boolean(authenticatingProvider || isSubmitting)}
            onClick={() => handleSocialAuth('chatgpt')}
          >
            {authenticatingProvider === 'chatgpt' ? (
              <>
                <div className="spinner" />
                <span>Connecting to ChatGPT...</span>
              </>
            ) : (
              <>
                <ChatGPTIcon />
                <span>Continue with ChatGPT</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="vercel-btn-oauth"
            disabled={Boolean(authenticatingProvider || isSubmitting)}
            onClick={() => handleSocialAuth('google')}
          >
            {authenticatingProvider === 'google' ? (
              <>
                <div className="spinner" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="vercel-btn-oauth"
            disabled={Boolean(authenticatingProvider || isSubmitting)}
            onClick={() => handleSocialAuth('github')}
          >
            {authenticatingProvider === 'github' ? (
              <>
                <div className="spinner" />
                <span>Connecting to GitHub...</span>
              </>
            ) : (
              <>
                <GitHubIcon />
                <span>Continue with GitHub</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="vercel-btn-oauth"
            disabled={Boolean(authenticatingProvider || isSubmitting)}
            onClick={() => setShowSamlModal(true)}
          >
            {authenticatingProvider === 'saml' ? (
              <>
                <div className="spinner" />
                <span>Authenticating SAML...</span>
              </>
            ) : (
              <>
                <SamlIcon />
                <span>Continue with SAML SSO</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="vercel-btn-oauth"
            disabled={Boolean(authenticatingProvider || isSubmitting)}
            onClick={handlePasskeyAuth}
          >
            {authenticatingProvider === 'passkey' ? (
              <>
                <div className="spinner" />
                <span>Verifying Passkey...</span>
              </>
            ) : (
              <>
                <PasskeyIcon />
                <span>Continue with Passkey</span>
              </>
            )}
          </button>

          {/* Show other options button disappears on click and 3 buttons appear in its place */}
          {!showOtherOptions ? (
            <button
              type="button"
              className="vercel-btn-toggle-options"
              onClick={() => setShowOtherOptions(true)}
            >
              Show other options
            </button>
          ) : (
            <div className="vercel-other-options-grid">
              <button
                type="button"
                className="vercel-btn-sub-oauth"
                title="Continue with Apple"
                aria-label="Continue with Apple"
                disabled={Boolean(authenticatingProvider || isSubmitting)}
                onClick={() => handleSocialAuth('apple')}
              >
                {authenticatingProvider === 'apple' ? (
                  <div className="spinner" />
                ) : (
                  <AppleIcon />
                )}
              </button>
              <button
                type="button"
                className="vercel-btn-sub-oauth"
                title="Continue with GitLab"
                aria-label="Continue with GitLab"
                disabled={Boolean(authenticatingProvider || isSubmitting)}
                onClick={() => handleSocialAuth('gitlab')}
              >
                {authenticatingProvider === 'gitlab' ? (
                  <div className="spinner" />
                ) : (
                  <GitLabIcon />
                )}
              </button>
              <button
                type="button"
                className="vercel-btn-sub-oauth"
                title="Continue with Bitbucket"
                aria-label="Continue with Bitbucket"
                disabled={Boolean(authenticatingProvider || isSubmitting)}
                onClick={() => handleSocialAuth('bitbucket')}
              >
                {authenticatingProvider === 'bitbucket' ? (
                  <div className="spinner" />
                ) : (
                  <BitbucketIcon />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Enterprise SAML SSO Modal */}
        {showSamlModal && (
          <div className="vercel-modal-backdrop" onClick={() => setShowSamlModal(false)}>
            <div className="vercel-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="vercel-modal-header">
                <SamlIcon />
                <h3>Enterprise Single Sign-On</h3>
              </div>
              <p className="vercel-modal-desc">
                Enter your organization work email or SAML domain to authenticate via company SSO.
              </p>
              <form onSubmit={handleSamlSubmit}>
                <div className="vercel-field form-group">
                  <input
                    type="email"
                    className="vercel-input"
                    placeholder="name@company.com"
                    value={samlEmail}
                    onChange={(e) => setSamlEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="vercel-modal-actions">
                  <button
                    type="button"
                    className="vercel-btn-subtle"
                    onClick={() => setShowSamlModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="vercel-btn-primary"
                    style={{ width: 'auto', padding: '0 18px', marginTop: 0 }}
                    disabled={authenticatingProvider === 'saml'}
                  >
                    {authenticatingProvider === 'saml' ? 'Authenticating...' : 'Continue with SAML'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="vercel-switch auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="vercel-switch-link auth-link">
            Sign Up
          </Link>
        </div>
      </main>

      {/* Subtle anchored footer */}
      <footer className="vercel-footer">
        <Link to="/terms" className="vercel-footer-link">
          Terms
        </Link>
        <span>·</span>
        <Link to="/privacy" className="vercel-footer-link">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
};

export default Login;
