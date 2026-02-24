import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import "./ResetPassword.css";

function ResetPassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    const hasHash = window.location.hash.length > 0;
    if (hasHash) return;
    navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) {
      setError(err.message ?? "Une erreur est survenue.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/settings", { replace: true }), 1500);
  }

  if (loading || (!user && !window.location.hash)) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p className="reset-password__wait">Chargement…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p className="reset-password__wait">Vérification du lien…</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p className="reset-password__success">Mot de passe mis à jour. Redirection vers les paramètres…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <img src="/logo.png" alt="" className="auth-card__logo" />
          <h1 className="auth-card__title">Nouveau mot de passe</h1>
          <p className="auth-card__tagline">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          )}
          <label className="auth-form__label">
            Nouveau mot de passe
            <input
              type="password"
              className="auth-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              disabled={submitting}
            />
          </label>
          <label className="auth-form__label">
            Confirmer le mot de passe
            <input
              type="password"
              className="auth-form__input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              disabled={submitting}
            />
          </label>
          <button
            type="submit"
            className="auth-form__submit"
            disabled={submitting}
          >
            {submitting ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </button>
        </form>
        <p className="auth-card__footer">
          <button
            type="button"
            className="reset-password__back"
            onClick={() => navigate("/settings")}
          >
            Retour aux paramètres
          </button>
        </p>
      </div>
    </main>
  );
}

export default ResetPassword;
