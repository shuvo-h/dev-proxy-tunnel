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
app.use(
    "/socket.io",
    createProxyMiddleware({
      target: "http://localhost:5002",
      changeOrigin: true,
      xfwd: true,
      ws: true,
      logLevel: "debug",
    })
  );

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

app.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    ws: true, // for HMR / WebSocket
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Dev Gateway running on http://localhost:${PORT}`);
});



// --------------------------------------------- usefull commands -------------------------------------
/*
  >> cloudflared tunnel run localdev-tunnel
  >> npx next dev -p 3001
*/