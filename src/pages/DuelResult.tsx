import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

type Game = {
  id: string;
  status: "PENDING" | "RUNNING" | "FINISHED" | string;

  player1Id: string;
  player2Id?: string | null;

  player1Score?: number | null;
  player2Score?: number | null;
  player1Time?: number | null; // secondes
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

  // (Optionnel) lire le token pour récupérer le userId si tu l’as mis dedans
  // Sinon on affiche juste le gagnant global.
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

    // petit refresh toutes les 2s tant que pas FINISHED (le temps que l’autre joueur submit)
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

    // Si un joueur n’a pas soumis, pas de gagnant définitif
    if (p1s === null || p2s === null) return { winner: "PENDING" as const };

    // score plus élevé gagne
    if (p1s > p2s) return { winner: "P1" as const };
    if (p2s > p1s) return { winner: "P2" as const };

    // égalité => temps le plus bas gagne (si dispo)
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
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Résultat du duel</h2>
        <p>Chargement…</p>
      </div>
    );
  }

  if (err || !game) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Résultat du duel</h2>
        <p style={{ color: "#ff6b6b" }}>{err || "Duel introuvable"}</p>
        <button onClick={() => navigate("/duel")} style={{ padding: 12 }}>
          Retour au Duel
        </button>
      </div>
    );
  }

  const p1 = game.player1?.username || "Joueur 1";
  const p2 = game.player2?.username || "Joueur 2";

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h2>Résultat du duel 🏁</h2>
      <p style={{ opacity: 0.9, marginTop: 6 }}>
        Chapitre : <b>{game.chapter?.title ?? "—"}</b> &nbsp; | &nbsp; Statut :{" "}
        <b>{game.status}</b>
      </p>

      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>{winnerLabel}</h3>
        {myResultLabel && <p style={{ marginTop: 6 }}>{myResultLabel}</p>}

        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)" }}>
            <b>{p1}</b>
            <div style={{ marginTop: 6 }}>
              Score : <b>{game.player1Score ?? "—"}</b>
              {"  "} | Temps : <b>{game.player1Time ?? "—"}</b>
              {game.player1Time !== null && game.player1Time !== undefined ? "s" : ""}
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)" }}>
            <b>{p2}</b>
            <div style={{ marginTop: 6 }}>
              Score : <b>{game.player2Score ?? "—"}</b>
              {"  "} | Temps : <b>{game.player2Time ?? "—"}</b>
              {game.player2Time !== null && game.player2Time !== undefined ? "s" : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => navigate("/duel")} style={{ padding: 12, flex: 1 }}>
            Nouveau duel
          </button>
          <button onClick={() => navigate("/chapters")} style={{ padding: 12, flex: 1 }}>
            Retour chapitres
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuelResult;
