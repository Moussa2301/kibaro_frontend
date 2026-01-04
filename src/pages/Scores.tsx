import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";

type Score = {
  id: string;
  quizType: string;
  points: number;
  createdAt: string;
  chapter?: {
    title: string;
  } | null;
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

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, lbRes] = await Promise.all([
          api.get("/scores/me"),
          api.get("/scores/leaderboard"),
        ]);
        setMyScores(meRes.data);
        setLeaderboard(lbRes.data);
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
      <h1>Scores & Classement</h1>
      <div className="mt-4 flex gap-4" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h3>Mes derniers scores</h3>
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
        <div style={{ flex: 1 }}>
          <h3>Top joueurs (points cumulés)</h3>
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
      </div>
    </motion.div>
  );
};

export default Scores;
