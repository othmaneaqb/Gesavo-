import { useState } from "react";
import logo from "../../../assets/logo-ait-el-hadj-cropped.png";
import { authService } from "../../../services/auth.service";

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
      setFieldError("Veuillez renseigner votre email et votre mot de passe.");
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
      setRecoveryError("Veuillez saisir votre adresse email.");
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError("");
    try {
      await authService.requestPasswordReset(recoveryEmail.trim());
      setRecoverySent(true);
    } catch {
      setRecoveryError("Impossible d'envoyer la demande pour le moment.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="legal-login">
      <section className="legal-login-panel">
        <div className="legal-login-inner">
          <div className="legal-brand">
            <img src={logo} alt="Aït El Hadj Avocat" />
          </div>

          <div className="legal-login-heading">
            <h2>Connexion</h2>
            <p>Accédez à votre espace sécurisé de gestion du cabinet.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group legal-form-group">
              <label className="form-label">Email</label>
              <div className="legal-input-wrap">
                <span><MailIcon /></span>
                <input
                  className="form-control"
                  value={form.identifier}
                  onChange={set("identifier")}
                  placeholder="Adresse e-mail"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group legal-form-group">
              <label className="form-label">Mot de passe</label>
              <div className="legal-input-wrap">
                <span><LockIcon /></span>
                <input
                  className="form-control"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Mot de passe"
                  autoComplete="current-password"
                />
                <em><EyeIcon /></em>
              </div>
            </div>

            <div className="legal-login-meta">
              <label className="legal-checkbox">
                <input type="checkbox" checked={form.remember} onChange={set("remember")} />
                <span>Se souvenir de moi</span>
              </label>
              <button type="button" className="text-link" onClick={() => setRecoveryOpen(prev => !prev)}>
                Mot de passe oublié ?
              </button>
            </div>

            {(fieldError || error) && <div className="auth-error">{fieldError || error}</div>}

            <button className="btn btn-gold auth-submit legal-submit" type="submit" disabled={submitting}>
              <LockIcon />
              {submitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="legal-login-divider">
            <span><ScaleIcon /></span>
          </div>

          <div className="legal-login-footer">
            <strong>Cabinet Aït El Hadj</strong>
            <span>Rigueur. Confidentialité. Excellence.</span>
          </div>

          {recoveryOpen && (
            <form className="recovery-card" onSubmit={handleRecovery}>
              <div>
                <h3>Récupération du mot de passe</h3>
                <p>Entrez votre email professionnel. Si le compte existe, vous recevrez un lien sécurisé pour choisir un nouveau mot de passe.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  value={recoveryEmail}
                  onChange={event => setRecoveryEmail(event.target.value)}
                  placeholder="nom@cabinet.com"
                />
              </div>
              {recoveryError && <div className="auth-error">{recoveryError}</div>}
              {recoverySent && <div className="success-note">Si ce compte existe, un lien de réinitialisation a été envoyé.</div>}
              <button className="btn btn-ghost" type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="legal-login-visual" aria-hidden="true" />
    </div>
  );
}
