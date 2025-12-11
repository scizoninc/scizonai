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

export const config = { api: { bodyParser: false } };
// ... [ parseMultipartForm permanece INALTERADO ] ...
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
            // Sanitiza o nome do arquivo
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
        const { userPrompt, files: receivedFiles } = await parseMultipartForm(req);
        tempFiles = receivedFiles;
        
        if (tempFiles.length === 0) return res.status(400).json({ error: 'Nenhum arquivo anexado.' });
        if (!userPrompt.trim()) return res.status(400).json({ error: 'Prompt do usuário ausente.' });

        let textContext = "";
        const filesToUpload: typeof tempFiles = [];

        for (const file of tempFiles) {
            const lowerMime = file.mimeType.toLowerCase();

            // 🟢 TRATAMENTO XLSX/XLS: Deve ser enviado via Upload de Arquivo
            if (lowerMime.includes('spreadsheetml') || lowerMime.includes('excel') || lowerMime.includes('xls')) {
                console.log(`Preparando upload de arquivo Excel: ${file.originalName}`);
                // Adiciona o arquivo Excel para upload binário.
                filesToUpload.push(file);
            }
            // Arquivos de texto que lemos localmente e passamos no prompt
            else if (
                lowerMime.includes('csv') || lowerMime.includes('json') || 
                lowerMime.includes('text/') || lowerMime.includes('xml')
            ) {
                console.log(`Lendo arquivo de texto: ${file.originalName}`);
                const content = fs.readFileSync(file.filepath, 'utf-8');
                textContext += `\n\n--- DADOS DO ARQUIVO: ${file.originalName} ---\n${content}\n-----------------------------------\n`;
            } 
            // Outras mídias (PDF, Imagem)
            else {
                console.log(`Preparando upload de binário: ${file.originalName} (${file.mimeType})`);
                filesToUpload.push(file);
            }
        }

        // 3. Upload apenas dos arquivos binários suportados (incluindo XLSX/XLS)
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
        const finalPrompt = userPrompt + (textContext ? `\n\nCONTEXTO DE DADOS EXTRAÍDOS:\n${textContext}` : "");

        // O payload deve incluir o objeto File do Gemini
        const fileParts = uploadedGeminiFiles.map(file => file); // A API espera o objeto File completo
        
        const promptPayload = [
            finalPrompt,
            ...fileParts,
        ];

        // 5. Chamada à API
        const response = await ai!.models.generateContent({
          model: 'gemini-1.5-flash', // Usando 1.5-flash que tem suporte comprovado a mais formatos.
          contents: promptPayload as any,
        });

        return res.status(200).json({ report: response.text });

    } catch (error: any) {
        console.error('Erro na geração:', error);
        
        if (error.status === 503 || error.code === 503 || (error.message && error.message.includes('overloaded'))) {
             return res.status(503).json({ error: 'O modelo Gemini está sobrecarregado. Tente novamente em instantes.' });
        }

        // Captura o erro da API e exibe uma mensagem mais amigável
        const friendlyError = error.message.includes('Unsupported MIME type') 
            ? `Erro de Formato: O arquivo XLSX/PDF/Imagem enviado não é suportado pelo Gemini ou a versão do modelo (gemini-1.5-flash) não o reconheceu. Tente converter o arquivo para PDF ou CSV.`
            : error.message || 'Erro no processamento.';
            
        return res.status(400).json({ error: friendlyError });

    } finally {
        // 6. Limpeza (Crucial em Serverless)
        if (uploadedGeminiFiles.length > 0) {
            Promise.all(
              uploadedGeminiFiles.map(f => ai!.files.delete({ name: f.name }).catch(e => console.error('Erro ao deletar arquivo Gemini:', e)))
            );
        }
        tempFiles.forEach(f => { 
          if (fs.existsSync(f.filepath)) fs.unlinkSync(f.filepath);
        });
    }
}