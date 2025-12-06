// pages/api/energent/run.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // precisamos desabilitar para upload de arquivos
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Parse do arquivo enviado
    const form = formidable({ multiples: false });

    const data: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const file = data.files.file;
    if (!file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    const fileData = fs.readFileSync(file.filepath);

    // Envia o arquivo para o Hugging Face Space
    const response = await fetch(`${process.env.HF_SPACE_URL}/run/predict`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      body: JSON.stringify({
        data: [
          {
            name: file.originalFilename,
            data: Array.from(fileData),
            is_file: true,
          },
        ],
      }),
    });

    const result = await response.json();

    return res.status(200).json({
      job_id: result.hash || result.job_id,
    });
  } catch (error: any) {
    console.error("Erro ao iniciar job:", error);
    return res.status(500).json({ error: "Erro ao iniciar job" });
  }
}
