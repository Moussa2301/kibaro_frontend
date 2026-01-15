import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";

type Chapter = { id: string; title: string };

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const DuelHome: React.FC = () => {
  const navigate = useNavigate();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [joinId, setJoinId] = useState("");

  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [err, setErr] = useState("");

  const hasChapters = useMemo(() => chapters.length > 0, [chapters]);

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
        if (list?.[0]?.id) setSelectedIds([list[0].id]);
        else setSelectedIds([]);
      } catch (e: any) {
        console.error(
          "Erreur chargement chapitres:",
          e?.response?.status,
          e?.response?.data
        );
        setErr("Impossible de charger les chapitres");
      } finally {
        setLoadingChapters(false);
      }
    })();
  }, []);

  const toggleChapter = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createDuel = async () => {
    setErr("");
    if (!selectedIds.length) return setErr("Choisis au moins un chapitre");

    try {
      setLoadingAction(true);

      const payload = {
        chapterIds: selectedIds,
        chapterId: selectedIds[0],
        questionCount: clamp(questionCount, 5, 30),
      };

      const res = await api.post("/games", payload);
      const game = res.data;

      if (!game?.id) return setErr("Réponse serveur invalide (id manquant)");
      navigate(`/duel/wait/${game.id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.msg || "Erreur création duel");
    } finally {
      setLoadingAction(false);
    }
  };

  const joinDuel = async () => {
    setErr("");
    const id = joinId.trim();
    if (!id) return setErr("Entre l'ID du duel");

    try {
      setLoadingAction(true);
      await api.post(`/games/${id}/join`);
      navigate(`/duel/play/${id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.msg || "Impossible de rejoindre");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-between" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1>Mode Duel ⚔️</h1>
          <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Crée un duel (multi-chapitres) ou rejoins un duel existant.
          </p>
        </div>
        <span className="badge">Duel</span>
      </div>

      {err && <p className="mt-2 form-error">{err}</p>}

      <div className="mt-4 duel-grid">
        {/* Créer */}
        <section className="card">
          <h2>Créer un duel</h2>

          <label className="mt-2">Chapitres (multi-sélection)</label>

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
                const checked = selectedIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`duel-chapter-item ${
                      checked ? "is-checked" : ""
                    }`}
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

          <div className="mt-4">
            <label>
              Nombre de questions : <b>{questionCount}</b>
            </label>
            <input
              type="range"
              min={5}
              max={30}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="range"
            />
            <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
              (5 → 30, questions tirées aléatoirement parmi les chapitres choisis)
            </p>
          </div>

          <button
            onClick={createDuel}
            disabled={loadingAction || loadingChapters || !hasChapters}
            className="btn-block"
          >
            {loadingAction ? "Création..." : "Créer"}
          </button>
        </section>

        {/* Rejoindre */}
        <section className="card">
          <h2>Rejoindre un duel</h2>

          <label className="mt-2">ID du duel</label>
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="ex: 2d8f...-...."
          />

          <button
            onClick={joinDuel}
            disabled={loadingAction}
            className="btn-block"
          >
            {loadingAction ? "Connexion..." : "Rejoindre"}
          </button>
        </section>
      </div>
    </motion.div>
  );
};

export default DuelHome;
