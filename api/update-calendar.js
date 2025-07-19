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
    let sha;

    // 嘗試抓取現有檔案 SHA
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
    });

    if (getRes.ok) {
      const json = await getRes.json();
      sha = json.sha;
    }

    const base64 = Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64');
    const body = {
      message: `Update ${path}`,
      content: base64,
      ...(sha ? { sha } : {})  // 有 sha 才加進去
    };

    const commitRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      console.error(`❌ 寫入 ${path} 失敗：`, errText);
      throw new Error(`寫入 ${path} 失敗：${commitRes.status}`);
    }

    return await commitRes.json();
  }

  try {
    await writeFile('data/calendar.json', calendar);
    await writeFile('data/calendar-log.json', log);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("❌ 伺服器錯誤：", e.message);
    return res.status(500).json({ error: e.message });
  }
}
