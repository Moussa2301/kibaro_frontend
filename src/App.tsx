import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chapters from "./pages/Chapters";
import ChapterQuiz from "./pages/ChapterQuiz";
import Scores from "./pages/Scores";
import Badges from "./pages/Badges";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Admin from "./pages/Admin";
import DuelHome from "./pages/DuelHome";
import DuelWait from "./pages/DuelWait";
import DuelPlay from "./pages/DuelPlay";
import DuelResult from "./pages/DuelResult";
import RoomJoin from "./pages/RoomJoin";
import RoomLobby from "./pages/RoomLobby";
import Multiplayer from "./pages/Multiplayer";
import RoomPlay from "./pages/RoomPlay";
import RoomResult from "./pages/RoomResult";





const App: React.FC = () => {

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chapters"
            element={
              <ProtectedRoute>
                <Chapters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chapters/:id/quiz"
            element={
              <ProtectedRoute>
                <ChapterQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scores"
            element={
              <ProtectedRoute>
                <Scores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/badges"
            element={
              <ProtectedRoute>
                <Badges />
              </ProtectedRoute>
            }
          />
          <Route path="/duel" element={<ProtectedRoute><DuelHome /></ProtectedRoute>} />
          <Route path="/duel/wait/:id" element={<ProtectedRoute><DuelWait /></ProtectedRoute>} />
          <Route path="/duel/play/:id" element={<ProtectedRoute><DuelPlay /></ProtectedRoute>} />
          <Route path="/duel/result/:id" element={<ProtectedRoute><DuelResult /></ProtectedRoute>} />
          {/*<Route path="/room/lobby/:id" element={<ProtectedRoute><RoomLobby /></ProtectedRoute>} />*/}
          <Route path="/multiplayer" element={<ProtectedRoute><Multiplayer /></ProtectedRoute>} />
          <Route path="/room/:joinCode" element={<RoomJoin />} />
          <Route path="/room/lobby/:roomId" element={<RoomLobby />} />
          <Route path="/room/play/:roomId" element={<RoomPlay />} />
          <Route path="/room/result/:roomId" element={<RoomResult />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
