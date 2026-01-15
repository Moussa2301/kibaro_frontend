import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1>Lobby 👥</h1>
        <p className="mt-2" style={{ color: "#9ca3af" }}>
          Chargement…
        </p>
      </motion.div>
    );
  }

  if (err && !room) {
    return (
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1>Lobby 👥</h1>
        <p className="mt-2 form-error">{err}</p>
        <button onClick={() => navigate("/multiplayer")} className="btn-block">
          Retour
        </button>
      </motion.div>
    );
  }

  if (!room) return null;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1>Lobby 👥</h1>
          <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Invite tes amis avec le lien, puis attends le démarrage.
          </p>
        </div>
        <span className="badge">{room.status}</span>
      </div>

      {err && <p className="mt-2 form-error">{err}</p>}

      {/* Infos */}
      <section className="card mt-4">
        <h2>Informations</h2>

        <div className="mt-2 lobby-info">
          <div className="lobby-info-item">
            <span>Chapitre</span>
            <strong>{room.chapter?.title ?? "—"}</strong>
          </div>
          <div className="lobby-info-item">
            <span>Statut</span>
            <strong>{room.status}</strong>
          </div>
          <div className="lobby-info-item">
            <span>Host</span>
            <strong>{room.host?.username ?? "—"}</strong>
          </div>
        </div>
      </section>

      {/* Invitation */}
      <section className="card mt-4">
        <h2>Inviter des joueurs</h2>

        <label className="mt-2">Lien de partage</label>
        <div className="lobby-share">
          <input
            value={shareUrl}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
          <button type="button" onClick={copyLink}>
            Copier
          </button>
        </div>

        <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
          JoinCode : <strong>{room.joinCode}</strong>
        </p>
      </section>

      {/* Joueurs */}
      <section className="card mt-4">
        <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <h2>Joueurs ({room.players?.length ?? 0})</h2>
          <span className="chip">
            <span className="chip-dot" />
            <span>Auto-refresh 1.5s</span>
          </span>
        </div>

        <div className="mt-2 lobby-players">
          {room.players?.map((p) => (
            <div key={p.id} className="lobby-player">
              <span className="lobby-player-name">
                {p.user?.username ?? p.userId}
              </span>

              <div className="lobby-tags">
                {p.user?.id === room.host?.id && (
                  <span className="lobby-host-badge">Host</span>
                )}
                {p.user?.id === user?.id && (
                  <span className="lobby-me-badge">Moi</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/multiplayer")}
          className="btn-block"
          style={{ marginTop: "1rem" }}
        >
          Retour multijoueur
        </button>

        {isHost ? (
          <button onClick={start} className="btn-block">
            🚀 Démarrer la partie
          </button>
        ) : (
          <div className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            En attente que l’hôte démarre la partie…
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default RoomLobby;
