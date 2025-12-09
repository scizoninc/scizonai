// pages/api/generate-report.ts

import { GoogleGenAI, File } from '@google/genai';
import busboy from 'busboy';
import { NextApiRequest, NextApiResponse } from 'next';
import { Writable } from 'stream';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// ⚠️ A CHAVE API é lida do ambiente do Vercel, NUNCA exposta ao Front-end.
const API_KEY = process.env.VITE_GEMINI_API_KEY; 
const ai = API_KEY ? new GoogleGenAI(API_KEY) : null;

// PROMPT_TEXT: Mantenha-o como uma string Multi-linhas para o prompt de instrução
// (Para simplificar, estou usando um placeholder, mas use o texto COMPLETO do seu script Python aqui)
const PROMPT_TEXT = `
Transforme o PDF/PNG/JPEG em tabela Markdown (para copiar no Excel), usando a ordem EXATA de colunas: Empresa, Data, Data Início, Data Fim, Campanha, Categoria do Produto, Produto, Medida, Quantidade, Preço, App, Loja, Cidade, Estado.
... [INSIRA O TEXTO COMPLETO DO SEU PROMPT PYTHON AQUI, incluindo todas as REGRAS OBRIGATÓRIAS] ...
`;

// Configuração para lidar com uploads de arquivos grandes
export const config = {
  api: {
    bodyParser: false, // Desabilita o body parser padrão para lidar com uploads de arquivo
  },
};

/**
 * Função utilitária para receber e salvar o arquivo temporariamente.
 * Retorna o caminho temporário do arquivo e o prompt do usuário.
 */
function parseMultipartForm(req: NextApiRequest): Promise<{ userPrompt: string, files: { filepath: string, mimeType: string }[] }> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    const filesInfo: { filepath: string, mimeType: string }[] = [];

    // Lida com campos de texto (como 'user_prompt')
    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    // Lida com arquivos
    bb.on('file', (name, file, info) => {
      const tempDir = os.tmpdir();
      const filename = path.join(tempDir, info.filename);
      const writeStream = fs.createWriteStream(filename);

      file.pipe(writeStream);

      file.on('end', () => {
        filesInfo.push({ filepath: filename, mimeType: info.mimeType });
      });

      writeStream.on('error', (err) => {
        console.error('Erro ao salvar arquivo temporário:', err);
        file.resume(); // Continua para evitar pendência
      });
    });

    bb.on('close', () => {
      resolve({
        userPrompt: fields.user_prompt || '',
        files: filesInfo,
      });
    });

    bb.on('error', reject);
    req.pipe(bb);
  });
}

/**
 * Função principal para processar a requisição com o Gemini.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  if (!ai) {
    return res.status(500).json({ error: 'Chave API do Gemini não configurada no servidor (VITE_GEMINI_API_KEY).' });
  }

  let tempFiles: { filepath: string, mimeType: string }[] = [];
  let uploadedGeminiFiles: File[] = [];

  try {
    // 1. Recebe o arquivo e o prompt do Front-end
    const { userPrompt, files: receivedFiles } = await parseMultipartForm(req);
    tempFiles = receivedFiles;
    
    if (tempFiles.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo de mídia anexado para análise.' });
    }

    console.log(`Recebidos ${tempFiles.length} arquivos para o prompt: ${userPrompt}`);

    // 2. Upload para a API do Gemini
    console.log('Iniciando upload para o servidor Gemini...');
    uploadedGeminiFiles = await Promise.all(
      tempFiles.map(fileInfo => ai.files.upload({
        file: fileInfo.filepath,
        mimeType: fileInfo.mimeType,
        displayName: path.basename(fileInfo.filepath), // Nome do arquivo no Gemini
      }))
    );
    console.log(`Upload concluído. Arquivos Gemini IDs: ${uploadedGeminiFiles.map(f => f.name).join(', ')}`);
    
    // 3. Constrói o Payload e Chama o Gemini
    // O payload inclui: Prompt do usuário + Prompt de regras + Arquivos
    const promptPayload = [
        `O usuário solicita: ${userPrompt}.`,
        PROMPT_TEXT,
        ...uploadedGeminiFiles,
    ];

    console.log('Enviando conteúdo para o modelo...');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Modelo multimodal para arquivos
        contents: promptPayload,
    });

    // 4. Retorna a resposta real do Gemini
    return res.status(200).json({ report: response.text });

  } catch (error) {
    console.error('Erro na API Gemini ou no processamento:', error);
    return res.status(500).json({ error: `Erro ao processar solicitação: ${error.message || 'Erro desconhecido.'}` });
  } finally {
    // 5. LIMPEZA CRÍTICA: Deletar arquivos temporários e do servidor Gemini
    
    // Deleta arquivos do servidor Gemini
    if (uploadedGeminiFiles.length > 0) {
        console.log('Limpando arquivos no servidor Gemini...');
        await Promise.all(uploadedGeminiFiles.map(file => {
            try {
                return ai.files.delete({ name: file.name });
            } catch (e) {
                console.warn(`Falha ao deletar arquivo Gemini ${file.name}: ${e.message}`);
                return Promise.resolve(); // Não impede o restante da limpeza
            }
        }));
    }

    // Deleta arquivos temporários locais
    if (tempFiles.length > 0) {
        console.log('Limpando arquivos temporários locais...');
        tempFiles.forEach(fileInfo => {
            try {
                if (fs.existsSync(fileInfo.filepath)) {
                    fs.unlinkSync(fileInfo.filepath);
                }
            } catch (e) {
                console.warn(`Falha ao deletar arquivo local ${fileInfo.filepath}: ${e.message}`);
            }
        });
    }
  }
}