import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

type Player = {
  id: string;
  userId: string;
  joinedAt?: string;
  submittedAt?: string | null;
  score?: number | null;
  time?: number | null;
  user?: { id: string; username: string };
};

type Room = {
  id: string;
  status: "WAITING" | "RUNNING" | "FINISHED" | string;
  joinCode: string;
  questionCount?: number;
  Chapter?: { id: string; title: string } | null;
  host?: { id: string; username: string } | null;
  players: Player[];
};

const RoomResult: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // polling room
  useEffect(() => {
    if (!roomId) return;

    let alive = true;

    const fetchRoom = async () => {
      try {
        setErr("");
        const res = await api.get(`/rooms/${roomId}`);
        if (!alive) return;
        setRoom(res.data);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.msg || "Impossible de charger les résultats");
      } finally {
        if (alive) setLoading(false);
      }
    };

    setLoading(true);
    fetchRoom();
    const t = setInterval(fetchRoom, 1200);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [roomId]);

  const me = useMemo(() => {
    if (!room || !user?.id) return null;
    return room.players?.find((p) => p.userId === user.id) ?? null;
  }, [room, user?.id]);

  const allSubmitted = useMemo(() => {
    if (!room?.players?.length) return false;
    return room.players.every((p) => !!p.submittedAt);
  }, [room?.players]);

  const ranking = useMemo(() => {
    const list = room?.players ? [...room.players] : [];
    // score desc, time asc (temps plus petit = mieux)
    list.sort((a, b) => {
      const sa = a.score ?? -1;
      const sb = b.score ?? -1;
      if (sb !== sa) return sb - sa;

      const ta = a.time ?? Number.MAX_SAFE_INTEGER;
      const tb = b.time ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
    return list;
  }, [room?.players]);

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
        <h2>Résultat Multijoueur 👥</h2>
        <p>Chargement…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
        <h2>Résultat Multijoueur 👥</h2>
        <p style={{ color: "#ff6b6b" }}>{err}</p>
        <button onClick={() => navigate("/multijoueur")} style={{ marginTop: 12, padding: 12 }}>
          Retour multijoueur
        </button>
      </div>
    );
  }

  if (!room) return null;

  const isFinished = room.status === "FINISHED";

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h2>Résultat Multijoueur 👥</h2>

      <div style={{ opacity: 0.9, marginTop: 8 }}>
        <div>
          <b>Room :</b> {room.joinCode}
        </div>
        <div>
          <b>Chapitre :</b> {room.Chapter?.title ?? "—"}
        </div>
        <div>
          <b>Statut :</b> {room.status}
        </div>
        <div>
          <b>Host :</b> {room.host?.username ?? "—"}
        </div>
      </div>

      {!isFinished && (
        <div
          style={{
            marginTop: 14,
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 14,
            padding: 16,
            background: "rgba(255,255,255,.03)",
          }}
        >
          <h3>En attente…</h3>
          <p style={{ opacity: 0.8, marginTop: 8 }}>
            {allSubmitted
              ? "Tout le monde a soumis. Finalisation…"
              : "Tous les joueurs n'ont pas encore terminé. Les résultats se mettront à jour automatiquement."}
          </p>

          {!me?.submittedAt && (
            <button
              onClick={() => navigate(`/room/play/${room.id}`)}
              style={{ marginTop: 12, padding: 12 }}
            >
              Revenir au jeu
            </button>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h3>Classement</h3>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {ranking.map((p, i) => {
            const uname = p.user?.username ?? p.userId;
            const isMe = user?.id === p.userId;

            const scoreTxt = p.score === null || p.score === undefined ? "—" : String(p.score);
            const timeTxt = p.time === null || p.time === undefined ? "—" : `${p.time}s`;
            const statusTxt = p.submittedAt ? "✅ Terminé" : "⏳ En cours";

            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 12,
                  padding: 12,
                  background: isMe ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <b>
                    #{i + 1} {uname} {isMe ? "(toi)" : ""}
                  </b>
                  <div style={{ opacity: 0.75, marginTop: 4 }}>{statusTxt}</div>
                </div>

                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>Score</div>
                    <div style={{ fontWeight: 700 }}>{scoreTxt}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>Temps</div>
                    <div style={{ fontWeight: 700 }}>{timeTxt}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, opacity: 0.75 }}>
          (Mise à jour automatique toutes les 1.2s)
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/multijoueur")} style={{ padding: 12 }}>
            Retour multijoueur
          </button>

          <button onClick={() => navigate(`/room/lobby/${room.id}`)} style={{ padding: 12 }}>
            Retour lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomResult;
