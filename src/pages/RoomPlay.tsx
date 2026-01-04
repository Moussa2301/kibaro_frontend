import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

type Answer = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; text: string; answers: Answer[] };

type Room = {
  id: string;
  status: "WAITING" | "RUNNING" | "FINISHED" | string;
  chapterId?: string | null;
  Chapter?: { id: string; title: string } | null; // ton prisma model a "Chapter"
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

  // 1) Charger room + attendre RUNNING
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

        // si terminé → résultats direct
        if (r.status === "FINISHED") {
          navigate(`/room/result/${roomId}`, { replace: true });
          return;
        }

        // si RUNNING → charger les questions UNE fois
        if (r.status === "RUNNING") {
          // stop polling
          if (intervalId) clearInterval(intervalId);

          // si déjà chargé, ne recharge pas
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

    // poll tant que pas RUNNING
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

    // score final “fiable” même sur la dernière question
    setScore((prev) => {
      const newScore = prev + gained;

      if (idx < total - 1) {
        setIdx((v) => v + 1);
      } else {
        // dernière question → finish avec newScore
        void finish(newScore);
      }

      return newScore;
    });
  };

  // UI states
  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Multijoueur 👥</h2>
        <p>Chargement…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Multijoueur 👥</h2>
        <p style={{ color: "#ff6b6b" }}>{err}</p>
        <button onClick={() => navigate("/multijoueur")} style={{ padding: 12 }}>
          Retour
        </button>
      </div>
    );
  }

  // Si room pas RUNNING, on affiche attente
  if (room && room.status !== "RUNNING") {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Room — {room?.Chapter?.title ?? "Quiz"}</h2>
        <p style={{ opacity: 0.85, marginTop: 8 }}>
          Statut : <b>{room.status}</b>
        </p>
        <p style={{ marginTop: 10, opacity: 0.8 }}>
          En attente du démarrage par l’hôte…
        </p>
        <button onClick={() => navigate(`/room/lobby/${roomId}`)} style={{ marginTop: 12, padding: 12 }}>
          Retour Lobby
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <h2>Room — {room?.Chapter?.title ?? "Quiz"}</h2>
        <p>Aucune question à afficher.</p>
        <button onClick={() => navigate("/multijoueur")} style={{ padding: 12 }}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h2>Room — {room?.Chapter?.title ?? "Quiz"}</h2>

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
          <div style={{ opacity: 0.8 }}>Statut: {room?.status}</div>
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

export default RoomPlay;
