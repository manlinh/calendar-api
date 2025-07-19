export default async function handler(req, res) {
  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const token = process.env.GH_TOKEN;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/data/calendar-log.json`;

  const r = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3.raw'
    }
  });

  if (!r.ok) return res.status(r.status).send(await r.text());

  const data = await r.text();
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(data);
}
