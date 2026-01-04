import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../context/AuthContext";

type Chapter = { id: string; title: string };

type Room = {
  id: string;
  joinCode: string;
  status: "WAITING" | "RUNNING" | "FINISHED" | string;

  // backend prisma include
  host?: { id: string; username: string } | null;
  players?: { user: { id: string; username: string } }[];

  // dans ton model tu as "Chapter" (majuscule)
  Chapter?: { id: string; title: string } | null;
  chapterId?: string | null;

  // champs “infos” renvoyés par createRoom (si tu gardes mon controller)
  questionsAvailable?: number;
  questionsPicked?: number;
  requestedQuestions?: number;
  chaptersSelected?: number;
};

const Multiplayer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const [room, setRoom] = useState<Room | null>(null);

  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [err, setErr] = useState("");

  const hasChapters = useMemo(() => chapters.length > 0, [chapters]);
  const canCreate = useMemo(
    () => hasChapters && selectedChapterIds.length > 0 && !loadingChapters && !loadingCreate,
    [hasChapters, selectedChapterIds.length, loadingChapters, loadingCreate]
  );

  const shareUrl = useMemo(() => {
    if (!room?.joinCode) return "";
    return `${window.location.origin}/room/${room.joinCode}`;
  }, [room?.joinCode]);

  const selectedTitles = useMemo(() => {
    const map = new Map(chapters.map((c) => [c.id, c.title]));
    return selectedChapterIds.map((id) => map.get(id) ?? id);
  }, [chapters, selectedChapterIds]);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoadingChapters(true);

        const res = await api.get("/chapters");
        const list: Chapter[] = Array.isArray(res.data) ? res.data : res.data?.chapters ?? [];

        setChapters(list);

        // ✅ par défaut : sélectionner 1er chapitre
        if (list?.[0]?.id) setSelectedChapterIds([list[0].id]);
      } catch (e: any) {
        setErr("Impossible de charger les chapitres");
      } finally {
        setLoadingChapters(false);
      }
    })();
  }, []);

  const toggleChapter = (id: string) => {
    setSelectedChapterIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const selectAll = () => setSelectedChapterIds(chapters.map((c) => c.id));
  const clearAll = () => setSelectedChapterIds([]);

  const createRoom = async () => {
    setErr("");
    setRoom(null);

    if (!selectedChapterIds.length) {
      setErr("Choisis au moins un chapitre");
      return;
    }

    // ✅ clamp 5 → 30
    const requested = Math.min(Math.max(Number(questionCount), 5), 30);

    try {
      setLoadingCreate(true);

      // ✅ transition douce : on envoie chapterIds + questionCount
      // + chapterId (compat)
      const payload = {
        chapterIds: selectedChapterIds,
        chapterId: selectedChapterIds[0], // rétrocompat
        questionCount: requested,
      };

      const res = await api.post("/rooms", payload);
      const created: Room = res.data;

      if (!created?.id || !created?.joinCode) {
        setErr("Réponse serveur invalide (id/joinCode manquant)");
        return;
      }

      setRoom(created);
    } catch (e: any) {
      setErr(e?.response?.data?.msg || "Erreur lors de la création de la room");
    } finally {
      setLoadingCreate(false);
    }
  };

  const startRoom = async () => {
    if (!room?.id) return;
    try {
      await api.post(`/rooms/${room.id}/start`);
      // ✅ on peut envoyer l’hôte sur play direct
      navigate(`/room/play/${room.id}`);
    } catch (e: any) {
      alert(e?.response?.data?.msg || "Impossible de lancer la partie");
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ok
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h2>Multijoueur 👥</h2>
      <p style={{ opacity: 0.85, marginTop: 6 }}>
        Choisis un ou plusieurs chapitres, le jeu sélectionne des questions aléatoires (jusqu’à 30).
      </p>

      {err && <p style={{ color: "#ff6b6b", marginTop: 10 }}>{err}</p>}

      {/* Création */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <h3>Créer une room</h3>

        {/* Slider questionCount */}
        <div style={{ marginTop: 12 }}>
          <label>Nombre de questions : </label>
          <b style={{ marginLeft: 8 }}>{questionCount}</b>
          <input
            type="range"
            min={5}
            max={30}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            style={{ width: "100%", marginTop: 10 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.75, fontSize: 12 }}>
            <span>5</span>
            <span>30</span>
          </div>
        </div>

        {/* Chapitres multi-select */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <label>Chapitres (multi-sélection)</label>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={selectAll} disabled={!hasChapters || loadingChapters}>
                Tout sélectionner
              </button>
              <button type="button" onClick={clearAll} disabled={!hasChapters || loadingChapters}>
                Tout retirer
              </button>
            </div>
          </div>

          {loadingChapters ? (
            <p style={{ opacity: 0.8, marginTop: 8 }}>Chargement des chapitres...</p>
          ) : !hasChapters ? (
            <p style={{ opacity: 0.8, marginTop: 8 }}>Aucun chapitre disponible.</p>
          ) : (
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {chapters.map((c) => {
                const checked = selectedChapterIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,.12)",
                      background: checked ? "rgba(34,197,94,.10)" : "rgba(255,255,255,.03)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChapter(c.id)}
                    />
                    <span>{c.title}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            Sélection : <b>{selectedChapterIds.length}</b> chapitre(s)
          </div>
        </div>

        <button
          onClick={createRoom}
          disabled={!canCreate}
          style={{ marginTop: 14, padding: 12, width: "100%" }}
        >
          {loadingCreate ? "Création..." : "Créer la room"}
        </button>
      </div>

      {/* Résultat création */}
      {room && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 14,
            padding: 16,
            display: "grid",
            gap: 14,
          }}
        >
          <h3>Room créée ✅</h3>

          <div style={{ opacity: 0.9, display: "grid", gap: 6 }}>
            <div>
              <b>JoinCode :</b> {room.joinCode}
            </div>
            <div>
              <b>Statut :</b> {room.status}
            </div>

            <div>
              <b>Chapitres choisis :</b>
              <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                {selectedTitles.map((t) => (
                  <div
                    key={t}
                    style={{
                      padding: 8,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.12)",
                      background: "rgba(255,255,255,.03)",
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 6 }}>
              <b>Questions :</b>{" "}
              {typeof room.questionsPicked === "number" && typeof room.questionsAvailable === "number" ? (
                <span>
                  {room.questionsPicked}/{room.requestedQuestions ?? "?"} (dispo: {room.questionsAvailable})
                </span>
              ) : (
                <span>{questionCount} demandées</span>
              )}
            </div>
          </div>

          <div>
            <label>Lien à partager</label>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
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
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 12,
                padding: 12,
                background: "rgba(255,255,255,.03)",
              }}
            >
              <QRCodeCanvas value={shareUrl} size={180} />
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 260 }}>
              <div style={{ opacity: 0.85 }}>
                Scanne ce QR Code (téléphone) → ça rejoint automatiquement la room.
              </div>

              <button
                onClick={() => navigate(`/room/lobby/${room.id}`)}
                style={{ padding: 12 }}
              >
                Ouvrir le lobby
              </button>

              {room?.host?.id === user?.id && room.status === "WAITING" && (
                <button
                  onClick={startRoom}
                  style={{ padding: 14, width: "100%" }}
                >
                  🚀 Démarrer la partie
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Multiplayer;
