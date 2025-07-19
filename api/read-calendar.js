export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).send("Only GET");

  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const token = process.env.GH_TOKEN;

  const fileUrl = path =>
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  async function readFile(path) {
    const res = await fetch(fileUrl(path), {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });
    if (!res.ok) throw new Error(`Fetch ${path} failed`);
    return await res.json();
  }

  try {
    const [calendar, log] = await Promise.all([
      readFile("data/calendar.json"),
      readFile("data/calendar-log.json")
    ]);
    res.status(200).json({ calendar, log });
  } catch (e) {
    console.error("❌ read-calendar failed:", e);
    res.status(500).json({ error: "讀取失敗" });
  }
}
