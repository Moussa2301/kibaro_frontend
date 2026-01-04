import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

type Answer = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; text: string; answers: Answer[] };

type Game = {
  id: string;
  status: "PENDING" | "RUNNING" | "FINISHED" | string;
  chapterId: string;
  chapter?: { id: string; title: string } | null;
  questionCount?: number | null;
};

const DuelPlay: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // /duel/play/:id
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const startRef = useRef<number>(Date.now());
  const [time, setTime] = useState(0);

  // timer
  useEffect(() => {
    const t = setInterval(() => {
      setTime(Math.floor((Date.now() - startRef.current) / 1000));
    }, 300);
    return () => clearInterval(t);
  }, []);

  const total = questions.length;
  const current = useMemo(() => questions[idx], [questions, idx]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        // 1) Game
        const gameRes = await api.get(`/games/${id}`);
        const g: Game = gameRes.data;

        setGame(g);

        if (g.status !== "RUNNING") {
          setErr(g.status === "PENDING" ? "En attente de l'autre joueur..." : "Le duel n'a pas encore démarré.");
          return;
        }

        // 2) Questions figées côté serveur (multi-chapitres random)
        const qRes = await api.get(`/games/${id}/questions`);
        const list: Question[] = Array.isArray(qRes.data)
          ? qRes.data
          : qRes.data?.questions ?? [];

        if (!list.length) {
          setErr("Aucune question disponible pour ce duel");
          return;
        }

        setQuestions(list);
        setIdx(0);
        setScore(0);
        startRef.current = Date.now();
        setTime(0);
      } catch (e: any) {
        setErr(e?.response?.data?.msg || "Erreur chargement duel");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const finish = async (finalScore: number) => {
    if (!id) return;
    try {
      setSending(true);
      await api.post(`/games/${id}/submit`, { score: finalScore, time });
      navigate(`/duel/result/${id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.msg || "Impossible d’envoyer le résultat");
    } finally {
      setSending(false);
    }
  };

  const answerQuestion = (a: Answer) => {
    if (sending) return;

    setScore((prev) => {
      const nextScore = a.isCorrect ? prev + 1 : prev;

      // avance à la question suivante, ou termine
      if (idx < total - 1) {
        setIdx((v) => v + 1);
      } else {
        finish(nextScore);
      }

      return nextScore;
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Duel ⚔️</h2>
        <p>Chargement…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Duel ⚔️</h2>
        <p style={{ color: "#ff6b6b" }}>{err}</p>
        <button onClick={() => navigate("/duel")} style={{ padding: 12 }}>
          Retour
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Duel ⚔️</h2>
        <p>Aucune question à afficher.</p>
        <button onClick={() => navigate("/duel")} style={{ padding: 12 }}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h2>Duel — {game?.chapter?.title ?? "Quiz"}</h2>

      <div style={{ opacity: 0.9, marginTop: 8 }}>
        <b>Score :</b> {score} / {total} &nbsp; | &nbsp; <b>Temps :</b> {time}s
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <b>Question</b> {idx + 1} / {total}
          </div>
          <div style={{ opacity: 0.8 }}>Statut: {game?.status}</div>
        </div>

        <h3 style={{ marginTop: 12 }}>{current.text}</h3>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {current.answers?.map((a) => (
            <button
              key={a.id}
              onClick={() => answerQuestion(a)}
              disabled={sending}
              style={{ textAlign: "left", padding: 12, borderRadius: 12 }}
            >
              {a.text}
            </button>
          ))}
        </div>

        <button
          onClick={() => finish(score)}
          disabled={sending}
          style={{ marginTop: 16, padding: 12, width: "100%" }}
        >
          {sending ? "Envoi..." : "Terminer"}
        </button>
      </div>
    </div>
  );
};

export default DuelPlay;
