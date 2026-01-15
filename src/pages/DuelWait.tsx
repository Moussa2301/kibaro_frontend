import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";

type Game = {
  id: string;
  status: "PENDING" | "RUNNING" | "FINISHED" | string;
  chapterId?: string | null;
  player1Id: string;
  player2Id?: string | null;
  createdAt?: string;

  questionCount?: number | null;
  questionsPicked?: number | null;
  questionsAvailable?: number | null;
  chaptersSelected?: number | null;
};

const DuelWait: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const shareId = useMemo(() => id ?? "", [id]);

  const copyId = async () => {
    if (!shareId) return;
    try {
      await navigator.clipboard.writeText(shareId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setErr("Impossible de copier automatiquement. Copie l’ID manuellement.");
    }
  };

  useEffect(() => {
    if (!id) return;

    let alive = true;

    const fetchGame = async () => {
      try {
        setErr("");
        const res = await api.get(`/games/${id}`);
        const g: Game = res.data;

        if (!alive) return;
        setGame(g);

        if (g.status === "RUNNING") {
          navigate(`/duel/play/${id}`);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.msg || "Impossible de récupérer la partie");
      }
    };

    fetchGame();
    const interval = setInterval(fetchGame, 1500);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [id, navigate]);

  const infoLine = useMemo(() => {
    if (!game) return null;

    const chapters =
      game.chaptersSelected !== null && game.chaptersSelected !== undefined
        ? game.chaptersSelected
        : null;

    const picked =
      game.questionsPicked !== null && game.questionsPicked !== undefined
        ? game.questionsPicked
        : null;

    const requested =
      game.questionCount !== null && game.questionCount !== undefined
        ? game.questionCount
        : null;

    const available =
      game.questionsAvailable !== null && game.questionsAvailable !== undefined
        ? game.questionsAvailable
        : null;

    if (
      chapters === null &&
      picked === null &&
      requested === null &&
      available === null
    )
      return null;

    const parts: string[] = [];
    if (chapters !== null) parts.push(`${chapters} chapitre(s)`);
    if (picked !== null && requested !== null) parts.push(`${picked}/${requested} questions`);
    else if (requested !== null) parts.push(`${requested} questions`);
    if (available !== null) parts.push(`${available} dispo`);

    return parts.join(" • ");
  }, [game]);

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1>En attente du 2ᵉ joueur… ⏳</h1>
          <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Partage l’ID ci-dessous à ton ami pour qu’il rejoigne le duel.
          </p>
        </div>
        <span className="badge">{game?.status ?? "..."}</span>
      </div>

      {err && <p className="mt-2 form-error">{err}</p>}

      <section className="card mt-4">
        <label>ID du duel</label>

        <div className="duel-share mt-2">
          <code className="duel-code">{shareId}</code>
          <button type="button" onClick={copyId} className="duel-copy-btn">
            {copied ? "Copié ✅" : "Copier"}
          </button>
        </div>

        <div className="mt-4 duel-wait-info">
          <div className="duel-wait-item">
            <span>Statut</span>
            <strong>{game?.status ?? "Chargement..."}</strong>
          </div>

          <div className="duel-wait-item">
            <span>Joueur 2</span>
            <strong>{game?.player2Id ? "Connecté ✅" : "En attente…"}</strong>
          </div>

          {infoLine && (
            <div className="duel-wait-item" style={{ gridColumn: "1 / -1" }}>
              <span>Infos</span>
              <strong>{infoLine}</strong>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/duel")}
          className="btn-block"
          style={{ marginTop: "1rem" }}
        >
          Retour
        </button>
      </section>
    </motion.div>
  );
};

export default DuelWait;
