import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

type Room = { id: string; joinCode: string };

const RoomJoin: React.FC = () => {
  const { joinCode } = useParams<{ joinCode: string }>();
  const navigate = useNavigate();

  const [err, setErr] = useState("");

  useEffect(() => {
    if (!joinCode) return;

    (async () => {
      try {
        setErr("");
        // POST /api/rooms/join/:joinCode
        const res = await api.post(`/rooms/join/${joinCode}`);
        const room: Room = res.data;

        if (!room?.id) {
          setErr("Réponse serveur invalide (room.id manquant)");
          return;
        }

        navigate(`/room/lobby/${room.id}`);
      } catch (e: any) {
        setErr(e?.response?.data?.msg || "Impossible de rejoindre la room");
      }
    })();
  }, [joinCode, navigate]);

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h2>Multijoueur 👥</h2>
      {!err ? <p>Connexion à la room…</p> : <p style={{ color: "#ff6b6b" }}>{err}</p>}

      <button onClick={() => navigate("/multijoueur")} style={{ marginTop: 12, padding: 12 }}>
        Retour
      </button>
    </div>
  );
};

export default RoomJoin;
