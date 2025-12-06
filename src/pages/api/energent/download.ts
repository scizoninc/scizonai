// pages/api/energent/download.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).json({ error: "URL não fornecida" });

  try {
    const response = await fetch(String(fileUrl), {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");

    return res.send(buffer);
  } catch (error: any) {
    console.error("Erro ao baixar PDF:", error);
    return res.status(500).json({ error: "Erro ao baixar PDF" });
  }
}
