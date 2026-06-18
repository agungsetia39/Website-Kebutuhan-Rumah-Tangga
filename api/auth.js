import {
  authConfigured,
  clearSessionCookie,
  createSessionCookie,
  credentialsValid,
  isAuthenticated
} from "./_lib/auth.js";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (!authConfigured()) {
    return response.status(503).json({
      configured: false,
      message: "Autentikasi server belum dikonfigurasi."
    });
  }

  if (request.method === "GET") {
    return response.status(200).json({
      configured: true,
      authenticated: isAuthenticated(request)
    });
  }

  if (request.method === "POST") {
    const { username = "", password = "" } = request.body || {};
    if (!credentialsValid(String(username).trim(), String(password))) {
      return response.status(401).json({ message: "Username atau password salah." });
    }

    response.setHeader("Set-Cookie", createSessionCookie());
    return response.status(200).json({ authenticated: true });
  }

  if (request.method === "DELETE") {
    response.setHeader("Set-Cookie", clearSessionCookie());
    return response.status(200).json({ authenticated: false });
  }

  response.setHeader("Allow", "GET, POST, DELETE");
  return response.status(405).json({ message: "Metode tidak didukung." });
}
