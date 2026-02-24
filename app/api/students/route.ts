import { LRUCache } from "lru-cache";

export const dynamic = "force-dynamic";

const GOOGLE_SHEETS_API =
  "https://script.google.com/macros/s/AKfycbwZ-3w-pZsWwalaevZzfbVa1ukMuxbuXqxCAfKziEQMej49y2z1xQ1h6QH9av3EyiD0/exec";

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limit: max 10 requests per minute per IP
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// LRU Cache for student data (cache for 5 minutes to reduce Google API calls)
const studentCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  allowStale: true,
  updateAgeOnGet: true,
});

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(req: Request) {
  try {
    // Check rate limit
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return Response.json(
        {
          error: "Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit.",
        },
        { status: 429 },
      );
    }

    // Ambil parameter dari query string
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const nisn = searchParams.get("nisn");
    const semester = searchParams.get("semester");

    if (!email || !nisn) {
      return Response.json(
        { error: "Missing email or nisn in query string" },
        { status: 400 },
      );
    }

    // Create cache key
    const cacheKey = `student:${email}:${nisn}:${semester || "current"}`;

    // Check cache first
    const cachedData = studentCache.get(cacheKey);
    if (cachedData) {
      console.log("[route.ts] Returning cached data for:", email);
      return Response.json({ ...cachedData, _cached: true });
    }

    let googleScriptUrl = `https://script.google.com/macros/s/AKfycbwZ-3w-pZsWwalaevZzfbVa1ukMuxbuXqxCAfKziEQMej49y2z1xQ1h6QH9av3EyiD0/exec?action=getStudentData&email=${email}&nisn=${nisn}`;
    if (semester) {
      googleScriptUrl += `&semester=${semester}`;
    }
    console.log("[route.ts] Fetching from Google Script URL:", googleScriptUrl);

    const response = await fetch(googleScriptUrl, {
      method: "GET",
      redirect: "follow", // PENTING: Google Apps Script butuh 'follow' karena mereka melakukan redirect
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0", // Tetap gunakan agar tidak diblok Google
      },
      cache: "no-store", // Optional: agar data selalu fresh
    });

    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the successful response
    if (data && !data.error) {
      studentCache.set(cacheKey, data);
    }

    return Response.json(data);
  } catch (error) {
    console.error("Fetch error detail:", error);
    return Response.json(
      { error: "Gagal menyabung ke database Google. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
