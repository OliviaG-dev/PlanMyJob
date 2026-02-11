import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Signup.css";

function Signup() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password);
    setLoading(false);
    if (err) {
      setError(err.message ?? "Erreur lors de l'inscription");
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
  }

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-card__brand">
            <img src="/logo.png" alt="" className="auth-card__logo" />
            <h1 className="auth-card__title">PlanMyJob</h1>
          </div>
          <p className="auth-form__success">
            Compte créé. Vérifiez votre email pour confirmer, puis vous serez
            redirigé…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <img src="/logo.png" alt="" className="auth-card__logo" />
          <h1 className="auth-card__title">PlanMyJob</h1>
          <p className="auth-card__tagline">Créer un compte</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <p className="auth-form__error" role="alert">
              {error}
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
              disabled={loading}
            />
          </label>
          <label className="auth-form__label">
            Mot de passe
            <input
              type="password"
              className="auth-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
          </label>
          <label className="auth-form__label">
            Confirmer le mot de passe
            <input
              type="password"
              className="auth-form__input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading}
          >
            {loading ? "Inscription…" : "S'inscrire"}
          </button>
        </form>
        <p className="auth-card__footer">
          Déjà un compte ?{" "}
          <Link to="/login" className="auth-card__link">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Signup;
