import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";

type Score = {
  id: string;
  quizType: string;
  points: number;
  createdAt: string;
  chapter?: { title: string } | null;
};

type LeaderboardEntry = {
  userId: string;
  username: string;
  totalPoints: number;
};

const Scores: React.FC = () => {
  const [myScores, setMyScores] = useState<Score[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalMyPoints = useMemo(
    () => myScores.reduce((acc, s) => acc + (typeof s.points === "number" ? s.points : 0), 0),
    [myScores]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);

        const [meRes, lbRes] = await Promise.all([
          api.get("/scores/me"),
          api.get("/scores/leaderboard"),
        ]);

        setMyScores(Array.isArray(meRes.data) ? meRes.data : []);
        setLeaderboard(Array.isArray(lbRes.data) ? lbRes.data : []);
      } catch (err: any) {
        setError("Impossible de charger les scores");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p>Chargement des scores...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1>Scores & Classement</h1>
          <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Total de tes points (scores): <b>{totalMyPoints}</b>
          </p>
        </div>
        <div className="chip">
          <span className="chip-dot" />
          <span>{leaderboard.length} joueur(s)</span>
        </div>
      </div>

      {/* Layout responsive : colonne sur mobile */}
      <div className="mt-4 scores-grid">
        {/* MES SCORES */}
        <div className="card">
          <div className="flex-between">
            <h3 style={{ marginBottom: 0 }}>Mes derniers scores</h3>
            <span className="badge">{myScores.length}</span>
          </div>

          {/* Desktop table */}
          <div className="hide-mobile mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Quiz</th>
                  <th>Chapitre</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {myScores.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                    <td>{s.quizType}</td>
                    <td>{s.chapter?.title ?? "-"}</td>
                    <td>{s.points}</td>
                  </tr>
                ))}
                {myScores.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: "#9ca3af" }}>
                      Aucun score pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="show-mobile mt-4">
            {myScores.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>Aucun score pour le moment.</p>
            ) : (
              <div className="list-cards">
                {myScores.map((s) => (
                  <div key={s.id} className="mobile-card">
                    <div className="flex-between">
                      <div style={{ fontWeight: 700 }}>{s.quizType}</div>
                      <div className="chip">
                        <span className="chip-dot" />
                        <span>{s.points} pts</span>
                      </div>
                    </div>

                    <div className="mt-2" style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                      <div>
                        <b>Date :</b> {new Date(s.createdAt).toLocaleString()}
                      </div>
                      <div className="mt-2">
                        <b>Chapitre :</b> {s.chapter?.title ?? "-"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="card">
          <div className="flex-between">
            <h3 style={{ marginBottom: 0 }}>Top joueurs</h3>
            <span className="badge">Leaderboard</span>
          </div>

          {/* Desktop table */}
          <div className="hide-mobile mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Joueur</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((e, index) => (
                  <tr key={e.userId}>
                    <td>{index + 1}</td>
                    <td>{e.username}</td>
                    <td>{e.totalPoints}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: "#9ca3af" }}>
                      Aucun joueur pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="show-mobile mt-4">
            {leaderboard.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>Aucun joueur pour le moment.</p>
            ) : (
              <div className="list-cards">
                {leaderboard.map((e, index) => (
                  <div key={e.userId} className="mobile-card">
                    <div className="flex-between">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="rank-pill">#{index + 1}</span>
                        <div style={{ fontWeight: 700 }}>{e.username}</div>
                      </div>
                      <div className="chip">
                        <span className="chip-dot" />
                        <span>{e.totalPoints} pts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Scores;
