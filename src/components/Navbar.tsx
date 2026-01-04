import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import logo from "../assets/logo_kibaro.png";




const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!user) {
      setTotalPoints(null);
      return;
    }

    const loadScores = async () => {
      try {
        // 👉 adapte le chemin si ta route est différente
        // (par ex. "/scores/my" ou "/scores/me")
        const res = await api.get("/scores/me");
        const scores = res.data as Array<{ points: number }>;

        const sum = scores.reduce(
          (acc, s) => acc + (typeof s.points === "number" ? s.points : 0),
          0
        );
        setTotalPoints(sum);
      } catch (e) {
        console.error("Erreur chargement des scores utilisateur", e);
        // en secours, on affiche éventuellement la valeur déjà dans user.points
        setTotalPoints(user.points ?? 0);
      }
    };

    loadScores();
  }, [user]);

  return (
    <header className="navbar">
      <div>
        <img src={logo} alt="Kibaro" style={{ height: 40 }} />
        <strong>Kibaro History</strong>
      </div>
      {user && (
        <>
          <nav className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              end
            >
              Tableau de bord
            </NavLink>
            <NavLink
              to="/chapters"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Chapitres
            </NavLink>
            <NavLink
              to="/scores"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Scores
            </NavLink>
            <NavLink
              to="/badges"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Badges
            </NavLink>
            <NavLink
              to="/duel"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Duel
            </NavLink>
            <NavLink
              to="/multiplayer"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Multijoueur
            </NavLink>


            {user.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex gap-2">
            <span className="badge">
              {user.username} ·{" "}
              {totalPoints !== null
                ? totalPoints
                : user.points ?? 0}{" "}
              pts
            </span>
            <button onClick={handleLogout}>Déconnexion</button>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
