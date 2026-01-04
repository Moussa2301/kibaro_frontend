import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo_kibaro.png";



const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <img src={logo} alt="Kibaro" style={{ height: 60, display: "block", margin: "0 auto 1rem" }} />
      <h1>Connexion</h1>
      <p className="mt-2" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        Reprends ta progression sur Kibaro History.
      </p>
      <form className="mt-4" onSubmit={handleSubmit}>
        <div className="mt-2">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mt-2">
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="form-error mt-2">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p className="mt-4" style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        Pas encore de compte ?{" "}
        <Link to="/register" style={{ textDecoration: "underline" }}>
          Créer un compte
        </Link>
      </p>
    </div>
  );
};

export default Login;
