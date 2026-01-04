import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h1>Créer un compte</h1>
      <p className="mt-2" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        Rejoins l'aventure et découvre l'histoire de la Guinée et de l'Afrique.
      </p>
      <form className="mt-4" onSubmit={handleSubmit}>
        <div className="mt-2">
          <label>Pseudo</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
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
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-4" style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        Déjà un compte ?{" "}
        <Link to="/login" style={{ textDecoration: "underline" }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
};

export default Register;
