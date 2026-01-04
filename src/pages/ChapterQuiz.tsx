import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

type Answer = {
  id?: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id?: string;
  text: string;
  answers: Answer[];
};

type Chapter = {
  id: string;
  title: string;
  period: string;
  content: string;
};

type QuizData = {
  chapter: Chapter;
  questions: Question[];
};

const ChapterQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { refreshUserPoints } = useAuth();

  const [data, setData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(
    null
  );
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        // 🔹 On utilise la route existante /chapters/:id
        const res = await api.get(`/chapters/${id}`);
        const raw = res.data;

        let chapter: Chapter;
        let questions: Question[] = [];

        // Cas 1 : le backend renvoie { chapter, questions }
        if (raw.chapter) {
          chapter = raw.chapter;
          if (raw.questions && Array.isArray(raw.questions)) {
            questions = raw.questions;
          } else if (raw.chapter.questions && Array.isArray(raw.chapter.questions)) {
            questions = raw.chapter.questions;
          }
        } else {
          // Cas 2 : le backend renvoie directement le chapitre avec questions incluses
          chapter = raw;
          if (raw.questions && Array.isArray(raw.questions)) {
            questions = raw.questions;
          }
        }

        setData({ chapter, questions });
        setCurrentIndex(0);
        setScore(0);
        setAnswered(false);
        setLastAnswerCorrect(null);
        setFinished(false);
      } catch (err: any) {
        console.error("Erreur chargement quiz chapitre", err?.response || err);
        setError("Impossible de charger le quiz pour ce chapitre.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const questions = data?.questions ?? [];
  const chapter = data?.chapter ?? null;
  const totalQuestions = questions.length;

  const currentQuestion = useMemo(() => {
    if (!questions.length) return null;
    if (currentIndex < 0 || currentIndex >= questions.length) return null;
    return questions[currentIndex];
  }, [questions, currentIndex]);

  const progress = useMemo(() => {
    if (!totalQuestions) return 0;
    return ((currentIndex + 1) / totalQuestions) * 100;
  }, [currentIndex, totalQuestions]);

  // Envoie le score au backend + rafraîchit les points dans le header
  const submitScore = async (finalScore: number) => {
    if (!chapter) return;
    try {
      await api.post("/scores/sync-offline", {
        scores: [
          {
            points: finalScore,
            quizType: "chapter",
            chapterId: chapter.id,
          },
        ],
      });

      // met à jour les points de l'utilisateur dans le contexte (header)
      await refreshUserPoints();
    } catch (e) {
      console.error("Erreur lors de l'enregistrement du score", e);
    }
  };

  const handleAnswer = (answer: Answer) => {
    if (answered || finished || !currentQuestion) return;

    const isGood = answer.isCorrect;
    setAnswered(true);
    setLastAnswerCorrect(isGood);

    const newScore = isGood ? score + 1 : score;
    if (isGood) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex((prev) => prev + 1);
        setAnswered(false);
        setLastAnswerCorrect(null);
      } else {
        // fin du quiz : on envoie le score final au backend
        submitScore(newScore);
        setFinished(true);
      }
    }, 900);
  };

  if (loading) return <p>Chargement du quiz...</p>;
  if (error) return <p className="form-error">{error}</p>;

  if (!chapter || totalQuestions === 0 || !currentQuestion) {
    return (
      <div className="card">
        <h2>Aucun quiz disponible pour ce chapitre.</h2>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Vérifie que ce chapitre contient bien des questions dans l’espace
          admin.
        </p>
        <div className="mt-4">
          <Link to="/chapters">
            <button>Retour aux chapitres</button>
          </Link>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Quiz terminé 🎉</h1>
        <p
          className="mt-2"
          style={{ fontSize: "0.95rem", color: "#9ca3af" }}
        >
          Chapitre : <strong>{chapter.title}</strong>
        </p>
        <p className="mt-2" style={{ fontSize: "1.1rem" }}>
          Ton score : <strong>{score}</strong> / {totalQuestions}
        </p>

        <div className="mt-4 flex-between">
          <Link to="/chapters">
            <button>Retour aux chapitres</button>
          </Link>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setAnswered(false);
              setLastAnswerCorrect(null);
              setFinished(false);
            }}
          >
            Rejouer ce quiz
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-between">
        <div>
          <h1>{chapter.title}</h1>
          <p
            className="mt-1"
            style={{ fontSize: "0.85rem", color: "#9ca3af" }}
          >
            Période : {chapter.period} • Question {currentIndex + 1} /{" "}
            {totalQuestions}
          </p>
        </div>
        <div className="chip">
          <span className="chip-dot" />
          <span>Score : {score}</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-4">
        <div
          style={{
            width: "100%",
            height: "6px",
            borderRadius: "999px",
            backgroundColor: "#111827",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#10b981",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mt-4">
        <h2 style={{ fontSize: "1.1rem" }}>{currentQuestion.text}</h2>
        <p
          className="mt-1"
          style={{ fontSize: "0.8rem", color: "#9ca3af" }}
        >
          Choisis la bonne réponse.
        </p>

        <div className="mt-4" style={{ display: "grid", gap: "0.6rem" }}>
          {currentQuestion.answers.map((answer, idx) => (
            <button
              key={answer.id ?? idx}
              onClick={() => handleAnswer(answer)}
              disabled={answered}
              style={{
                textAlign: "left",
                width: "100%",
                padding: "0.7rem 0.9rem",
                borderRadius: "0.7rem",
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                cursor: answered ? "default" : "pointer",
                opacity: answered ? 0.9 : 1,
              }}
            >
              {answer.text}
            </button>
          ))}
        </div>

        {lastAnswerCorrect !== null && (
          <div
            className="mt-3"
            style={{ fontSize: "0.9rem", fontWeight: 500 }}
          >
            {lastAnswerCorrect ? (
              <span style={{ color: "#34d399" }}>✅ Bonne réponse !</span>
            ) : (
              <span style={{ color: "#fb7185" }}>
                ❌ Mauvaise réponse, regarde la suivante…
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex-between">
        <Link to="/chapters">
          <button style={{ backgroundColor: "#111827" }}>
            ← Retour aux chapitres
          </button>
        </Link>
        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          Ta progression est enregistrée.
        </span>
      </div>
    </motion.div>
  );
};

export default ChapterQuiz;
