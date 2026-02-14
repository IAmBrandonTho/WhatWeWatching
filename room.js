function sanitizeRoomId(roomId) {
  if (!roomId) return "";
  const v = String(roomId).trim();
  // Keep it simple: letters, numbers, dash, underscore. Limit size to avoid abuse.
  return v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function sanitizeClientId(clientId) {
  const v = String(clientId || "").trim();
  // UUIDs are fine; allow a conservative set to keep logs + maps safe.
  return /^[a-zA-Z0-9-]{8,64}$/.test(v) ? v : "";
}

function clampName(name, fallback) {
  const v = String(name || fallback || "").trim();
  return (v || fallback || "Viewer").slice(0, 30);
}

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    // clientId -> { ws, role, name }
    this.sessions = new Map();

    this.hostId = null;
    this.roomName = "Room";
  }

  _broadcast(obj) {
    const data = JSON.stringify(obj);
    for (const { ws } of this.sessions.values()) {
      try {
        ws.send(data);
      } catch {}
    }
  }

  _sendTo(clientId, obj) {
    const s = this.sessions.get(clientId);
    if (!s?.ws) return;
    try {
      s.ws.send(JSON.stringify(obj));
    } catch {}
  }

  _peerlist() {
    const peers = [];
    for (const [id, s] of this.sessions.entries()) {
      const role = s.role || "viewer";
      peers.push({
        id,
        role,
        name: s.name || (role === "host" ? "Host" : "Viewer"),
      });
    }
    return peers;
  }

  _isRegistered(clientId, ws) {
    const s = this.sessions.get(clientId);
    return !!(s && s.ws === ws);
  }

  _removeClient(clientId, ws, code = 1000, reason = "closed") {
    const s = this.sessions.get(clientId);
    if (!s) return;

    // Only remove if we're removing the active socket for that client id.
    if (ws && s.ws !== ws) return;

    try {
      s.ws.close(code, reason);
    } catch {}

    this.sessions.delete(clientId);

    const wasHost = this.hostId === clientId;
    if (wasHost) this.hostId = null;

    // Notify peers to clean up WebRTC state, then send refreshed roster.
    this._broadcast({ type: "peer-left", clientId, wasHost, at: Date.now() });
    this._broadcast({ type: "peerlist", hostId: this.hostId, peers: this._peerlist() });
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    // Local to this connection until "hello" registers it.
    let clientId = crypto.randomUUID();
    let role = "viewer";
    let name = "Viewer";
    let roomId = "default";
    let registered = false;

    const cleanup = () => {
      if (!registered) return;
      this._removeClient(clientId, server, 1000, "disconnected");
      registered = false;
    };

    server.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      // First message must be hello to register / authenticate the socket.
      if (!registered) {
        if (msg.type !== "hello") return;

        roomId = sanitizeRoomId(msg.roomId) || roomId;

        // Trust-but-verify clientId: keep it short, safe.
        const proposedId = sanitizeClientId(msg.clientId);
        if (proposedId) clientId = proposedId;

        role = msg.role === "host" ? "host" : "viewer";
        name = clampName(msg.name, role === "host" ? "Host" : "Viewer");

        // If a client reconnects with the same id, close the previous connection.
        if (this.sessions.has(clientId)) this._removeClient(clientId, null, 1000, "reconnected");

        this.sessions.set(clientId, { ws: server, role, name });
        registered = true;

        if (role === "host") this.hostId = clientId;

        // Welcome reply to the connecting client.
        this._sendTo(clientId, { type: "welcome", roomId, hostId: this.hostId });

        // Keep everyone in sync.
        this._broadcast({ type: "peerlist", roomId, hostId: this.hostId, peers: this._peerlist() });
        this._broadcast({ type: "room", roomId, name: this.roomName || "Room" });

        // Nudge host<->viewer matching.
        if (role === "viewer" && this.hostId) {
          this._sendTo(this.hostId, { type: "viewer-join", roomId, viewerId: clientId, name });
        } else if (role === "host") {
          for (const [id, s] of this.sessions.entries()) {
            if (id !== this.hostId && (s.role || "viewer") !== "host") {
              this._sendTo(this.hostId, {
                type: "viewer-join",
                roomId,
                viewerId: id,
                name: s.name || "Viewer",
              });
            }
          }
        }
        return;
      }

      // Ignore messages from sockets that are no longer the active socket for this client id.
      if (!this._isRegistered(clientId, server)) return;

      // Host can broadcast room title over WS (keeps viewers updated even before WebRTC is established)
      if (msg.type === "room") {
        if (clientId === this.hostId) {
          this.roomName = clampName(msg.name, "Room");
          this._broadcast({ type: "room", roomId, name: this.roomName });
        }
        return;
      }

      // Update display name (broadcast refreshed peer list)
      if (msg.type === "set-name") {
        const s = this.sessions.get(clientId);
        if (s) {
          s.name = clampName(msg.name, s.role === "host" ? "Host" : "Viewer");
          this.sessions.set(clientId, s);
          this._broadcast({ type: "peerlist", roomId, hostId: this.hostId, peers: this._peerlist() });
        }
        return;
      }

      // Room chat relay (fallback when WebRTC datachannels are not up)
      if (msg.type === "chat") {
        const s = this.sessions.get(clientId);
        const from = clampName(msg.from || s?.name, "Friend");
        const text = String(msg.text || "");
        this._broadcast({ type: "chat", clientId, from, text, at: Date.now() });
        return;
      }

      // Direct relay (offer/answer/ice/chat/etc) to a specific peer.
      const to = msg.to ? String(msg.to) : "";
      if (to && this.sessions.has(to)) {
        this._sendTo(to, msg);
      }
    });

    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);

    return new Response(null, { status: 101, webSocket: client });
  }
}
