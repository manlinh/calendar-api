// api/update-calendar.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Only POST");

  const { calendar, log } = req.body;
  if (!calendar || !log) {
    return res.status(400).json({ error: "Missing calendar or log" });
  }

  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const token = process.env.GH_TOKEN;

  async function writeFile(path, contentObj) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
    });
    const jsonGet = await getRes.json();
    const sha = jsonGet.sha;

    const base64 = Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64');
    const commitRes = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `token ${token}` },
      body: JSON.stringify({
        message: `Update ${path}`,
        content: base64,
        sha
      })
    });
    if (!commitRes.ok) {
      const err = await commitRes.json();
      throw new Error(`Failed ${path}: ${err.message}`);
    }
    return await commitRes.json();
  }

  try {
    await writeFile('data/calendar.json', calendar);
    await writeFile('data/calendar-log.json', log);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
