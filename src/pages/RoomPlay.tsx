import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

type Answer = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; text: string; answers: Answer[] };

type Room = {
  id: string;
  status: "WAITING" | "RUNNING" | "FINISHED" | string;
  chapterId?: string | null;
  Chapter?: { id: string; title: string } | null;
  host?: { id: string; username: string } | null;
};

const RoomPlay: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  // timer
  const startRef = useRef<number>(Date.now());
  const [time, setTime] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(Math.floor((Date.now() - startRef.current) / 1000));
    }, 300);
    return () => clearInterval(t);
  }, []);

  const current = useMemo(() => questions[idx], [questions, idx]);
  const total = questions.length;

  const loadQuestionsForRoom = async (rid: string) => {
    const res = await api.get(`/rooms/${rid}/questions`);
    const list: Question[] = Array.isArray(res.data) ? res.data : res.data?.questions ?? [];
    if (!list.length) throw new Error("Aucune question dans cette room");

    setQuestions(list);
    setIdx(0);
    setScore(0);
    startRef.current = Date.now();
    setTime(0);
  };

  // Charger room + attendre RUNNING
  useEffect(() => {
    if (!roomId) return;

    let alive = true;
    let intervalId: any = null;

    const fetchRoom = async () => {
      try {
        setErr("");
        const rRes = await api.get(`/rooms/${roomId}`);
        const r: Room = rRes.data;
        if (!alive) return;

        setRoom(r);

        if (r.status === "FINISHED") {
          navigate(`/room/result/${roomId}`, { replace: true });
          return;
        }

        if (r.status === "RUNNING") {
          if (intervalId) clearInterval(intervalId);

          if (questions.length === 0) {
            await loadQuestionsForRoom(roomId);
          }
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.msg || "Erreur chargement room");
      } finally {
        if (alive) setLoading(false);
      }
    };

    setLoading(true);
    fetchRoom();

    intervalId = setInterval(fetchRoom, 1200);

    return () => {
      alive = false;
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, navigate]);

  const finish = async (finalScore: number) => {
    if (!roomId) return;

    try {
      setSending(true);
      await api.post(`/rooms/${roomId}/submit`, { score: finalScore, time });
      navigate(`/room/result/${roomId}`);
    } catch (e: any) {
      setErr(e?.response?.data?.msg || "Impossible d’envoyer le résultat");
    } finally {
      setSending(false);
    }
  };

  const answerQuestion = (a: Answer) => {
    if (sending) return;

    const gained = a.isCorrect ? 1 : 0;

    setScore((prev) => {
      const newScore = prev + gained;

      if (idx < total - 1) {
        setIdx((v) => v + 1);
      } else {
        void finish(newScore);
      }

      return newScore;
    });
  };

  // UI states
  if (loading) {
    return (
      <div className="card">
        <h1>Multijoueur 👥</h1>
        <p className="mt-2" style={{ color: "#9ca3af" }}>Chargement…</p>
      </div>
    );
  }

  if (err && !room) {
    return (
      <div className="card">
        <h1>Multijoueur 👥</h1>
        <p className="mt-2 form-error">{err}</p>
        <button onClick={() => navigate("/multiplayer")} className="btn-block">
          Retour
        </button>
      </div>
    );
  }

  // Attente (pas RUNNING)
  if (room && room.status !== "RUNNING") {
    return (
      <div className="card">
        <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <h1>Room — {room?.Chapter?.title ?? "Quiz"}</h1>
            <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              En attente du démarrage par l’hôte…
            </p>
          </div>
          <span className="badge">{room.status}</span>
        </div>

        <button
          onClick={() => navigate(`/room/lobby/${roomId}`)}
          className="btn-block"
          style={{ marginTop: "1rem" }}
        >
          Retour Lobby
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="card">
        <h1>Room — {room?.Chapter?.title ?? "Quiz"}</h1>
        <p className="mt-2" style={{ color: "#9ca3af" }}>
          Aucune question à afficher.
        </p>
        <button onClick={() => navigate("/multiplayer")} className="btn-block">
          Retour
        </button>
      </div>
    );
  }

  const progress = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;

  return (
    <div className="card roomplay">
      {/* Header sticky (mobile-friendly) */}
      <div className="roomplay-topbar">
        <div className="roomplay-topbar-left">
          <div className="roomplay-title">
            {room?.Chapter?.title ?? "Quiz"}
          </div>
          <div className="roomplay-sub">
            Question <b>{idx + 1}</b> / {total} · {progress}%
          </div>
        </div>

        <div className="roomplay-stats">
          <span className="chip">
            <span className="chip-dot" />
            <span>{score}/{total}</span>
          </span>
          <span className="chip">
            <span className="chip-dot" />
            <span>{time}s</span>
          </span>
        </div>
      </div>

      {err && <p className="mt-2 form-error">{err}</p>}

      {/* Progress bar */}
      <div className="mt-4">
        <div className="roomplay-progress">
          <div className="roomplay-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="mt-4">
        <h2 style={{ fontSize: "1.1rem" }}>{current.text}</h2>
        <p className="mt-1" style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
          Choisis la bonne réponse.
        </p>

        <div className="mt-4 roomplay-answers">
          {current.answers?.map((a) => (
            <button
              key={a.id}
              onClick={() => answerQuestion(a)}
              disabled={sending}
              className="roomplay-answer"
            >
              {a.text}
            </button>
          ))}
        </div>

        <button
          onClick={() => finish(score)}
          disabled={sending}
          className="btn-block"
          style={{ marginTop: "1rem" }}
        >
          {sending ? "Envoi..." : "Terminer"}
        </button>

        <button
          onClick={() => navigate(`/room/lobby/${roomId}`)}
          className="btn-block"
          style={{ background: "#111827" }}
        >
          Retour Lobby
        </button>
      </div>
    </div>
  );
};

export default RoomPlay;
