const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = 3000;



app.use((req, res, next) => {
    console.log("🔹 Incoming request:");
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl); // full URL as called by Axios
    console.log("Body:", req.body || {});
    console.log("Headers:", req.headers['host'], req.headers['origin']);
    next();
  });


/* ---------------------------
   Microservices
---------------------------- */

// Auth service (keeps full prefix)


app.use(
    "/api/v1/acc",
    createProxyMiddleware({
      target: "http://localhost:5001",
      changeOrigin: true,
      xfwd: true,
      logLevel: "debug",
      pathRewrite: (path) => `/api/v1/acc${path.replace(/^\/api\/v1\/acc/, "")}`,
    })
  );



// Study service
app.use(
    "/api/v1/study",
    createProxyMiddleware({
      target: "http://localhost:5003",
      changeOrigin: true,
      xfwd: true,
      logLevel: "debug",
      pathRewrite: (path) => `/api/v1/study${path.replace(/^\/api\/v1\/study/, "")}`,
    })
  );

// Notify service (HTTP + Socket.IO)
app.use(
    "/api/v1/notify",
    createProxyMiddleware({
      target: "http://localhost:5002",
      changeOrigin: true,
      xfwd: true,
      ws: true, // Socket.IO upgrade
      logLevel: "debug",
      pathRewrite: (path) => `/api/v1/notify${path.replace(/^\/api\/v1\/notify/, "")}`,
    })
  );

// Notify service — Socket.IO endpoint (default path: /socket.io)
// Save the middleware instance so we can hook its upgrade() handler on the
// HTTP server below. Under Express 5 + http-proxy-middleware v3, `ws: true`
// alone does NOT attach the upgrade listener — the browser's WS handshake
// fails silently at the TCP layer without the explicit server.on('upgrade').
const socketIoProxy = createProxyMiddleware({
  target: "http://localhost:5002",
  changeOrigin: true,
  xfwd: true,
  ws: true,
  logLevel: "debug",
});
app.use("/socket.io", socketIoProxy);

// app.use(
//   "/api/v1/study",
//   createProxyMiddleware({
//     target: "http://localhost:5003",
//     changeOrigin: true,
//     xfwd: true,
//   })
// );

/* ---------------------------
   Frontend (LAST)
---------------------------- */
// >> npm run dev -- -p 3001
// >> npx next dev -p 3001

const frontendProxy = createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true, // for HMR / WebSocket
});
app.use("/", frontendProxy);

const server = app.listen(PORT, () => {
  console.log(`🚀 Dev Gateway running on http://localhost:${PORT}`);
});

// Route WebSocket upgrades by path. Express 5 + http-proxy-middleware v3
// require an explicit server.on('upgrade'); without routing, every upgrade
// (including Next.js /_next/webpack-hmr) is sent to whichever proxy the
// hook points at.
server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.startsWith("/socket.io")) {
    socketIoProxy.upgrade(req, socket, head);
  } else {
    frontendProxy.upgrade(req, socket, head);
  }
});



// --------------------------------------------- usefull commands -------------------------------------
/*
  >> cloudflared tunnel run localdev-tunnel
  >> npx next dev -p 3001
*/