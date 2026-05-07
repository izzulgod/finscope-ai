// Lightweight session helper. Auth is not enabled in v1 — we issue a stable
// "sessionId" stored in localStorage so watchlist/chat history are scoped per
// browser. When real auth is enabled, swap to supabase.auth.getUser().id and
// the existing user_id columns will work unchanged.
const KEY = "finscope_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let v = localStorage.getItem(KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(KEY, v);
  }
  return v;
}
