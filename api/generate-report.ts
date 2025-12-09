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

const API_KEY = process.env.GEMINI_API_KEY; 
const ai = API_KEY ? new GoogleGenAI(API_KEY) : null;

export const config = {
  api: {
    bodyParser: false,
  },
};

// ----------------------------------------------------------------------
// 2. Função de Parsing de Multipart (busboy)
// ----------------------------------------------------------------------

function parseMultipartForm(req: NextApiRequest): Promise<{ userPrompt: string, files: { filepath: string, mimeType: string, originalName: string }[] }> {
    return new Promise((resolve, reject) => {
        const bb = busboy({ headers: req.headers });
        const fields: Record<string, string> = {};
        const filesInfo: { filepath: string, mimeType: string, originalName: string }[] = [];
        
        let filesBeingProcessed = 0;

        bb.on('field', (name, val) => { fields[name] = val; });

        bb.on('file', (name, file, info) => {
            filesBeingProcessed++; 
            const tempDir = os.tmpdir();
            // Sanitiza o nome para evitar erros de caracteres
            const safeName = path.basename(info.filename).replace(/[^a-zA-Z0-9.-]/g, '_');
            const filename = path.join(tempDir, `${Date.now()}-${safeName}`); 
            const writeStream = fs.createWriteStream(filename);
            
            file.pipe(writeStream);

            writeStream.on('finish', () => {
                filesInfo.push({ 
                    filepath: filename, 
                    mimeType: info.mimeType,
                    originalName: info.filename 
                });
                filesBeingProcessed--; 
                if (filesBeingProcessed === 0 && (bb as any).writableEnded) {
                    resolve({ userPrompt: fields.user_prompt || '', files: filesInfo });
                }
            });

            writeStream.on('error', reject);
            file.on('error', reject);
        });
        
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
// 3. Handler Principal
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');
  if (!ai) return res.status(500).json({ error: 'Chave API não configurada. Verifique GEMINI_API_KEY.' });

  let tempFiles: { filepath: string, mimeType: string, originalName: string }[] = [];
  let uploadedGeminiFiles: GeminiFile[] = [];

  try {
    // 1. Parse do FormData
    const { userPrompt, files: receivedFiles } = await parseMultipartForm(req);
    tempFiles = receivedFiles;
    
    if (tempFiles.length === 0) return res.status(400).json({ error: 'Nenhum arquivo anexado.' });
    if (!userPrompt.trim()) return res.status(400).json({ error: 'Prompt do usuário ausente.' });

    console.log(`Recebidos ${tempFiles.length} arquivos. Processando tipos...`);

    // 2. Separação de Estratégia: Texto vs Binário (Upload)
    let textContext = "";
    const filesToUpload: typeof tempFiles = [];

    for (const file of tempFiles) {
        const lowerMime = file.mimeType.toLowerCase();

        // ❌ BLOQUEIO EXPLÍCITO DE EXCEL (O modelo não lê binário XLS, precisa ser CSV/PDF)
        if (lowerMime.includes('spreadsheetml') || lowerMime.includes('excel') || lowerMime.includes('xls')) {
            throw new Error(`O formato Excel (.xlsx/.xls) não é suportado diretamente. Salve como CSV (.csv) ou PDF.`);
        }

        // 📄 ARQUIVOS DE TEXTO (CSV, JSON, TXT, CODE) -> Lemos e adicionamos ao prompt
        if (
            lowerMime.includes('csv') || 
            lowerMime.includes('json') || 
            lowerMime.includes('text/') ||
            lowerMime.includes('xml') ||
            lowerMime.includes('javascript') ||
            lowerMime.includes('typescript')
        ) {
            console.log(`Lendo arquivo de texto: ${file.originalName}`);
            const content = fs.readFileSync(file.filepath, 'utf-8');
            textContext += `\n\n--- Conteúdo do Arquivo: ${file.originalName} ---\n${content}\n-----------------------------------\n`;
        } 
        // 🖼️ ARQUIVOS DE MÍDIA/PDF -> Fazemos Upload via File API
        else {
            console.log(`Preparando upload de binário: ${file.originalName} (${file.mimeType})`);
            filesToUpload.push(file);
        }
    }

    // 3. Upload apenas dos arquivos suportados (PDF, Imagem, Audio)
    if (filesToUpload.length > 0) {
        uploadedGeminiFiles = await Promise.all(
          filesToUpload.map(fileInfo => ai!.files.upload({
            file: fileInfo.filepath,
            mimeType: fileInfo.mimeType,
            displayName: fileInfo.originalName,
          }))
        );
    }

    // 4. Montagem do Payload
    const finalPrompt = userPrompt + (textContext ? `\n\nCONTEXTO DE DADOS ADICIONAL:\n${textContext}` : "");

    // Cria as referências para os arquivos que sofreram upload
    const fileParts = uploadedGeminiFiles.map(file => ({
        fileData: {
            mimeType: file.mimeType, 
            fileUri: file.name,
        },
    }));

    const promptPayload = [
        { text: finalPrompt },
        ...fileParts,
    ];

    // 5. Chamada à API (USANDO MODELO ESTÁVEL)
    // 'gemini-1.5-flash' é rápido, barato e estável. Evita o erro 503 de modelos experimentais.
    const response = await ai!.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: promptPayload as any,
    });

    return res.status(200).json({ report: response.text });

  } catch (error: any) {
    console.error('Erro na geração:', error);
    // Se o erro for 503, avisa o usuário para tentar de novo
    if (error.status === 503 || error.code === 503) {
         return res.status(503).json({ error: 'O modelo de IA está sobrecarregado no momento. Por favor, aguarde alguns segundos e tente novamente.' });
    }
    return res.status(400).json({ error: error.message || 'Erro no processamento.' });
  } finally {
    // 6. Limpeza
    if (uploadedGeminiFiles.length > 0) {
        await Promise.all(
          uploadedGeminiFiles.map(f => ai!.files.delete({ name: f.name }).catch(e => console.error('Erro ao deletar:', e)))
        );
    }
    tempFiles.forEach(f => { 
      if (fs.existsSync(f.filepath)) fs.unlinkSync(f.filepath);
    });
  }
}