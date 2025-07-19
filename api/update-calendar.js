export default async function handler(req, res) {
  // 允许跨域调用（CORS）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).send('Only POST');
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error('解析 body 失败', e);
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
    console.error('缺少环境变量', { owner, repo, tokenDefined: !!token });
    return res.status(500).json({ error: 'Server config error' });
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
      console.error('GET 错误', path, getRes.status, err);
      throw new Error(`读取 ${path} 失败`);
    }

    const base64 = Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64');
    const payload = { message: `Update ${path}`, content: base64, ...(sha ? { sha } : {}) };

    const commitRes = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!commitRes.ok) {
      const err = await commitRes.text();
      console.error('PUT 错误', path, commitRes.status, err);
      throw new Error(`写入 ${path} 失败`);
    }
    return commitRes.json();
  }

  try {
    await writeFile('data/calendar.json', calendar);
    await writeFile('data/calendar-log.json', log);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Exception in handler:', e);
    return res.status(500).json({ error: e.message });
  }
}
