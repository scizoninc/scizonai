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
// (Lógica de sincronização aprimorada)
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
        
        let filesBeingProcessed = 0; // Contador de arquivos para garantir sincronização

        bb.on('field', (name, val) => { fields[name] = val; });

        bb.on('file', (name, file, info) => {
            filesBeingProcessed++; 
            const tempDir = os.tmpdir();
            const filename = path.join(tempDir, `${Date.now()}-${info.filename}`); 
            const writeStream = fs.createWriteStream(filename);
            
            file.pipe(writeStream);

            writeStream.on('finish', () => {
                filesInfo.push({ filepath: filename, mimeType: info.mimeType });
                filesBeingProcessed--; 
                // Se todos os arquivos terminaram E o busboy também (bb.writableEnded), resolve.
                if (filesBeingProcessed === 0 && (bb as any).writableEnded) { // Asserção de tipo para writableEnded
                    resolve({ userPrompt: fields.user_prompt || '', files: filesInfo });
                }
            });

            writeStream.on('error', reject);
            file.on('error', reject);
        });
        
        // Garante que a Promise resolva se não houver arquivos, ou após o último arquivo.
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

    // 3. Montagem do Payload (CORREÇÃO FINAL para o erro INVALID_ARGUMENT)
    // Mapeia os objetos File do upload para o formato de referência fileUri esperado no contents.
    const fileParts = uploadedGeminiFiles.map(file => ({
        fileData: {
            mimeType: file.mimeType, 
            fileUri: file.name,      // O 'name' é o ID de referência do arquivo no Gemini
        },
    }));

    // Concatena o prompt de texto com as referências dos arquivos
    const promptPayload = [
        { text: userPrompt }, // O prompt como uma parte de texto
        ...fileParts,         // As referências de arquivo
    ];

    // Chamada final à API
    const response = await ai!.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptPayload as any, // 'as any' para forçar o TS aceitar a estrutura mista customizada
    });

    // 4. Retorno do Relatório
    return res.status(200).json({ report: response.text });

  } catch (error: any) {
    console.error('Erro na geração de conteúdo:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor ao processar o relatório.' });
  } finally {
    // 5. Limpeza de Recursos (Crucial para evitar custos e vazamento de disco)
    
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