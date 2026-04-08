/// <reference types="vite/client" />

import { Client, Session, Socket } from "@heroiclabs/nakama-js";

const NAKAMA_HOST = import.meta.env.VITE_NAKAMA_HOST || "localhost";
const NAKAMA_PORT = import.meta.env.VITE_NAKAMA_PORT || "7350";
const NAKAMA_USE_SSL = import.meta.env.VITE_NAKAMA_USE_SSL === "true";
const NAKAMA_SERVER_KEY =
  import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey";

export type { Client, Session, Socket };

let client: Client | null = null;
let session: Session | null = null;
let socket: Socket | null = null;

export function getClient(): Client {
  if (!client) {
    client = new Client(
      NAKAMA_SERVER_KEY,
      NAKAMA_HOST,
      NAKAMA_PORT,
      NAKAMA_USE_SSL
    );
  }
  return client;
}

export function getSession(): Session | null {
  return session;
}

export function setSession(s: Session | null): void {
  session = s;
}

export function getSocket(): Socket | null {
  return socket;
}

export async function connect(sess: Session): Promise<Socket> {
  const c = getClient();
  const sock = c.createSocket(NAKAMA_USE_SSL, false);
  await sock.connect(sess, true);
  socket = sock;
  return sock;
}

export async function disconnect(): Promise<void> {
  if (socket) {
    socket.disconnect(true);
    socket = null;
  }
}

// Device auth / auto-login
export async function authenticateDevice(deviceId: string): Promise<Session> {
  const c = getClient();
  const sess = await c.authenticateDevice(deviceId, true, undefined);
  session = sess;
  return sess;
}

// Generate a stable device ID stored in localStorage
export function getOrCreateDeviceId(): string {
  const key = "ttt_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      "device-" +
      Math.random().toString(36).slice(2) +
      "-" +
      Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

export function saveSession(sess: Session): void {
  localStorage.setItem("ttt_session_token", sess.token);
  localStorage.setItem("ttt_refresh_token", sess.refresh_token || "");
}

export async function loadSession(): Promise<Session | null> {
  const token = localStorage.getItem("ttt_session_token");
  const refreshToken = localStorage.getItem("ttt_refresh_token");
  if (!token) return null;

  try {
    const c = getClient();
    let sess = Session.restore(token, refreshToken || "");

    // Refresh if expired
    if (sess.isexpired(Date.now() / 1000)) {
      sess = await c.sessionRefresh(sess);
      saveSession(sess);
    }

    session = sess;
    return sess;
  } catch (_e) {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem("ttt_session_token");
  localStorage.removeItem("ttt_refresh_token");
  session = null;
}

// Helper to call RPCs and get JSON payload
export async function callRpc<T>(
  sess: Session,
  id: string,
  input: object = {}
): Promise<T> {
  const c = getClient();
  const result = await c.rpc(sess, id, input);
  return result.payload as T;
}
