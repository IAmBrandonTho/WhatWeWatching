
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
    this.sessions = new Map();
    this.hostId = null;
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    let clientId = crypto.randomUUID();

    server.addEventListener("message", (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === "hello") {
        clientId = msg.clientId;
        this.sessions.set(clientId, server);
        if (msg.role === "host") this.hostId = clientId;

        server.send(JSON.stringify({
          type: "welcome",
          roomId: msg.roomId,
          hostId: this.hostId
        }));
        return;
      }

      if (msg.to && this.sessions.has(msg.to)) {
        this.sessions.get(msg.to).send(JSON.stringify(msg));
      }
    });

    server.addEventListener("close", () => {
      this.sessions.delete(clientId);
      if (this.hostId === clientId) this.hostId = null;
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
