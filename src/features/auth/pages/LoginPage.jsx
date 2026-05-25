import { useState } from "react";
import logo from "../../../assets/logo-ait-el-hadj-cropped.png";
import { authService } from "../../../services/auth.service";
import { useI18n } from "../../../i18n";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.75h16v10.5H4z" />
      <path d="m4.75 7.5 7.25 5.25 7.25-5.25" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v15" />
      <path d="M7 6h10" />
      <path d="m7 6-4 7h8L7 6Z" />
      <path d="m17 6-4 7h8l-4-7Z" />
      <path d="M8 20h8" />
    </svg>
  );
}

export default function LoginPage({ onLogin, error }) {
  const { language, languages, setLanguage, t } = useI18n();
  const [form, setForm] = useState({ identifier: "", password: "", remember: true });
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  const set = key => event => {
    const value = key === "remember" ? event.target.checked : event.target.value;
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.identifier.trim() || !form.password.trim()) {
      setFieldError(t("auth.missingFields"));
      return;
    }

    setFieldError("");
    setSubmitting(true);
    try {
      await onLogin(form.identifier, form.password);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecovery = async event => {
    event.preventDefault();
    if (!recoveryEmail.trim()) {
      setRecoveryError(t("auth.recoveryEmailRequired"));
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError("");
    try {
      await authService.requestPasswordReset(recoveryEmail.trim());
      setRecoverySent(true);
    } catch {
      setRecoveryError(t("auth.recoveryError"));
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="legal-login">
      <section className="legal-login-panel">
        <div className="legal-login-inner">
          <div className="legal-brand">
            <img src={logo} alt={"A\u00EFt El Hadj Avocat"} />
          </div>

          <select className="language-select legal-language-select" value={language} onChange={event => setLanguage(event.target.value)} aria-label="Language">
            {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>

          <div className="legal-login-heading">
            <h2>{t("auth.loginTitle")}</h2>
            <p>{t("auth.loginSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group legal-form-group">
              <label className="form-label">{t("auth.email")}</label>
              <div className="legal-input-wrap">
                <span><MailIcon /></span>
                <input
                  className="form-control"
                  value={form.identifier}
                  onChange={set("identifier")}
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group legal-form-group">
              <label className="form-label">{t("auth.password")}</label>
              <div className="legal-input-wrap">
                <span><LockIcon /></span>
                <input
                  className="form-control"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete="current-password"
                />
                <em><EyeIcon /></em>
              </div>
            </div>

            <div className="legal-login-meta">
              <label className="legal-checkbox">
                <input type="checkbox" checked={form.remember} onChange={set("remember")} />
                <span>{t("auth.remember")}</span>
              </label>
              <button type="button" className="text-link" onClick={() => setRecoveryOpen(prev => !prev)}>
                {t("auth.forgot")}
              </button>
            </div>

            {(fieldError || error) && <div className="auth-error">{fieldError || t(error)}</div>}

            <button className="btn btn-gold auth-submit legal-submit" type="submit" disabled={submitting}>
              <LockIcon />
              {submitting ? t("auth.submitting") : t("auth.submit")}
            </button>
          </form>

          <div className="legal-login-divider">
            <span><ScaleIcon /></span>
          </div>

          <div className="legal-login-footer">
            <strong>{t("auth.footerFirm")}</strong>
            <span>{t("auth.footerValues")}</span>
          </div>

          {recoveryOpen && (
            <form className="recovery-card" onSubmit={handleRecovery}>
              <div>
                <h3>{t("auth.recoveryTitle")}</h3>
                <p>{t("auth.recoveryText")}</p>
              </div>
              <div className="form-group">
                <label className="form-label">{t("auth.email")}</label>
                <input
                  className="form-control"
                  value={recoveryEmail}
                  onChange={event => setRecoveryEmail(event.target.value)}
                  placeholder="nom@cabinet.com"
                />
              </div>
              {recoveryError && <div className="auth-error">{recoveryError}</div>}
              {recoverySent && <div className="success-note">{t("auth.recoverySuccess")}</div>}
              <button className="btn btn-ghost" type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? t("auth.recoverySending") : t("auth.recoverySend")}
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="legal-login-visual" aria-hidden="true" />
    </div>
  );
}
