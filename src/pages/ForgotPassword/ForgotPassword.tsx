import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../Login/Login.css";
import "./ForgotPassword.css";

function ForgotPassword() {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    const { error } = await sendPasswordResetEmail(email.trim());
    if (error) {
      setStatus("error");
      setErrorMessage(error.message ?? "L'envoi a échoué. Réessayez.");
      return;
    }
    setStatus("success");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <img src="/logo.png" alt="" className="auth-card__logo" />
          <h1 className="auth-card__title">Mot de passe oublié</h1>
          <p className="auth-card__tagline">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>
        {status === "success" ? (
          <div className="forgot-password__success">
            <p className="forgot-password__success-text">
              Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé par email.
            </p>
            <Link to="/login" className="auth-card__link">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMessage && (
              <p className="auth-form__error" role="alert">
                {errorMessage}
              </p>
            )}
            <label className="auth-form__label">
              Email
              <input
                type="email"
                className="auth-form__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={status === "loading"}
                placeholder="votre@email.com"
              />
            </label>
            <button
              type="submit"
              className="auth-form__submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}
        <p className="auth-card__footer">
          <Link to="/login" className="auth-card__link">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPassword;
