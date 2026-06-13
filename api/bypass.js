const API = "https://trw.lat/api/bypass";
const API_KEY = "TRW_FREE-GAY-15a92945-9b04-4c75-8337-f2a6007281e9";

function parseResult(result) {
  if (typeof result !== "string") return result;

  const tupleMatch = result.match(/^\(['"](.+?)['"],\s*(True|False)\)$/);
  if (tupleMatch) return tupleMatch[1];

  const quoteMatch = result.match(/^["'](.+?)["']$/);
  if (quoteMatch) return quoteMatch[1];

  return result;
}

function getTargetUrl(req) {
  if (req.method === "GET") return req.query?.url;
  return req.body?.url;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({
      Status: false,
      Code: 405,
      Input: null,
      Result_url: null,
      Error: "Method not allowed"
    });
  }

  const targetUrl = getTargetUrl(req);

  if (!targetUrl || typeof targetUrl !== "string" || !targetUrl.startsWith("http")) {
    return res.status(400).json({
      Status: false,
      Code: 400,
      Input: targetUrl || null,
      Result_url: null,
      Error: "Valid target URL is required"
    });
  }

  try {
    const apiUrl = new URL(API);
    apiUrl.searchParams.set("apikey", API_KEY);
    apiUrl.searchParams.set("url", targetUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "*/*",
        origin: "https://bypassunlock.com",
        referer: "https://bypassunlock.com/",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
        "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "accept-language": "id-ID,id;q=0.9",
        priority: "u=1, i"
      }
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(response.status || 502).json({
        Status: false,
        Code: response.status || 502,
        Input: targetUrl,
        Result_url: null,
        Error: text || response.statusText || "Invalid upstream response"
      });
    }

    if (!response.ok || !data.success || !data.result) {
      return res.status(response.status || 502).json({
        Status: false,
        Code: response.status || 502,
        Input: targetUrl,
        Result_url: null,
        Error: data.message || data.error || "Bypass failed",
        Raw: data
      });
    }

    return res.status(200).json({
      Status: true,
      Code: response.status,
      Input: targetUrl,
      Result_url: parseResult(data.result)
    });
  } catch (error) {
    return res.status(500).json({
      Status: false,
      Code: 500,
      Input: targetUrl,
      Result_url: null,
      Error: error.message || "Internal server error"
    });
  }
}
