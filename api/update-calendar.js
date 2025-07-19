async function writeFile(path, contentObj) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  let sha = undefined;

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
    ...(sha ? { sha } : {})  // 只有有 sha 才傳入
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
    const err = await commitRes.text();
    throw new Error(`❌ 寫入 ${path} 失敗: ${err}`);
  }

  return await commitRes.json();
}
