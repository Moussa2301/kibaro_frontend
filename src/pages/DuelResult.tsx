import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";

type Game = {
  id: string;
  status: "PENDING" | "RUNNING" | "FINISHED" | string;

  player1Id: string;
  player2Id?: string | null;

  player1Score?: number | null;
  player2Score?: number | null;
  player1Time?: number | null;
  player2Time?: number | null;

  chapter?: { id: string; title: string } | null;
  player1?: { id: string; username: string } | null;
  player2?: { id: string; username: string } | null;
};

const DuelResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const myUserId = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.userId ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchGame = async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await api.get(`/games/${id}`);
        setGame(res.data);
      } catch (e: any) {
        setErr(e?.response?.data?.msg || "Impossible de charger le résultat");
      } finally {
        setLoading(false);
      }
    };

    fetchGame();

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/games/${id}`);
        const g: Game = res.data;
        setGame(g);
        if (g.status === "FINISHED") clearInterval(interval);
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id]);

  const computeWinner = (g: Game) => {
    const p1s = g.player1Score ?? null;
    const p2s = g.player2Score ?? null;
    const p1t = g.player1Time ?? null;
    const p2t = g.player2Time ?? null;

    if (p1s === null || p2s === null) return { winner: "PENDING" as const };

    if (p1s > p2s) return { winner: "P1" as const };
    if (p2s > p1s) return { winner: "P2" as const };

    if (p1t !== null && p2t !== null) {
      if (p1t < p2t) return { winner: "P1" as const };
      if (p2t < p1t) return { winner: "P2" as const };
    }

    return { winner: "DRAW" as const };
  };

  const winnerLabel = useMemo(() => {
    if (!game) return "";
    const w = computeWinner(game);

    const p1 = game.player1?.username || "Joueur 1";
    const p2 = game.player2?.username || "Joueur 2";

    if (w.winner === "PENDING") return "En attente du résultat de l’autre joueur…";
    if (w.winner === "DRAW") return "Match nul 🤝";
    if (w.winner === "P1") return `Gagnant : ${p1} 🏆`;
    return `Gagnant : ${p2} 🏆`;
  }, [game]);

  const myResultLabel = useMemo(() => {
    if (!game || !myUserId) return null;
    const w = computeWinner(game);

    if (w.winner === "PENDING") return null;
    if (w.winner === "DRAW") return "Match nul 🤝";

    const isMeP1 = game.player1Id === myUserId;
    const isMeP2 = game.player2Id === myUserId;

    if (!isMeP1 && !isMeP2) return null;

    const iWin = (w.winner === "P1" && isMeP1) || (w.winner === "P2" && isMeP2);
    return iWin ? "Tu as gagné ✅" : "Tu as perdu ❌";
  }, [game, myUserId]);

  if (loading) {
    return (
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1>Résultat du duel</h1>
        <p className="mt-2" style={{ color: "#9ca3af" }}>
          Chargement…
        </p>
      </motion.div>
    );
  }

  if (err || !game) {
    return (
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1>Résultat du duel</h1>
        <p className="mt-2 form-error">{err || "Duel introuvable"}</p>
        <button onClick={() => navigate("/duel")} className="btn-block">
          Retour au Duel
        </button>
      </motion.div>
    );
  }

  const p1 = game.player1?.username || "Joueur 1";
  const p2 = game.player2?.username || "Joueur 2";

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1>Résultat du duel 🏁</h1>
          <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Chapitre : <strong>{game.chapter?.title ?? "—"}</strong> • Statut :{" "}
            <strong>{game.status}</strong>
          </p>
        </div>
        <span className="badge">{game.status}</span>
      </div>

      <section className="card mt-4">
        <h2 style={{ marginTop: 0 }}>{winnerLabel}</h2>
        {myResultLabel && (
          <p className="mt-2" style={{ fontWeight: 700 }}>
            {myResultLabel}
          </p>
        )}

        <div className="mt-4 duel-result-grid">
          <div className="duel-result-card">
            <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
              <strong>{p1}</strong>
              <span className="badge">P1</span>
            </div>
            <div className="mt-2" style={{ color: "#9ca3af" }}>
              Score : <strong style={{ color: "#e5e7eb" }}>{game.player1Score ?? "—"}</strong>
              {"  "} • Temps :{" "}
              <strong style={{ color: "#e5e7eb" }}>
                {game.player1Time ?? "—"}
                {game.player1Time !== null && game.player1Time !== undefined ? "s" : ""}
              </strong>
            </div>
          </div>

          <div className="duel-result-card">
            <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
              <strong>{p2}</strong>
              <span className="badge">P2</span>
            </div>
            <div className="mt-2" style={{ color: "#9ca3af" }}>
              Score : <strong style={{ color: "#e5e7eb" }}>{game.player2Score ?? "—"}</strong>
              {"  "} • Temps :{" "}
              <strong style={{ color: "#e5e7eb" }}>
                {game.player2Time ?? "—"}
                {game.player2Time !== null && game.player2Time !== undefined ? "s" : ""}
              </strong>
            </div>
          </div>
        </div>

        <div className="mt-4 duel-result-actions">
          <button onClick={() => navigate("/duel")} className="btn-block">
            Nouveau duel
          </button>
          <button onClick={() => navigate("/chapters")} className="btn-block">
            Retour chapitres
          </button>
        </div>
      </section>
    </motion.div>
  );
};

export default DuelResult;
