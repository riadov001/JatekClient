import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { attachAuth } from "./middlewares/auth";

const app: Express = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(compression());

// In production, restrict CORS to known origins. Set ALLOWED_ORIGINS as a
// comma-separated list (e.g. "https://app.example.com,https://admin.example.com").
// We also auto-allow Replit's hosted preview/deploy subdomains and same-origin
// (no Origin header — typical for native mobile apps that just send a host).
const isProd = process.env["NODE_ENV"] === "production";
const allowedOrigins: string[] = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOriginCheck: cors.CorsOptions["origin"] = (origin, callback) => {
  // Same-origin / native mobile / curl — no Origin header at all.
  if (!origin) return callback(null, true);
  // Dev: open CORS to make local browsers + multiple ports painless.
  if (!isProd) return callback(null, true);
  // Explicit allow-list match.
  if (allowedOrigins.includes(origin)) return callback(null, true);
  // Auto-allow the production custom domain (configured via EXPO_PUBLIC_DOMAIN).
  // Note: we deliberately do NOT wildcard *.replit.app / *.replit.dev — combined
  // with `credentials: true` that would trust any tenant on the shared platform.
  // For replit-hosted preview/deploy URLs, set ALLOWED_ORIGINS explicitly.
  try {
    const host = new URL(origin).hostname;
    const customHost = (process.env["EXPO_PUBLIC_DOMAIN"] ?? "").trim();
    if (customHost && host === customHost) {
      return callback(null, true);
    }
  } catch {
    // Fall through to reject below.
  }
  logger.warn({ origin }, "CORS: rejected origin");
  return callback(new Error(`CORS: origin not allowed: ${origin}`));
};

app.use(
  cors({
    origin: corsOriginCheck,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Health check — must respond 200 before Cloud Run / autoscale probe times out.
// Handles both /health (explicit) and / (the default autoscale startup probe).
app.get(["/health", "/healthz"], (_req, res) => {
  res.json({ status: "ok" });
});

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/healthz" || req.path.startsWith("/events"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// ─── Mobile app download page ─────────────────────────────────────────────────
const EXPO_UPDATE_URL =
  "exp://u.expo.dev/e5622f86-143a-4096-b816-682cc02edc39?channel-name=main&runtime-version=exposdk%3A54.0.0";
const EXPO_UPDATE_URL_ENCODED = encodeURIComponent(EXPO_UPDATE_URL);

app.get("/mobile", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Jatek — Application mobile</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:20px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .logo{font-size:36px;font-weight:800;color:#e05c2a;letter-spacing:-1px;margin-bottom:4px}
    .subtitle{color:#888;font-size:14px;margin-bottom:32px}
    .qr-wrap{background:#f9f9f9;border-radius:16px;padding:20px;display:inline-block;margin-bottom:28px}
    .qr-wrap img{display:block;width:200px;height:200px}
    h2{font-size:18px;font-weight:700;margin-bottom:8px;color:#111}
    .steps{text-align:left;background:#f9f9f9;border-radius:12px;padding:16px 20px;margin:20px 0;font-size:14px;color:#444;line-height:1.7}
    .steps b{color:#111}
    .btn{display:inline-block;background:#e05c2a;color:#fff;text-decoration:none;border-radius:12px;padding:14px 28px;font-size:16px;font-weight:700;margin-top:16px;width:100%}
    .btn:active{opacity:.85}
    .note{font-size:12px;color:#aaa;margin-top:20px;line-height:1.5}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Jatek</div>
    <div class="subtitle">Livraison à Oujda</div>

    <div class="qr-wrap">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${EXPO_UPDATE_URL_ENCODED}" alt="QR Code Expo Go"/>
    </div>

    <h2>Ouvrir dans Expo Go</h2>

    <div class="steps">
      <b>1.</b> Installez <b>Expo Go</b> depuis l'App Store ou Google Play<br/>
      <b>2.</b> Scannez le QR code ci-dessus<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;— ou —<br/>
      <b>3.</b> Appuyez sur le bouton ci-dessous
    </div>

    <a class="btn" href="${EXPO_UPDATE_URL}">Ouvrir dans Expo Go</a>

    <p class="note">Fonctionne avec Expo Go SDK 54.<br/>L'app se met à jour automatiquement.</p>
  </div>
</body>
</html>`);
});

app.use((req, res, next) => {
  req.setTimeout(30_000);
  res.setTimeout(30_000);
  next();
});

app.use("/api", attachAuth);
app.use("/api", router);

// ─── Production static file serving ──────────────────────────────────────────
// In production the API server also serves the built web apps:
//   /admin/* → backend-dashboard (built to artifacts/backend-dashboard/dist/public)
//   /*        → food-delivery    (built to artifacts/food-delivery/dist/public)
if (process.env.NODE_ENV === "production") {
  const dashboardDir = path.resolve(__dirname, "../../backend-dashboard/dist/public");
  const webDir = path.resolve(__dirname, "../../food-delivery/dist/public");

  if (existsSync(dashboardDir)) {
    app.use("/admin", express.static(dashboardDir, { index: "index.html" }));
    // SPA fallback — app.use (prefix match) avoids path-to-regexp wildcard issues in Express 5
    app.use("/admin", (_req, res) => {
      res.sendFile(path.join(dashboardDir, "index.html"));
    });
    logger.info("Serving backend-dashboard static files from " + dashboardDir);
  } else {
    logger.warn("backend-dashboard/dist/public not found — run pnpm build first");
  }

  if (existsSync(webDir)) {
    app.use("/", express.static(webDir, { index: "index.html" }));
    // SPA fallback — catch-all via app.use, no wildcard pattern needed
    app.use((_req, res) => {
      res.sendFile(path.join(webDir, "index.html"));
    });
    logger.info("Serving food-delivery static files from " + webDir);
  } else {
    logger.warn("food-delivery/dist/public not found — run pnpm build first");
  }
} else {
  app.use((req, res) => {
    res.status(404).json({ error: "Not found", path: req.path });
  });
}

app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  if (res.headersSent) return;
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
});

export default app;
