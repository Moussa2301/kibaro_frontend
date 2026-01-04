import React, { useEffect, useState } from "react";
import api from "../api/axios";

type Chapter = {
  id: string;
  title: string;
  period: string;
  order: number;
};

type LeaderboardUser = {
  id: string;
  username: string;
  points: number;
  level: number;
};


type Answer = {
  id?: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  text: string;
  answers: Answer[];
};

type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
};
type AdminDashboard = {
  users: { total: number; newLast7d: number; activeLast7d: number };
  activityLast7d: { quizPlays: number; duels: number; rooms: number };
  leaderboard: { id: string; username: string; points: number; level: number; createdAt: string }[];
  frequency: { quizPlaysPerDay: Record<string, number> };
  recentUsers?: { id: string; username: string; email: string; createdAt: string; points: number; level: number }[];
};


const Admin: React.FC = () => {
  // Chapter form
  const [activeTab, setActiveTab] = useState<"dashboard" | "content">("dashboard");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [period, setPeriod] = useState("");
  const [order, setOrder] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);


  // Question form
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [questionText, setQuestionText] = useState("");
  const [answers, setAnswers] = useState<Answer[]>(
    Array.from({ length: 4 }, () => ({ text: "", isCorrect: false }))
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Badges
  const [badges, setBadges] = useState<Badge[]>([]);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [badgeTitle, setBadgeTitle] = useState("");
  const [badgeDescription, setBadgeDescription] = useState("");
  const [badgeIcon, setBadgeIcon] = useState("🏅");
  const [badgeCondition, setBadgeCondition] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadChapters = async () => {
    try {
      setLoadingChapters(true);
      const res = await api.get("/chapters");
      setChapters(res.data);
      if (res.data.length > 0 && !selectedChapterId) {
        setSelectedChapterId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChapters(false);
    }
  };

  const loadQuestions = async (chapterId: string) => {
    if (!chapterId) return;
    try {
      setLoadingQuestions(true);
      const res = await api.get(`/questions/by-chapter/${chapterId}`);
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadBadges = async () => {
    try {
      const res = await api.get("/badges");
      setBadges(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadChapters();
    loadBadges();
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedChapterId) {
      loadQuestions(selectedChapterId);
      // reset form when on change chapter
      setEditingQuestionId(null);
      setQuestionText("");
      setAnswers(
        Array.from({ length: 4 }, () => ({ text: "", isCorrect: false }))
      );
    }
  }, [selectedChapterId]);

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await api.post("/chapters", {
        title,
        content,
        period,
        order: Number(order),
      });
      setMessage("Chapitre créé avec succès.");
      setTitle("");
      setContent("");
      setPeriod("");
      setOrder(0);
      await loadChapters();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Erreur lors de la création du chapitre");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (index: number, field: "text" | "isCorrect", value: any) => {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, [field]: field === "isCorrect" ? value : value } : a
      )
    );
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionText("");
    setAnswers(
      Array.from({ length: 4 }, () => ({ text: "", isCorrect: false }))
    );
  };
  const loadDashboard = async () => {
  try {
    setLoadingDashboard(true);
    const res = await api.get("/admin/dashboard");
    setDashboard(res.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingDashboard(false);
  }
};


  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!selectedChapterId) {
      setError("Veuillez sélectionner un chapitre");
      return;
    }
    if (!questionText.trim()) {
      setError("Le texte de la question est obligatoire");
      return;
    }
    const validAnswers = answers.filter((a) => a.text.trim() !== "");
    if (validAnswers.length === 0) {
      setError("Ajoutez au moins une réponse");
      return;
    }
    if (!validAnswers.some((a) => a.isCorrect)) {
      setError("Marquez au moins une réponse comme correcte");
      return;
    }

    setSubmitting(true);
    try {
      if (editingQuestionId) {
        await api.put(`/questions/${editingQuestionId}`, {
          text: questionText,
          answers: validAnswers,
        });
        setMessage("Question mise à jour avec succès.");
      } else {
        await api.post("/questions", {
          chapterId: selectedChapterId,
          text: questionText,
          answers: validAnswers,
        });
        setMessage("Question créée avec succès.");
      }
      resetQuestionForm();
      await loadQuestions(selectedChapterId);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.msg ||
          (editingQuestionId
            ? "Erreur lors de la mise à jour de la question"
            : "Erreur lors de la création de la question")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.text);
    const base = q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect }));
    while (base.length < 4) {
      base.push({ text: "", isCorrect: false });
    }
    setAnswers(base.slice(0, 4));
    setMessage(null);
    setError(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Supprimer cette question ?")) return;
    setError(null);
    setMessage(null);
    try {
      await api.delete(`/questions/${id}`);
      setMessage("Question supprimée.");
      if (selectedChapterId) {
        await loadQuestions(selectedChapterId);
      }
      if (editingQuestionId === id) {
        resetQuestionForm();
      }
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression de la question");
    }
  };

  // Badges handlers

  const resetBadgeForm = () => {
    setEditingBadgeId(null);
    setBadgeTitle("");
    setBadgeDescription("");
    setBadgeIcon("🏅");
    setBadgeCondition("");
  };

  const handleBadgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!badgeTitle.trim() || !badgeDescription.trim()) {
      setError("Le titre et la description du badge sont obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      if (editingBadgeId) {
        await api.put(`/badges/${editingBadgeId}`, {
          title: badgeTitle,
          description: badgeDescription,
          icon: badgeIcon,
          condition: badgeCondition,
        });
        setMessage("Badge mis à jour avec succès.");
      } else {
        await api.post("/badges", {
          title: badgeTitle,
          description: badgeDescription,
          icon: badgeIcon,
          condition: badgeCondition,
        });
        setMessage("Badge créé avec succès.");
      }
      resetBadgeForm();
      await loadBadges();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.msg ||
          (editingBadgeId
            ? "Erreur lors de la mise à jour du badge"
            : "Erreur lors de la création du badge")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBadge = (b: Badge) => {
    setEditingBadgeId(b.id);
    setBadgeTitle(b.title);
    setBadgeDescription(b.description);
    setBadgeIcon(b.icon || "🏅");
    setBadgeCondition(b.condition || "");
    setMessage(null);
    setError(null);
  };

  const handleDeleteBadge = async (id: string) => {
    if (!window.confirm("Supprimer ce badge ?")) return;
    setError(null);
    setMessage(null);
    try {
      await api.delete(`/badges/${id}`);
      setMessage("Badge supprimé.");
      await loadBadges();
      if (editingBadgeId === id) {
        resetBadgeForm();
      }
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la suppression du badge");
    }
  };
  const formatDayLabel = (iso: string) => {
  // iso = "2026-01-02"
  const d = new Date(iso + "T00:00:00");
  // ex: "02/01"
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};


  return (
  <div className="card">
    <h1>Admin – Gestion des contenus</h1>
    <p className="mt-2" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
      Crée, modifie et supprime les chapitres, questions et badges pour Kibaro History.
      Cette page est réservée aux administrateurs.
    </p>

    {/* Onglets */}
    <div className="mt-4 tabs">
      <button
        onClick={() => setActiveTab("dashboard")}
        className={activeTab === "dashboard" ? "tab-active" : "tab"}
        type="button"
      >
        📊 Dashboard
      </button>

      <button
        onClick={() => setActiveTab("content")}
        className={activeTab === "content" ? "tab-active" : "tab"}
        type="button"
      >
        📚 Contenus
      </button>
    </div>

    {/* DASHBOARD */}
    {activeTab === "dashboard" && (
      <section className="mt-4">
        <h2>📊 Tableau de bord</h2>

        {loadingDashboard ? (
          <p>Chargement...</p>
        ) : !dashboard ? (
          <p>Aucune donnée dashboard.</p>
        ) : (
          <>
            <div className="mt-3" style={{ display: "grid", gap: "1rem" }}>
  {/* Cartes stats */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "1rem",
    }}
  >
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        padding: "1rem",
        borderRadius: "0.75rem",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem" }}>👥 Utilisateurs</h3>
      <p>Total : <strong>{dashboard.users.total}</strong></p>
      <p>Nouveaux (7j) : <strong>{dashboard.users.newLast7d}</strong></p>
      <p>Actifs (7j) : <strong>{dashboard.users.activeLast7d}</strong></p>
    </div>

    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        padding: "1rem",
        borderRadius: "0.75rem",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem" }}>🎮 Activité (7j)</h3>
      <p>Quiz joués : <strong>{dashboard.activityLast7d.quizPlays}</strong></p>
      <p>Duels : <strong>{dashboard.activityLast7d.duels}</strong></p>
      <p>Salles multi : <strong>{dashboard.activityLast7d.rooms}</strong></p>
    </div>

   <div
  style={{
    background: "#020617",
    border: "1px solid #1f2937",
    padding: "1rem",
    borderRadius: "0.75rem",
  }}
>
  <h3 style={{ marginBottom: "0.5rem" }}>📈 Fréquence</h3>
  <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Quiz par jour (7 jours)</p>

  {Object.entries(dashboard.frequency?.quizPlaysPerDay || {}).length === 0 ? (
    <p className="mt-2" style={{ color: "#9ca3af" }}>Aucune donnée.</p>
  ) : (() => {
    const entries = Object.entries(dashboard.frequency.quizPlaysPerDay)
      .sort(([a], [b]) => a.localeCompare(b)); // tri par date

    const max = Math.max(...entries.map(([, v]) => v), 1);

    return (
      <div className="mt-3" style={{ display: "grid", gap: "0.6rem" }}>
        {entries.map(([day, count]) => {
          const pct = Math.round((count / max) * 100);

          return (
            <div key={day} style={{ display: "grid", gap: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "#cbd5e1" }}>{formatDayLabel(day)}</span>
                <strong style={{ color: "#e5e7eb" }}>{count}</strong>
              </div>

              <div
                style={{
                  height: "10px",
                  borderRadius: "999px",
                  background: "#0b1220",
                  border: "1px solid #1f2937",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: "linear-gradient(90deg, #22c55e, #0ea5e9)",
                    transition: "width 250ms ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  })()}
</div>
  </div>
  {/* Leaderboard */}
  <div
    style={{
      background: "#020617",
      border: "1px solid #1f2937",
      padding: "1rem",
      borderRadius: "0.75rem",
    }}
  >
    <div className="flex-between">
      <h3>🏆 Classement</h3>
      <button type="button" onClick={loadDashboard}>
        Rafraîchir
      </button>
    </div>

    {dashboard.leaderboard.length === 0 ? (
      <p className="mt-2" style={{ color: "#9ca3af" }}>Aucun score enregistré.</p>
    ) : (
      <div className="mt-2" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#9ca3af" }}>
              <th style={{ padding: "0.5rem 0" }}>#</th>
              <th>Utilisateur</th>
              <th>Points</th>
              <th>Niveau</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.leaderboard.map((u, i) => (
              <tr key={u.id} style={{ borderTop: "1px solid #1f2937" }}>
                <td style={{ padding: "0.6rem 0" }}>{i + 1}</td>
                <td>{u.username}</td>
                <td><strong>{u.points}</strong></td>
                <td>{u.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>

          </>
        )}
      </section>
    )}

    {/* CONTENUS */}
    {activeTab === "content" && (
      <div className="mt-4">
        {message && (
          <p className="mt-2" style={{ color: "#bbf7d0", fontSize: "0.85rem" }}>
            {message}
          </p>
        )}
        {error && <p className="mt-2 form-error">{error}</p>}

        <div className="mt-4" style={{ display: "grid", gap: "1.5rem" }}>
          {/* ---------------- CHAPITRES ---------------- */}
          <section>
            <h2>Créer un chapitre</h2>
            <form className="mt-2" onSubmit={handleCreateChapter}>
              <div className="mt-2">
                <label>Titre</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="mt-2">
                <label>Période</label>
                <input value={period} onChange={(e) => setPeriod(e.target.value)} required />
              </div>

              <div className="mt-2">
                <label>Ordre</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  required
                />
              </div>

              <div className="mt-2">
                <label>Contenu (résumé / texte)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#e5e7eb",
                    marginTop: "0.25rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement..." : "Créer le chapitre"}
              </button>
            </form>
          </section>

          {/* ---------------- QUESTIONS ---------------- */}
          <section>
            <h2>Questions du chapitre</h2>

            {loadingChapters ? (
              <p>Chargement des chapitres...</p>
            ) : chapters.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>Aucun chapitre disponible. Crée d'abord un chapitre.</p>
            ) : (
              <>
                <div className="mt-2">
                  <label>Chapitre</label>
                  <select value={selectedChapterId} onChange={(e) => setSelectedChapterId(e.target.value)}>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.order}. {ch.title}
                      </option>
                    ))}
                  </select>
                </div>

                <form className="mt-2" onSubmit={handleQuestionSubmit}>
                  <div className="mt-2">
                    <label>Texte de la question</label>
                    <input value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
                  </div>

                  <div className="mt-2">
                    <label>Réponses</label>
                    <div className="mt-2" style={{ display: "grid", gap: "0.5rem" }}>
                      {answers.map((a, index) => (
                        <div key={index} className="flex gap-2" style={{ alignItems: "center" }}>
                          <input
                            style={{ flex: 1 }}
                            placeholder={`Réponse ${index + 1}`}
                            value={a.text}
                            onChange={(e) => handleAnswerChange(index, "text", e.target.value)}
                          />
                          <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <input
                              type="checkbox"
                              checked={a.isCorrect}
                              onChange={(e) => handleAnswerChange(index, "isCorrect", e.target.checked)}
                            />
                            <span style={{ fontSize: "0.8rem" }}>Correcte</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button type="submit" disabled={submitting}>
                      {submitting
                        ? "Enregistrement..."
                        : editingQuestionId
                        ? "Mettre à jour la question"
                        : "Créer la question"}
                    </button>

                    {editingQuestionId && (
                      <button type="button" onClick={resetQuestionForm} disabled={submitting}>
                        Annuler l'édition
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-4">
                  <h3>Liste des questions</h3>

                  {loadingQuestions ? (
                    <p>Chargement des questions...</p>
                  ) : questions.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Aucune question pour ce chapitre.</p>
                  ) : (
                    <div className="mt-2" style={{ display: "grid", gap: "0.75rem" }}>
                      {questions.map((q) => (
                        <div
                          key={q.id}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "0.75rem",
                            border: "1px solid #1f2937",
                            background: "#020617",
                          }}
                        >
                          <div className="flex-between">
                            <p style={{ fontSize: "0.95rem" }}>
                              <strong>{q.text}</strong>
                            </p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleEditQuestion(q)}>
                                Éditer
                              </button>
                              <button type="button" onClick={() => handleDeleteQuestion(q.id)}>
                                Supprimer
                              </button>
                            </div>
                          </div>

                          <ul className="mt-2" style={{ paddingLeft: "1rem", fontSize: "0.85rem" }}>
                            {q.answers.map((a, idx) => (
                              <li key={idx}>
                                {a.text}{" "}
                                {a.isCorrect && <span style={{ color: "#22c55e" }}>(correcte)</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ---------------- BADGES ---------------- */}
          <section>
            <h2>Badges</h2>

            <p className="mt-2" style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Crée des badges comme <strong>"Premier pas"</strong>, <strong>"500 points"</strong>, etc.
              Tu pourras ensuite utiliser leur titre dans la logique backend.
            </p>

            <form className="mt-2" onSubmit={handleBadgeSubmit}>
              <div className="mt-2">
                <label>Titre du badge</label>
                <input value={badgeTitle} onChange={(e) => setBadgeTitle(e.target.value)} required />
              </div>

              <div className="mt-2">
                <label>Description</label>
                <textarea
                  value={badgeDescription}
                  onChange={(e) => setBadgeDescription(e.target.value)}
                  required
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#e5e7eb",
                    marginTop: "0.25rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="mt-2">
                <label>Icône (emoji ou texte)</label>
                <input value={badgeIcon} onChange={(e) => setBadgeIcon(e.target.value)} />
              </div>

              <div className="mt-2">
                <label>Condition (optionnel)</label>
                <input
                  value={badgeCondition}
                  onChange={(e) => setBadgeCondition(e.target.value)}
                  placeholder='ex: "Premier quiz complété", "Atteindre 500 points"'
                />
              </div>

              <div className="mt-2 flex gap-2">
                <button type="submit" disabled={submitting}>
                  {submitting
                    ? "Enregistrement..."
                    : editingBadgeId
                    ? "Mettre à jour le badge"
                    : "Créer le badge"}
                </button>

                {editingBadgeId && (
                  <button type="button" onClick={resetBadgeForm} disabled={submitting}>
                    Annuler l'édition
                  </button>
                )}
              </div>
            </form>

            <div className="mt-4">
              <h3>Liste des badges</h3>

              {badges.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Aucun badge pour le moment.</p>
              ) : (
                <div className="mt-2" style={{ display: "grid", gap: "0.75rem" }}>
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #1f2937",
                        background: "#020617",
                      }}
                    >
                      <div className="flex-between">
                        <div>
                          <h4>
                            {b.icon && <span style={{ marginRight: "0.5rem" }}>{b.icon}</span>}
                            {b.title}
                          </h4>
                          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>{b.description}</p>
                          {b.condition && (
                            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                              Condition: {b.condition}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEditBadge(b)}>
                            Éditer
                          </button>
                          <button type="button" onClick={() => handleDeleteBadge(b.id)}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    )}
  </div>
);
};

export default Admin;