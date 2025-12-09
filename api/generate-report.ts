// src/pages/api/generate-report.ts

import { GoogleGenAI, File as GeminiFile } from '@google/genai';
import busboy from 'busboy';
import { NextApiRequest, NextApiResponse } from 'next';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// ----------------------------------------------------------------------
// 1. Configuração da API e Chave
// ----------------------------------------------------------------------

// Variável de ambiente GEMINI_API_KEY (Correta para segredos no Next.js Serverless)
const API_KEY = process.env.GEMINI_API_KEY; 
const ai = API_KEY ? new GoogleGenAI(API_KEY) : null;

// Desabilita o parser de body padrão do Next.js para lidar com FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

// ----------------------------------------------------------------------
// 2. Função de Parsing de Multipart (busboy)
// ----------------------------------------------------------------------

/**
 * Analisa a requisição multipart/form-data, salvando arquivos temporariamente.
 * Retorna o prompt do usuário e os caminhos dos arquivos temporários.
 */
function parseMultipartForm(req: NextApiRequest): Promise<{ userPrompt: string, files: { filepath: string, mimeType: string }[] }> {
    return new Promise((resolve, reject) => {
        const bb = busboy({ headers: req.headers });
        const fields: Record<string, string> = {};
        const filesInfo: { filepath: string, mimeType: string }[] = [];
        
        let filesBeingProcessed = 0; // Contador de arquivos

        bb.on('field', (name, val) => { fields[name] = val; });

        bb.on('file', (name, file, info) => {
            filesBeingProcessed++; // Um novo arquivo sendo processado
            const tempDir = os.tmpdir();
            const filename = path.join(tempDir, `${Date.now()}-${info.filename}`); 
            const writeStream = fs.createWriteStream(filename);
            
            file.pipe(writeStream);

            writeStream.on('finish', () => {
                filesInfo.push({ filepath: filename, mimeType: info.mimeType });
                filesBeingProcessed--; // Arquivo terminado
                if (filesBeingProcessed === 0 && bb.writableEnded) {
                     // Resolve se todos os arquivos terminaram E o busboy terminou
                    resolve({ userPrompt: fields.user_prompt || '', files: filesInfo });
                }
            });

            writeStream.on('error', reject);
            file.on('error', reject);
        });
        
        // Se o busboy fechar e nenhum arquivo estiver sendo processado, resolve.
        bb.on('finish', () => {
            if (filesBeingProcessed === 0) {
                resolve({ userPrompt: fields.user_prompt || '', files: filesInfo });
            }
        });

        bb.on('error', reject);
        req.pipe(bb);
    });
}
// ----------------------------------------------------------------------
// 3. Handler Principal (Lógica Gemini)
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');
  if (!ai) return res.status(500).json({ error: 'Chave API não configurada. Verifique GEMINI_API_KEY.' });

  let tempFiles: { filepath: string, mimeType: string }[] = [];
  let uploadedGeminiFiles: GeminiFile[] = [];

  try {
    // 1. Parse do FormData e salvamento temporário dos arquivos
    const { userPrompt, files: receivedFiles } = await parseMultipartForm(req);
    tempFiles = receivedFiles;
    
    if (tempFiles.length === 0) return res.status(400).json({ error: 'Nenhum arquivo anexado.' });
    if (!userPrompt.trim()) return res.status(400).json({ error: 'Prompt do usuário ausente.' });

    console.log(`Processando ${tempFiles.length} arquivos com prompt: "${userPrompt.substring(0, 50)}..."`);

    // 2. Upload para o Gemini File API
    uploadedGeminiFiles = await Promise.all(
      tempFiles.map(fileInfo => ai!.files.upload({
        file: fileInfo.filepath,
        mimeType: fileInfo.mimeType,
        displayName: path.basename(fileInfo.filepath),
      }))
    );

    // 3. Montagem e Geração de Conteúdo
    const promptPayload = [
        userPrompt, 
        ...uploadedGeminiFiles,
    ];

    const response = await ai!.models.generateContent({
        model: 'gemini-2.5-flash', // Modelo mais rápido e multimodal
        contents: promptPayload,
    });

    // 4. Retorno do Relatório
    return res.status(200).json({ report: response.text });

  } catch (error: any) {
    console.error('Erro na geração de conteúdo:', error);
    // Garante que o frontend receba um erro formatado em JSON
    return res.status(500).json({ error: error.message || 'Erro interno do servidor ao processar o relatório.' });
  } finally {
    // 5. Limpeza de Recursos (Crucial)
    
    // Deleta os arquivos no Gemini File API
    if (uploadedGeminiFiles.length > 0) {
        await Promise.all(
          uploadedGeminiFiles.map(f => ai!.files.delete({ name: f.name }).catch(err => console.error('Falha ao deletar arquivo Gemini:', err)))
        );
    }
    
    // Deleta os arquivos temporários no disco (os.tmpdir)
    tempFiles.forEach(f => { 
      if (fs.existsSync(f.filepath)) { 
        fs.unlinkSync(f.filepath);
      } 
    });
  }
}