export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).send("Only POST");

  const { calendar, log } = req.body;
  if (!calendar || !log) return res.status(400).json({ error: "Missing data" });

  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const token = process.env.GH_TOKEN;

  async function writeFile(path, data) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    let sha;

    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (getRes.ok) {
      const json = await getRes.json();
      sha = json.sha;
    }

    const payload = {
      message: `Update ${path}`,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
      ...(sha && { sha })
    };

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!putRes.ok) {
      const error = await putRes.text();
      throw new Error(`Failed to write ${path}: ${error}`);
    }
  }

  try {
    await writeFile("data/calendar.json", calendar);
    await writeFile("data/calendar-log.json", log);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("❌ update-calendar failed:", e);
    res.status(500).json({ error: e.message });
  }
}
