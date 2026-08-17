import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/logo-ait-el-hadj-cropped.png";
import { authService } from "../services/authService";
import { useI18n } from "@/i18n";

export default function ResetPasswordPage() {
  const { language, languages, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
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
      setError(t("reset.invalidLink"));
      return;
    }
    if (!form.password || !form.passwordConfirm) {
      setError(t("reset.required"));
      return;
    }
    if (form.password.length < 12) {
      setError(t("reset.minLength"));
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError(t("reset.mismatch"));
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
      setMessage(t("reset.success"));
    } catch (err) {
      const errors = err.response?.data;
      setError(
        errors?.password?.[0]
        || errors?.password_confirm?.[0]
        || errors?.detail
        || t("reset.expired")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goLogin = () => {
    navigate("/login", { replace: true });
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
            <h2>{t("reset.title")}</h2>
            <p>{t("reset.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group legal-form-group">
              <label className="form-label">{t("reset.password")}</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                minLength={12}
                placeholder={t("reset.passwordPlaceholder")}
              />
            </div>

            <div className="form-group legal-form-group">
              <label className="form-label">{t("reset.confirm")}</label>
              <input
                className="form-control"
                type="password"
                value={form.passwordConfirm}
                onChange={set("passwordConfirm")}
                autoComplete="new-password"
                placeholder={t("reset.confirmPlaceholder")}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="success-note">{message}</div>}

            <button className="btn btn-gold auth-submit legal-submit" type="submit" disabled={submitting || Boolean(message)}>
              {submitting ? t("reset.submitting") : t("reset.submit")}
            </button>
          </form>

          <button type="button" className="btn btn-ghost auth-submit reset-login-link" onClick={goLogin}>
            {t("reset.backLogin")}
          </button>
        </div>
      </section>

      <aside className="legal-login-visual" aria-hidden="true" />
    </div>
  );
}
