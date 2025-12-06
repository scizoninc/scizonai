// pages/api/energent/status.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "id é obrigatório" });

  try {
    const response = await fetch(`${process.env.HF_SPACE_URL}/queue/status/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
    });

    const status = await response.json();

    return res.status(200).json(status);
  } catch (error: any) {
    console.error("Erro ao consultar status:", error);
    return res.status(500).json({ error: "Erro ao consultar status" });
  }
}
