
export default {
  async fetch(request, env) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket endpoint", { status: 200 });
    }

    const url = new URL(request.url);
        let roomId = url.searchParams.get("room");
    if (!roomId) {
      const parts = url.pathname.split('/').filter(Boolean);
      // allow /ws/<roomId>
      if (parts.length >= 2 && parts[0] === 'ws') roomId = parts[1];
    }
    roomId = roomId || "default";

    const id = env.ROOMS.idFromName(roomId);
    const obj = env.ROOMS.get(id);

    return obj.fetch(request);
  }
};

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // clientId -> { ws, role, name }
    this.sessions = new Map();
    this.hostId = null;
  }

  _broadcast(obj) {
    const data = JSON.stringify(obj);
    for (const { ws } of this.sessions.values()) {
      try { ws.send(data); } catch {}
    }
  }

  _sendTo(clientId, obj) {
    const s = this.sessions.get(clientId);
    if (!s?.ws) return;
    try { s.ws.send(JSON.stringify(obj)); } catch {}
  }

  _peerlist() {
    const peers = [];
    for (const [id, s] of this.sessions.entries()) {
      peers.push({ id, role: s.role || 'viewer', name: s.name || (s.role === 'host' ? 'Host' : 'Viewer') });
    }
    return peers;
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    let clientId = crypto.randomUUID();
    let role = 'viewer';
    let name = 'Viewer';

    server.addEventListener("message", (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === "hello") {
        clientId = msg.clientId;
        role = (msg.role === 'host' ? 'host' : 'viewer');
        name = msg.name || (role === 'host' ? 'Host' : 'Viewer');

        this.sessions.set(clientId, { ws: server, role, name });
        if (role === "host") this.hostId = clientId;

        server.send(JSON.stringify({
          type: "welcome",
          roomId: msg.roomId,
          hostId: this.hostId
        }));

        // Send updated peer list to everyone
        this._broadcast({ type: 'peerlist', roomId: msg.roomId, hostId: this.hostId, peers: this._peerlist() });

        // Nudge host<->viewer matching: when a viewer joins and a host exists, notify host.
        if (role === 'viewer' && this.hostId) {
          this._sendTo(this.hostId, { type: 'viewer-join', roomId: msg.roomId, viewerId: clientId, name });
        }

        // If the host joins and there are already viewers, notify host for each.
        if (role === 'host') {
          for (const [id, s] of this.sessions.entries()) {
            if (id !== this.hostId && (s.role || 'viewer') !== 'host') {
              this._sendTo(this.hostId, { type: 'viewer-join', roomId: msg.roomId, viewerId: id, name: s.name || 'Viewer' });
            }
          }
        }
        return;
      }

      if (msg.to && this.sessions.has(msg.to)) {
        // direct message relay
        const s = this.sessions.get(msg.to);
        try { s.ws.send(JSON.stringify(msg)); } catch {}
      }
    });

    server.addEventListener("close", () => {
      this.sessions.delete(clientId);
      if (this.hostId === clientId) this.hostId = null;
      // Broadcast updated peer list on leave
      this._broadcast({ type: 'peerlist', hostId: this.hostId, peers: this._peerlist() });
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
