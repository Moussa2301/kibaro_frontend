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

  host?: { id: string; username: string } | null;
  players?: { user: { id: string; username: string } }[];

  Chapter?: { id: string; title: string } | null;
  chapterId?: string | null;

  questionsAvailable?: number;
  questionsPicked?: number;
  requestedQuestions?: number;
  chaptersSelected?: number;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

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
    () =>
      hasChapters &&
      selectedChapterIds.length > 0 &&
      !loadingChapters &&
      !loadingCreate,
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
        const list: Chapter[] = Array.isArray(res.data)
          ? res.data
          : res.data?.chapters ?? [];

        setChapters(list);
        if (list?.[0]?.id) setSelectedChapterIds([list[0].id]);
      } catch (e: any) {
        setErr("Impossible de charger les chapitres");
      } finally {
        setLoadingChapters(false);
      }
    })();
  }, []);

  const toggleChapter = (id: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

    const requested = clamp(Number(questionCount), 5, 30);

    try {
      setLoadingCreate(true);

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
      // ignore
    }
  };

  return (
    <div className="card">
      <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1>Multijoueur 👥</h1>
          <p className="mt-2" style={{ opacity: 0.85, color: "#9ca3af" }}>
            Choisis un ou plusieurs chapitres, puis partage le lien (ou QR Code).
            Le jeu sélectionne des questions aléatoires (jusqu’à 30).
          </p>
        </div>
        <span className="badge">Room</span>
      </div>

      {err && <p className="mt-2 form-error">{err}</p>}

      {/* Création */}
      <section className="card mt-4">
        <h2>Créer une room</h2>

        {/* Slider */}
        <div className="mt-2">
          <label>
            Nombre de questions : <strong>{questionCount}</strong>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="range"
          />
          <div className="mp-range-labels">
            <span>5</span>
            <span>30</span>
          </div>
        </div>

        {/* Chapitres */}
        <div className="mt-4">
          <div className="mp-row">
            <label>Chapitres (multi-sélection)</label>

            <div className="mp-actions">
              <button
                type="button"
                onClick={selectAll}
                disabled={!hasChapters || loadingChapters}
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={!hasChapters || loadingChapters}
              >
                Tout retirer
              </button>
            </div>
          </div>

          {loadingChapters ? (
            <p className="mt-2" style={{ opacity: 0.85 }}>
              Chargement des chapitres...
            </p>
          ) : !hasChapters ? (
            <p className="mt-2" style={{ opacity: 0.85 }}>
              Aucun chapitre disponible.
            </p>
          ) : (
            <div className="mt-2 duel-chapter-list">
              {chapters.map((c) => {
                const checked = selectedChapterIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`duel-chapter-item ${checked ? "is-checked" : ""}`}
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

          <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Sélection : <strong>{selectedChapterIds.length}</strong> chapitre(s)
          </p>
        </div>

        <button onClick={createRoom} disabled={!canCreate} className="btn-block">
          {loadingCreate ? "Création..." : "Créer la room"}
        </button>
      </section>

      {/* Résultat création */}
      {room && (
        <section className="card mt-4">
          <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
            <h2>Room créée ✅</h2>
            <span className="badge">
              {room.status === "WAITING" ? "En attente" : room.status}
            </span>
          </div>

          <div className="mt-2" style={{ display: "grid", gap: "0.5rem" }}>
            <div>
              <strong>JoinCode :</strong> {room.joinCode}
            </div>

            <div>
              <strong>Questions :</strong>{" "}
              {typeof room.questionsPicked === "number" &&
              typeof room.questionsAvailable === "number" ? (
                <span>
                  {room.questionsPicked}/{room.requestedQuestions ?? "?"} (dispo:{" "}
                  {room.questionsAvailable})
                </span>
              ) : (
                <span>{questionCount} demandées</span>
              )}
            </div>

            <div className="mt-2">
              <strong>Chapitres choisis :</strong>
              <div className="mt-2 mp-chips">
                {selectedTitles.map((t) => (
                  <span key={t} className="mp-chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Lien */}
          <div className="mt-4">
            <label>Lien à partager</label>
            <div className="mp-share">
              <input
                value={shareUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
              <button type="button" onClick={copyLink}>
                Copier
              </button>
            </div>
          </div>

          {/* QR + actions */}
          <div className="mt-4 mp-qr-layout">
            <div className="mp-qr-box">
              <QRCodeCanvas value={shareUrl} size={180} />
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                Scanne le QR Code depuis un téléphone pour rejoindre la room.
              </p>

              <button
                type="button"
                onClick={() => navigate(`/room/lobby/${room.id}`)}
                className="btn-block"
              >
                Ouvrir le lobby
              </button>

              {room?.host?.id === user?.id && room.status === "WAITING" && (
                <button type="button" onClick={startRoom} className="btn-block">
                  🚀 Démarrer la partie
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Multiplayer;
