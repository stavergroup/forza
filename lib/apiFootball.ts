const API_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
const API_HOST =
  process.env.NEXT_PUBLIC_API_FOOTBALL_HOST || "v3.football.api-sports.io";

if (!API_KEY) {
  console.warn(
    "[FORZA] Missing API key in .env.local → NEXT_PUBLIC_API_FOOTBALL_KEY."
  );
}

type FetchOptions = {
  path: string;
  searchParams?: Record<string, string | number | undefined>;
};

export async function fetchFromApiFootball<T>({
  path,
  searchParams,
}: FetchOptions): Promise<T> {
  if (!API_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_FOOTBALL_KEY in .env.local (API-FOOTBALL)."
    );
  }

  const query = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }

  const url = `https://${API_HOST}${path}${
    query.toString() ? "?" + query.toString() : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": API_KEY,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[FORZA] API request failed:", res.status, text);
    throw new Error(`API-FOOTBALL error ${res.status}`);
  }

  return res.json();
}