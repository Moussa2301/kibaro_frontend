import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import logo from "../assets/logo_kibaro.png";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    if (!user) {
      setTotalPoints(null);
      return;
    }

    const loadScores = async () => {
      try {
        const res = await api.get("/scores/me");
        const scores = res.data as Array<{ points: number }>;

        const sum = scores.reduce(
          (acc, s) => acc + (typeof s.points === "number" ? s.points : 0),
          0
        );
        setTotalPoints(sum);
      } catch (e) {
        console.error("Erreur chargement des scores utilisateur", e);
        setTotalPoints(user.points ?? 0);
      }
    };

    loadScores();
  }, [user]);

  // Ferme le menu mobile si l'utilisateur se déconnecte / change
  useEffect(() => {
    setMobileOpen(false);
  }, [user?.id]);

  // Empêche le scroll derrière quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const pointsToShow = totalPoints !== null ? totalPoints : user?.points ?? 0;

  const NavItem = ({
    to,
    label,
  }: {
    to: string;
    label: React.ReactNode;
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "active-link" : "")}
      onClick={() => setMobileOpen(false)}
      end={to === "/"}
    >
      {label}
    </NavLink>
  );

  return (
    <header className="navbar">
      <div className="navbar-left" onClick={() => navigate("/")}>
        <img src={logo} alt="Kibaro" className="navbar-logo" />
        <strong className="navbar-title">Kibaro History</strong>
      </div>

      {/* Si pas connecté -> pas de menu */}
      {!user ? null : (
        <>
          {/* DESKTOP NAV */}
          <nav className="nav-links hide-mobile">
            <NavItem to="/" label="Tableau de bord" />
            <NavItem to="/chapters" label="Chapitres" />
            <NavItem to="/scores" label="Scores" />
            <NavItem to="/badges" label="Badges" />
            <NavItem to="/duel" label="Duel" />
            <NavItem to="/multiplayer" label="Multijoueur" />
            {user.role === "ADMIN" && <NavItem to="/admin" label="Admin" />}
          </nav>

          {/* DESKTOP RIGHT */}
          <div className="nav-right hide-mobile">
            <span className="badge">
              {user.username} · {pointsToShow} pts
            </span>
            <button onClick={handleLogout}>Déconnexion</button>
          </div>

          {/* MOBILE BUTTON */}
          <div className="show-mobile">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>
          </div>

          {/* MOBILE OVERLAY MENU */}
          {mobileOpen && (
            <div className="mobile-overlay" role="dialog" aria-modal="true">
              <div className="mobile-panel">
                <div className="mobile-top">
                  <div className="mobile-user">
                    <div className="mobile-user-title">{user.username}</div>
                    <div className="mobile-user-sub">{pointsToShow} points</div>
                  </div>

                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Fermer le menu"
                  >
                    ✕
                  </button>
                </div>

                <div className="mobile-links">
                  <NavItem to="/" label="🏠 Tableau de bord" />
                  <NavItem to="/chapters" label="📚 Chapitres" />
                  <NavItem to="/scores" label="📈 Scores" />
                  <NavItem to="/badges" label="🏅 Badges" />
                  <NavItem to="/duel" label="⚔️ Duel" />
                  <NavItem to="/multiplayer" label="👥 Multijoueur" />
                  {user.role === "ADMIN" && <NavItem to="/admin" label="🛠️ Admin" />}
                </div>

                <div className="mobile-bottom">
                  <button className="w-100" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </div>
              </div>

              {/* click dehors ferme */}
              <button
                className="mobile-backdrop"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
              />
            </div>
          )}
        </>
      )}
    </header>
  );
};

export default Navbar;
