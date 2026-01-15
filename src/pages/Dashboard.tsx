import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1>Bonjour, {user?.username}</h1>
      <p className="mt-2" style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
        Bienvenue sur Kibaro History. Continue ton parcours historique, défie tes amis
        et découvre de nouveaux chapitres sur la Guinée et l'Afrique.
      </p>

      {/* Grid de sections (cards plus légères) */}
      <div className="mt-4 grid grid-2">
        <motion.section
          className="dash-tile"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <h3>Commencer à jouer</h3>
          <p className="mt-2" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Parcours les chapitres de l'histoire de la Guinée et teste tes connaissances
            avec des quiz progressifs.
          </p>

          <Link to="/chapters">
            <button className="mt-4">Voir les chapitres</button>
          </Link>
        </motion.section>

        <motion.section
          className="dash-tile"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h3>Voir tes performances</h3>
          <p className="mt-2" style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Suis ton score cumulé, tes derniers quiz et les badges débloqués au fil de
            ton voyage historique.
          </p>

          <div className="dash-actions mt-4">
            <Link to="/scores">
              <button>Scores</button>
            </Link>
            <Link to="/badges">
              <button>Badges</button>
            </Link>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Dashboard;
