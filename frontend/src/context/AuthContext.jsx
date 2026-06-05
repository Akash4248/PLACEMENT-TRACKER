import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("campustrack_token"));
  const [user, setUser] = useState(() => {
    const rawUser = localStorage.getItem("campustrack_user");
    return rawUser ? JSON.parse(rawUser) : null;
  });
  const [booting, setBooting] = useState(Boolean(token));

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const { data } = await authApi.me();
        if (alive) {
          setUser(data.user);
          localStorage.setItem("campustrack_user", JSON.stringify(data.user));
        }
      } catch {
        if (alive) {
          setToken(null);
          setUser(null);
          localStorage.removeItem("campustrack_token");
          localStorage.removeItem("campustrack_user");
        }
      } finally {
        if (alive) {
          setBooting(false);
        }
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [token]);

  const login = async (payload) => {
    const { data } = await authApi.login(payload);
    localStorage.setItem("campustrack_token", data.token);
    localStorage.setItem("campustrack_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem("campustrack_token", data.token);
    localStorage.setItem("campustrack_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("campustrack_token");
    localStorage.removeItem("campustrack_user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      booting,
      isAuthenticated: Boolean(token),
      login,
      logout,
      signup,
      token,
      user,
    }),
    [booting, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
