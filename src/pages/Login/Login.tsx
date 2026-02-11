import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";

function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err.message ?? "Erreur de connexion");
      return;
    }
    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <img src="/logo.png" alt="" className="auth-card__logo" />
          <h1 className="auth-card__title">PlanMyJob</h1>
          <p className="auth-card__tagline">Connexion</p>
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
              autoComplete="current-password"
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="auth-card__footer">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="auth-card__link">
            S'inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
