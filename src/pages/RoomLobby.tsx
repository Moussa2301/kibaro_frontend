import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

type Player = {
  id: string;
  userId: string;
  user?: { id: string; username: string };
};

type Room = {
  id: string;
  joinCode: string;
  status: string;
  chapter?: { id: string; title: string };
  host?: { id: string; username: string };
  players: Player[];
};

const RoomLobby: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const shareUrl = useMemo(() => {
    if (!room?.joinCode) return "";
    return `${window.location.origin}/room/${room.joinCode}`;
  }, [room?.joinCode]);

  const isHost = useMemo(() => {
    return !!room?.host?.id && !!user?.id && room.host.id === user.id;
  }, [room?.host?.id, user?.id]);

  const start = async () => {
    if (!room?.id) return;

    // ✅ sécurité côté front: seul l'hôte peut démarrer
    if (!isHost) {
      setErr("Seul l'hôte peut démarrer la partie.");
      return;
    }

    try {
      setErr("");
      await api.post(`/rooms/${room.id}/start`);
      navigate(`/room/play/${room.id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.msg || "Impossible de démarrer");
    }
  };

  // ✅ polling toutes les 1500ms + redirection auto si RUNNING
  useEffect(() => {
    if (!roomId) return;

    let alive = true;

    const fetchRoom = async () => {
      try {
        setErr("");
        const res = await api.get(`/rooms/${roomId}`);
        if (!alive) return;

        const data: Room = res.data;
        setRoom(data);

        // ✅ IMPORTANT: si l'hôte a démarré, l'invité bascule automatiquement
        if (data?.status === "RUNNING") {
          navigate(`/room/play/${data.id}`);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.msg || "Impossible de charger le lobby");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchRoom();
    const t = setInterval(fetchRoom, 1500);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [roomId, navigate]);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ok
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
        <h2>Lobby 👥</h2>
        <p>Chargement…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
        <h2>Lobby 👥</h2>
        <p style={{ color: "#ff6b6b" }}>{err}</p>
        <button
          onClick={() => navigate("/multiplayer")}
          style={{ marginTop: 12, padding: 12 }}
        >
          Retour
        </button>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h2>Lobby 👥</h2>

      <div style={{ opacity: 0.9, marginTop: 8 }}>
        <div>
          <b>Chapitre :</b> {room.chapter?.title ?? "—"}
        </div>
        <div>
          <b>Statut :</b> {room.status}
        </div>
        <div>
          <b>Host :</b> {room.host?.username ?? "—"}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h3>Inviter des joueurs</h3>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            value={shareUrl}
            readOnly
            style={{ flex: 1, padding: 10 }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button onClick={copyLink} style={{ padding: "10px 12px" }}>
            Copier
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.8 }}>
          JoinCode : <b>{room.joinCode}</b>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h3>Joueurs ({room.players?.length ?? 0})</h3>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {room.players?.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 12,
                padding: 12,
                background: "rgba(255,255,255,.03)",
              }}
            >
              {p.user?.username ?? p.userId}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, opacity: 0.75 }}>
          (Mise à jour automatique toutes les 1.5s)
        </div>

        <button
          onClick={() => navigate("/multiplayer")}
          style={{ marginTop: 16, padding: 12 }}
        >
          Retour multijoueur
        </button>

        {/* ✅ Seul l'hôte peut démarrer */}
        {isHost ? (
          <button
            onClick={start}
            style={{ marginTop: 14, padding: 12, width: "100%" }}
          >
            Démarrer la partie
          </button>
        ) : (
          <div style={{ marginTop: 14, opacity: 0.85 }}>
            En attente que l’hôte démarre la partie…
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
