// api/read-calendar.js
export default async function handler(req, res) {
  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const token = process.env.GH_TOKEN;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/data/calendar.json`;
  const r = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3.raw'
    }
  });

  if (!r.ok) {
    const errTxt = await r.text();
    console.error("Fetch calendar.json failed:", r.status, errTxt);
    return res.status(r.status).send(errTxt);
  }

  const data = await r.text();
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(data);
}
