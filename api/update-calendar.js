export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Only POST');

  // ✅ 修改這段 ↓↓↓
  let body = '';
  try {
    body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(JSON.parse(data)));
      req.on('error', reject);
    });
  } catch (e) {
    console.error('❌ 無法解析 JSON：', e);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { calendar, log } = body;
  if (!calendar || !log) {
    return res.status(400).json({ error: 'Missing calendar or log' });
  }

  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const token = process.env.GH_TOKEN;

  if (!owner || !repo || !token) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  async function writeFile(path, contentObj) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    let sha;

    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (getRes.ok) {
      const js = await getRes.json();
      sha = js.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.text();
      console.error('GET 失敗:', err);
      throw new Error(`讀取 ${path} 失敗`);
    }

    const base64 = Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64');
    const payload = { message: `Update ${path}`, content: base64, ...(sha ? { sha } : {}) };

    const commitRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!commitRes.ok) {
      const err = await commitRes.text();
      console.error('PUT 失敗:', err);
      throw new Error(`寫入 ${path} 失敗`);
    }

    return commitRes.json();
  }

  try {
    await writeFile('data/calendar.json', calendar);
    await writeFile('data/calendar-log.json', log);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('處理時發生錯誤:', e);
    return res.status(500).json({ error: e.message });
  }
}
