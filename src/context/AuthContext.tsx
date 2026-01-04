import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

type User = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  points: number;
  level: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUserPoints: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * ✅ Rafraîchit les points depuis le backend
   * - Ne dépend plus de "user" (sinon ça rate juste après login/register)
   * - Met à jour user via setUser(prev => ...) pour éviter les valeurs "stale"
   */
  const refreshUserPoints = async () => {
    const t = token || localStorage.getItem("token");
    if (!t) return;

    try {
      // Cette route doit exister côté backend: GET /api/scores/me (authMiddleware)
      const res = await api.get("/scores/me");
      const scores = res.data as Array<{ points: number }>;

      const total = scores.reduce(
        (acc, s) => acc + (typeof s.points === "number" ? s.points : 0),
        0
      );

      setUser((prev) => {
        if (!prev) return prev;
        const updatedUser = { ...prev, points: total };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (e) {
      console.error("Impossible de rafraîchir les points utilisateur :", e);
    }
  };

  // ✅ Au démarrage : recharge token + user
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));

    setLoading(false);
  }, []);

  // ✅ Quand on a token + user, on rafraîchit les points
  useEffect(() => {
    if (token && user?.id) {
      refreshUserPoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = res.data;

    // ✅ set + localStorage d'abord
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    // ✅ puis refresh (maintenant il ne dépend plus de user)
    await refreshUserPoints();
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { username, email, password });
    const { token: newToken, user: newUser } = res.data;

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    await refreshUserPoints();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        refreshUserPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
