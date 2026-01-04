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
      <div className="flex-between">
        <h1>Mes badges</h1>
        <button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Mise à jour..." : "Rafraîchir"}
        </button>
      </div>
      <div className="mt-4">
        {badges.length === 0 && (
          <p style={{ color: "#9ca3af" }}>
            Aucun badge pour le moment. Joue des quiz pour en débloquer !
          </p>
        )}
        <div className="mt-2" style={{ display: "grid", gap: "0.75rem" }}>
          {badges.map((b) => (
            <div
              key={b.id}
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
                background: "#020617",
              }}
            >
              <div className="flex-between">
                <div>
                  <h3>{b.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                    {b.description}
                  </p>
                </div>
                <span style={{ fontSize: "1.5rem" }}>{b.icon}</span>
              </div>
              <p
                className="mt-2"
                style={{ fontSize: "0.8rem", color: "#6b7280" }}
              >
                Obtenu le {new Date(b.date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Badges;
