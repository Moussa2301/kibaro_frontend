import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";

type ChapterCategory = "tous" | "guinee" | "afrique" | "mande" | "general";

function getChapterCategory(title: string): ChapterCategory {
  const t = title.toLowerCase();

  if (t.includes("guinée") || t.includes("guinéen") || t.includes("syli")) return "guinee";
  if (t.includes("afrique") || t.includes("panafricain")) return "afrique";
  if (t.includes("mandé") || t.includes("mali") || t.includes("soundiata")) return "mande";
  if (t.includes("général") || t.includes("quiz rapide") || t.includes("niveau")) return "general";
  return "tous";
}

type Chapter = {
  id: string;
  title: string;
  content: string;
  period: string;
  order: number;
};

const Chapters: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<ChapterCategory>("tous");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/chapters");
        setChapters(res.data);
      } catch {
        setError("Impossible de charger les chapitres");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const periods = useMemo(() => {
    const set = new Set<string>();
    chapters.forEach((c) => {
      if (c.period) set.add(c.period);
    });
    return Array.from(set);
  }, [chapters]);

  const filteredChapters = useMemo(() => {
    return chapters
      .map((ch) => ({ ...ch, category: getChapterCategory(ch.title) }))
      .filter((ch) => {
        const matchesSearch =
          search.trim().length === 0 ||
          ch.title.toLowerCase().includes(search.toLowerCase()) ||
          ch.content.toLowerCase().includes(search.toLowerCase());

        const matchesPeriod = periodFilter === "all" || ch.period === periodFilter;
        const matchesCategory = categoryFilter === "tous" || ch.category === categoryFilter;

        return matchesSearch && matchesPeriod && matchesCategory;
      });
  }, [chapters, search, periodFilter, categoryFilter]);

  if (loading) return <p>Chargement des chapitres...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header responsive */}
      <div className="chapters-header">
        <div className="chapters-title">
          <h1>Chapitres</h1>
          <p className="mt-2 chapters-subtitle">
            Choisis un chapitre pour explorer l'histoire puis lancer un quiz associé.
          </p>
        </div>

        <div className="chip chapters-chip">
          <span className="chip-dot" />
          <span>{chapters.length} chapitres</span>
        </div>
      </div>

      {/* Filtres catégories */}
      <div className="mt-4 chapters-cats">
        {[
          { id: "tous", label: "Tous" },
          { id: "guinee", label: "Guinée" },
          { id: "afrique", label: "Afrique" },
          { id: "mande", label: "Mandé / Empires" },
          { id: "general", label: "Général" },
        ].map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setCategoryFilter(btn.id as ChapterCategory)}
            className={categoryFilter === btn.id ? "cat-btn cat-btn-active" : "cat-btn"}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Recherche + période */}
      <div className="mt-4 chapters-filters">
        <div>
          <label>Recherche</label>
          <input
            placeholder="Titre, contenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label>Période</label>
          <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
            <option value="all">Toutes les périodes</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        {filteredChapters.length === 0 && (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Aucun chapitre ne correspond à ta recherche.
          </p>
        )}

        <div className="mt-2 chapters-grid">
          {filteredChapters.map((ch, index) => (
            <motion.div
              key={ch.id}
              className="card fade-in"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.25 }}
            >
              {/* Card header responsive */}
              <div className="chapter-card-header">
                <div className="chapter-card-title">
                  <h3 className="chapter-h3">
                    {ch.order}. {ch.title}
                  </h3>
                  <p className="chapter-period">Période : {ch.period}</p>
                </div>
                <span className="badge">Chapitre</span>
              </div>

              <p className="mt-2 chapter-excerpt">
                {ch.content.length > 140 ? ch.content.slice(0, 140) + "…" : ch.content}
              </p>

              {/* Card footer responsive */}
              <div className="mt-4 chapter-card-footer">
                <span className="chapter-footnote">Quiz disponible</span>
                <Link to={`/chapters/${ch.id}/quiz`} className="full-link">
                  <button className="w-100">Jouer le quiz</button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Chapters;
