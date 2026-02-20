// Shared small helpers for the Worker + Durable Objects.
// Keep these tiny and dependency-free.

export function sanitizeRoomId(roomId) {
  if (!roomId) return "";
  const v = String(roomId).trim();
  // Letters, numbers, dash, underscore only; keep short to avoid abuse.
  return v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}
