import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

type Game = {
  id: string;
  status: "PENDING" | "RUNNING" | "FINISHED" | string;
  chapterId?: string | null;
  player1Id: string;
  player2Id?: string | null;
  createdAt?: string;

  // ✅ si ton backend renvoie ces infos (createGame / getGameById)
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

        // ✅ dès que RUNNING => on lance le jeu
        if (g.status === "RUNNING") {
          navigate(`/duel/play/${id}`);
        }

        // (Optionnel) si FINISHED on peut aller direct résultat
        // if (g.status === "FINISHED") navigate(`/duel/result/${id}`);
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

    // Affiche uniquement si au moins une info existe
    if (chapters === null && picked === null && requested === null && available === null) return null;

    const parts: string[] = [];
    if (chapters !== null) parts.push(`${chapters} chapitre(s)`);
    if (picked !== null && requested !== null) parts.push(`${picked}/${requested} questions`);
    else if (requested !== null) parts.push(`${requested} questions`);
    if (available !== null) parts.push(`${available} dispo`);

    return parts.join(" • ");
  }, [game]);

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h2>En attente du 2ᵉ joueur… ⏳</h2>

      {err && <p style={{ color: "#ff6b6b" }}>{err}</p>}

      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <p style={{ opacity: 0.9 }}>Partage cet ID à ton ami pour qu’il rejoigne le duel :</p>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <code
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)",
              userSelect: "all",
            }}
          >
            {shareId}
          </code>

          <button onClick={copyId} style={{ padding: "10px 14px" }}>
            {copied ? "Copié ✅" : "Copier"}
          </button>
        </div>

        <div style={{ marginTop: 14, opacity: 0.85 }}>
          <div>
            <b>Statut :</b> {game?.status ?? "Chargement..."}
          </div>
          <div>
            <b>Joueur 2 :</b> {game?.player2Id ? "Connecté ✅" : "En attente…"}
          </div>

          {/* ✅ Multi-chapitres / questions */}
          {infoLine && <div style={{ marginTop: 8, opacity: 0.85 }}>{infoLine}</div>}
        </div>

        <button
          onClick={() => navigate("/duel")}
          style={{ marginTop: 16, padding: 12, width: "100%" }}
        >
          Retour
        </button>
      </div>
    </div>
  );
};

export default DuelWait;
