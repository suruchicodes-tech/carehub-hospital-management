const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "web");
const envPath = path.join(__dirname, ".env");
const logPath = path.join(__dirname, "otp-debug.log");
const otpStore = new Map();

loadEnv(envPath);

const config = {
  port: Number(process.env.PORT || 8090),
  provider: (process.env.OTP_PROVIDER || "msg91").toLowerCase(),
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 5),
  msg91AuthKey: process.env.MSG91_AUTH_KEY || "",
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID || "",
  msg91SenderId: process.env.MSG91_SENDER_ID || "",
  fast2smsApiKey: process.env.FAST2SMS_API_KEY || ""
};

const server = http.createServer(async (req, res) => {
  try {
    log(`IN ${req.method} ${req.url}`);
    if (req.method === "POST" && req.url === "/api/send-otp") {
      await handleSendOtp(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/verify-otp") {
      await handleVerifyOtp(req, res);
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { ok: false, message: "Server error. Please try again." });
  }
});

server.listen(config.port, () => {
  console.log(`CareHub HMS running at http://127.0.0.1:${config.port}`);
  console.log(`OTP provider: ${config.provider}`);
});

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    process.env[key] = value.replace(/^["']|["']$/g, "");
  }
}

function sendJson(res, status, payload) {
  log(`OUT ${status} ${payload.message || ""}`);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFile(logPath, line, () => {});
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function normalizeIndianMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return "";
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

async function handleSendOtp(req, res) {
  const { email, mobile } = await readJson(req);
  const normalizedMobile = normalizeIndianMobile(mobile);
  const cleanEmail = String(email || "").trim();

  if (!cleanEmail || !normalizedMobile) {
    sendJson(res, 400, { ok: false, message: "Valid email and Indian mobile number are required." });
    return;
  }

  const otp = generateOtp();
  let providerResult;
  try {
    providerResult = await withTimeout(sendOtpWithProvider(normalizedMobile, otp), 12000, "MSG91 request timed out.");
  } catch (error) {
    sendJson(res, 500, { ok: false, message: `OTP provider error: ${error.message}` });
    return;
  }

  log(`PROVIDER ${JSON.stringify(providerResult || {}).slice(0, 500)}`);

  otpStore.set(normalizedMobile, {
    email: cleanEmail,
    mobile: normalizedMobile,
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + config.otpExpiryMinutes * 60 * 1000,
    attempts: 0
  });

  sendJson(res, 200, {
    ok: true,
    message: `OTP sent to +${normalizedMobile}.`,
    expiresInMinutes: config.otpExpiryMinutes
  });
}

async function handleVerifyOtp(req, res) {
  const { email, mobile, otp } = await readJson(req);
  const normalizedMobile = normalizeIndianMobile(mobile);
  const cleanEmail = String(email || "").trim();
  const record = otpStore.get(normalizedMobile);

  if (!record || record.email !== cleanEmail) {
    sendJson(res, 400, { ok: false, message: "OTP request not found. Please send OTP again." });
    return;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedMobile);
    sendJson(res, 400, { ok: false, message: "OTP expired. Please send a new OTP." });
    return;
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(normalizedMobile);
    sendJson(res, 429, { ok: false, message: "Too many wrong attempts. Please send OTP again." });
    return;
  }

  if (hashOtp(String(otp || "")) !== record.otpHash) {
    sendJson(res, 400, { ok: false, message: "Wrong OTP. Please check and try again." });
    return;
  }

  otpStore.delete(normalizedMobile);
  sendJson(res, 200, {
    ok: true,
    message: "Login verified successfully.",
    user: { email: cleanEmail, mobile: `+${normalizedMobile}` }
  });
}

async function sendOtpWithProvider(mobile, otp) {
  if (config.provider === "fast2sms") {
    return sendFast2SmsOtp(mobile, otp);
  }

  try {
    return await sendMsg91Otp(mobile, otp);
  } catch (error) {
    if (!config.fast2smsApiKey) throw error;
    console.warn(`MSG91 failed, trying Fast2SMS fallback: ${error.message}`);
    return sendFast2SmsOtp(mobile, otp);
  }
}

function sendMsg91Otp(mobile, otp) {
  if (!config.msg91AuthKey || !config.msg91TemplateId) {
    throw new Error("MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are required.");
  }

  const params = new URLSearchParams({
    template_id: config.msg91TemplateId,
    mobile,
    otp,
    otp_expiry: String(config.otpExpiryMinutes)
  });

  if (config.msg91SenderId) params.set("sender", config.msg91SenderId);

  return requestJson({
    method: "GET",
    hostname: "control.msg91.com",
    path: `/api/v5/otp?${params.toString()}`,
    headers: {
      accept: "application/json",
      authkey: config.msg91AuthKey
    }
  });
}

function sendFast2SmsOtp(mobile, otp) {
  if (!config.fast2smsApiKey) {
    throw new Error("FAST2SMS_API_KEY is required.");
  }

  const params = new URLSearchParams({
    variables_values: otp,
    route: "otp",
    numbers: mobile.slice(-10)
  });

  return requestJson({
    method: "GET",
    hostname: "www.fast2sms.com",
    path: `/dev/bulkV2?${params.toString()}`,
    headers: {
      authorization: config.fast2smsApiKey
    }
  });
}

function requestJson(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        let parsed = body;
        try {
          parsed = body ? JSON.parse(body) : {};
        } catch {
          parsed = { raw: body };
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
          return;
        }

        reject(new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed)));
      });
    });
    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error("Provider connection timed out."));
    });
    req.end();
  });
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(webDir, requestedPath));

  if (!filePath.startsWith(webDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": getContentType(filePath),
      "Cache-Control": "no-store"
    });
    res.end(content);
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
}
