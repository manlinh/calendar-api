export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");
  // ...
}
