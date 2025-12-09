import { GoogleGenAI, File } from '@google/genai';
import busboy from 'busboy';
import { NextApiRequest, NextApiResponse } from 'next';
import { Writable } from 'stream';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.VITE_GEMINI_API_KEY; 
const ai = API_KEY ? new GoogleGenAI(API_KEY) : null;


export const config = {
  api: {
    bodyParser: false,
  },
};

// ... (Função parseMultipartForm permanece IGUAL) ...
function parseMultipartForm(req: NextApiRequest): Promise<{ userPrompt: string, files: { filepath: string, mimeType: string }[] }> {
  // ... (código da função parseMultipartForm mantém-se idêntico ao seu original)
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    const filesInfo: { filepath: string, mimeType: string }[] = [];

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, file, info) => {
      const tempDir = os.tmpdir();
      const filename = path.join(tempDir, info.filename);
      const writeStream = fs.createWriteStream(filename);
      file.pipe(writeStream);
      file.on('end', () => { filesInfo.push({ filepath: filename, mimeType: info.mimeType }); });
    });
    bb.on('close', () => { resolve({ userPrompt: fields.user_prompt || '', files: filesInfo }); });
    bb.on('error', reject);
    req.pipe(bb);
  });
}

// ... (Handler Principal) ...
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');
  if (!ai) return res.status(500).json({ error: 'Chave API não configurada.' });

  let tempFiles: { filepath: string, mimeType: string }[] = [];
  let uploadedGeminiFiles: File[] = [];

  try {
    const { userPrompt, files: receivedFiles } = await parseMultipartForm(req);
    tempFiles = receivedFiles;
    
    if (tempFiles.length === 0) return res.status(400).json({ error: 'Nenhum arquivo anexado.' });
    // Validação extra se o prompt estiver vazio, caso queira forçar
    if (!userPrompt.trim()) return res.status(400).json({ error: 'Prompt do usuário ausente.' });

    console.log(`Processando com prompt do usuário: "${userPrompt.substring(0, 50)}..."`);

    // 2. Upload para o Gemini
    uploadedGeminiFiles = await Promise.all(
      tempFiles.map(fileInfo => ai.files.upload({
        file: fileInfo.filepath,
        mimeType: fileInfo.mimeType,
        displayName: path.basename(fileInfo.filepath),
      }))
    );

    const promptPayload = [
        userPrompt, 
        ...uploadedGeminiFiles,
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest', // Recomendo o 2.0 Flash ou 1.5 Pro para melhor seguimento de instruções
        contents: promptPayload,
    });

    return res.status(200).json({ report: response.text });

  } catch (error: any) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    // Limpeza (Mantida igual)
    if (uploadedGeminiFiles.length > 0) {
        await Promise.all(uploadedGeminiFiles.map(f => ai.files.delete({ name: f.name }).catch(() => {})));
    }
    tempFiles.forEach(f => { if (fs.existsSync(f.filepath)) fs.unlinkSync(f.filepath); });
  }
}