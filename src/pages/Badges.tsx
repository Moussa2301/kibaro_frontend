import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";

type UserBadge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
};

const Badges: React.FC = () => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const res = await api.get("/badges/me");
      setBadges(res.data);
    } catch (err: any) {
      setError("Impossible de charger les badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setError(null);
      await api.post("/badges/refresh");
      await load();
    } catch (err: any) {
      setError("Erreur lors de la mise à jour des badges");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <p>Chargement des badges...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header responsive */}
      <div className="page-head">
        <div>
          <h1>Mes badges</h1>
          <p className="page-subtitle">
            Débloque des récompenses en jouant aux quiz (chapitres, duel, multijoueur).
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-mobile-block"
          type="button"
        >
          {refreshing ? "Mise à jour..." : "Rafraîchir"}
        </button>
      </div>

      <div className="mt-4">
        {badges.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🏅</div>
            <p style={{ color: "#9ca3af" }}>
              Aucun badge pour le moment. Joue des quiz pour en débloquer !
            </p>
          </div>
        ) : (
          <div className="badges-grid">
            {badges.map((b) => (
              <div key={b.id} className="badge-card">
                <div className="badge-card-head">
                  <div className="badge-icon" aria-hidden="true">
                    {b.icon}
                  </div>

                  <div className="badge-text">
                    <h3 className="badge-title">{b.title}</h3>
                    <p className="badge-desc">{b.description}</p>
                  </div>
                </div>

                <div className="badge-meta">
                  Obtenu le{" "}
                  <strong>
                    {new Date(b.date).toLocaleDateString()}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Badges;
