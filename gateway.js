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

// Notify service HTTP (NO ws:true — Socket.IO lives at /socket.io below).
app.use(
    "/api/v1/notify",
    createProxyMiddleware({
      target: "http://localhost:5002",
      changeOrigin: true,
      xfwd: true,
      logLevel: "debug",
      pathRewrite: (path) => `/api/v1/notify${path.replace(/^\/api\/v1\/notify/, "")}`,
    })
  );

// Socket.IO — use pathFilter (not app.use prefix) so the `/socket.io` prefix
// is NOT stripped. Otherwise the upstream receives `/?EIO=...` and the request
// lands on notify_service's health router instead of the Socket.IO handler.
const socketIoProxy = createProxyMiddleware({
  target: "http://localhost:5002",
  changeOrigin: true,
  xfwd: true,
  ws: true,
  pathFilter: "/socket.io",
  logLevel: "debug",
});
app.use(socketIoProxy);

/* ---------------------------
   Frontend (LAST)
---------------------------- */
// >> npm run dev -- -p 3001
// >> npx next dev -p 3001
//
// pathFilter excludes /socket.io and /api/v1 so this proxy's auto-subscribed
// WS-upgrade listener doesn't hijack Socket.IO or API traffic and forward it
// to Next.js (which would answer with EOF and break wss://).
const frontendProxy = createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true, // for Next.js HMR
  pathFilter: (pathname) =>
    !pathname.startsWith("/socket.io") && !pathname.startsWith("/api/v1"),
});
app.use(frontendProxy);

const server = app.listen(PORT, () => {
  console.log(`🚀 Dev Gateway running on http://localhost:${PORT}`);
});



// --------------------------------------------- usefull commands -------------------------------------
/*
  >> cloudflared tunnel run localdev-tunnel
  >> npx next dev -p 3001
*/