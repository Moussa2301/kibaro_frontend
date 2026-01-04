import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

type Chapter = { id: string; title: string };

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const DuelHome: React.FC = () => {
  const navigate = useNavigate();

  const [chapters, setChapters] = useState<Chapter[]>([]);

  // ✅ multi-chapitres
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // ✅ slider 5 → 30
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

        // ✅ sélection par défaut = 1er chapitre
        if (list?.[0]?.id) setSelectedIds([list[0].id]);
        else setSelectedIds([]);
      } catch (e: any) {
        console.error("Erreur chargement chapitres:", e?.response?.status, e?.response?.data);
        setErr("Impossible de charger les chapitres");
      } finally {
        setLoadingChapters(false);
      }
    })();
  }, []);

  const toggleChapter = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createDuel = async () => {
    setErr("");

    if (!selectedIds.length) return setErr("Choisis au moins un chapitre");

    try {
      setLoadingAction(true);

      // ✅ transition douce: on envoie chapterIds + questionCount
      // (et on garde chapterId = premier pour rétro-compat si ton backend l'utilise encore)
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
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h2>Mode Duel ⚔️</h2>

      {err && <p style={{ color: "#ff6b6b" }}>{err}</p>}

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid rgba(255,255,255,.15)", padding: 16, borderRadius: 12 }}>
          <h3>Créer un duel</h3>

          <label>Chapitres (multi-sélection)</label>

          {loadingChapters ? (
            <p style={{ opacity: 0.8, marginTop: 8 }}>Chargement des chapitres...</p>
          ) : !hasChapters ? (
            <p style={{ opacity: 0.8, marginTop: 8 }}>Aucun chapitre disponible.</p>
          ) : (
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {chapters.map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.12)",
                      background: checked ? "rgba(255,255,255,.06)" : "transparent",
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

          <div style={{ marginTop: 14 }}>
            <label>
              Nombre de questions : <b>{questionCount}</b>
            </label>
            <input
              type="range"
              min={5}
              max={30}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              style={{ width: "100%", marginTop: 8 }}
            />
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              (5 → 30, questions tirées aléatoirement parmi les chapitres choisis)
            </div>
          </div>

          <button
            onClick={createDuel}
            disabled={loadingAction || loadingChapters || !hasChapters}
            style={{ marginTop: 12, padding: 12, width: "100%" }}
          >
            {loadingAction ? "Création..." : "Créer"}
          </button>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,.15)", padding: 16, borderRadius: 12 }}>
          <h3>Rejoindre un duel</h3>

          <label>ID du duel</label>
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="ex: 2d8f...-...."
            style={{ width: "100%", padding: 10, marginTop: 8 }}
          />

          <button
            onClick={joinDuel}
            disabled={loadingAction}
            style={{ marginTop: 12, padding: 12, width: "100%" }}
          >
            {loadingAction ? "Connexion..." : "Rejoindre"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuelHome;
