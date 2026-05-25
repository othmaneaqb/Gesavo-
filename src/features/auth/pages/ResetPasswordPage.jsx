import { useMemo, useState } from "react";
import logo from "../../../assets/logo-ait-el-hadj-cropped.png";
import { authService } from "../../../services/auth.service";

export default function ResetPasswordPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const [form, setForm] = useState({ password: "", passwordConfirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const set = key => event => {
    setForm(prev => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!uid || !token) {
      setError("Lien de réinitialisation invalide.");
      return;
    }
    if (!form.password || !form.passwordConfirm) {
      setError("Veuillez renseigner les deux champs.");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await authService.confirmPasswordReset({
        uid,
        token,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });
      setMessage("Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.");
    } catch (err) {
      setError(err.response?.data?.detail || "Lien invalide ou expiré.");
    } finally {
      setSubmitting(false);
    }
  };

  const goLogin = () => {
    window.history.replaceState({}, "", "/");
    window.location.reload();
  };

  return (
    <div className="legal-login">
      <section className="legal-login-panel">
        <div className="legal-login-inner">
          <div className="legal-brand">
            <img src={logo} alt="Aït El Hadj Avocat" />
          </div>

          <div className="legal-login-heading">
            <h2>Nouveau mot de passe</h2>
            <p>Choisissez un mot de passe sécurisé pour récupérer l'accès à votre espace.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group legal-form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                placeholder="Au moins 8 caractères"
              />
            </div>

            <div className="form-group legal-form-group">
              <label className="form-label">Confirmation</label>
              <input
                className="form-control"
                type="password"
                value={form.passwordConfirm}
                onChange={set("passwordConfirm")}
                autoComplete="new-password"
                placeholder="Confirmer le mot de passe"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="success-note">{message}</div>}

            <button className="btn btn-gold auth-submit legal-submit" type="submit" disabled={submitting || Boolean(message)}>
              {submitting ? "Réinitialisation..." : "Réinitialiser"}
            </button>
          </form>

          <button type="button" className="btn btn-ghost auth-submit reset-login-link" onClick={goLogin}>
            Retour à la connexion
          </button>
        </div>
      </section>

      <aside className="legal-login-visual" aria-hidden="true" />
    </div>
  );
}
