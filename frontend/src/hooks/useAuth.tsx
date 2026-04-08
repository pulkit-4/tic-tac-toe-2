import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Session, Socket } from "@heroiclabs/nakama-js";
import {
  getOrCreateDeviceId,
  authenticateDevice,
  saveSession,
  loadSession,
  connect,
  disconnect,
  clearSession,
  callRpc,
  getClient,
} from "../nakama";
import { PlayerStats } from "../types";

interface AuthContextType {
  session: Session | null;
  socket: Socket | null;
  isLoading: boolean;
  error: string | null;
  login: (username?: string) => Promise<void>;
  logout: () => Promise<void>;
  stats: PlayerStats | null;
  refreshStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  const connectSocket = useCallback(async (sess: Session): Promise<Socket> => {
    const sock = await connect(sess);
    setSocket(sock);
    return sock;
  }, []);

  const refreshStats = useCallback(async () => {
    if (!session) return;
    try {
      const result = await callRpc<PlayerStats>(session, "get_stats", {});
      if (result) {
        setStats(result);
      }
    } catch (_e) {
      // ignore
    }
  }, [session]);

  // Auto-login on mount
  useEffect(() => {
    (async () => {
      try {
        const savedSession = await loadSession();
        if (savedSession) {
          setSession(savedSession);
          await connectSocket(savedSession);
          setIsLoading(false);
          return;
        }
      } catch (_e) {
        // session load failed, will need fresh login
      }
      setIsLoading(false);
    })();
  }, [connectSocket]);

  useEffect(() => {
    if (session) {
      refreshStats();
    }
  }, [session, refreshStats]);

  const login = useCallback(
    async (username?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const deviceId = getOrCreateDeviceId();
        const sess = await authenticateDevice(deviceId);

        // Update username if provided
        if (username && username.trim()) {
          try {
            await getClient().updateAccount(sess, {
              username: username.trim(),
              display_name: username.trim(),
            });
          } catch (_e) {
            // ignore username update errors (might conflict)
          }
        }

        saveSession(sess);
        setSession(sess);
        await connectSocket(sess);
      } catch (e: any) {
        setError(e.message || "Login failed");
      } finally {
        setIsLoading(false);
      }
    },
    [connectSocket]
  );

  const logout = useCallback(async () => {
    await disconnect();
    clearSession();
    setSession(null);
    setSocket(null);
    setStats(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, socket, isLoading, error, login, logout, stats, refreshStats }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
