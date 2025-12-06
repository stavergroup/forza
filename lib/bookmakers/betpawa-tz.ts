export async function fetchFromBetpawaTz(code: string): Promise<any> {
  const url = `https://www.betpawa.co.tz/api/sportsbook/v2/booking-number/${encodeURIComponent(
    code
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
      devicetype: "smart_phone",
      "x-pawa-brand": "betpawa-tanzania",
      "x-pawa-language": "en",
      referer: "https://www.betpawa.co.tz/",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`BetPawa responded with status ${res.status}`);
  }

  const data = await res.json();
  return data;
}