export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).send("Only GET");

  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const token = process.env.GH_TOKEN;

  async function readFile(path) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const r = await fetch(url, {
      headers: { Authorization: `token ${token}` }
    });
    if (!r.ok) throw new Error(`Fail ${path}: ${r.status}`);
    const j = await r.json();
    const decoded = Buffer.from(j.content, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }

  try {
    const calendar = await readFile("data/calendar.json");
    const log = await readFile("data/calendar-log.json");
    return res.status(200).json({ calendar, log });
  } catch (e) {
    console.error("❌ Error in read-calendar:", e);
    return res.status(500).json({ error: e.message });
  }
}
