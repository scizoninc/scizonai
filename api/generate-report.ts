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

// ----------------------------------------------------------------------
// 2. Parse Multipart (Mantido igual)
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
// 3. Handler Principal (CORRIGIDO)
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');
    if (!ai) return res.status(500).json({ error: 'Chave API não configurada. Verifique GEMINI_API_KEY.' });

    let tempFiles: { filepath: string, mimeType: string, originalName: string }[] = [];
    let uploadedGeminiFiles: GeminiFile[] = [];

    try {
        // 1. Recebe arquivos
        const { userPrompt, files: receivedFiles } = await parseMultipartForm(req);
        tempFiles = receivedFiles;
        
        if (tempFiles.length === 0) return res.status(400).json({ error: 'Nenhum arquivo anexado.' });
        if (!userPrompt.trim()) return res.status(400).json({ error: 'Prompt do usuário ausente.' });

        let textContext = "";
        const filesToUpload: typeof tempFiles = [];

        // 2. Separa Texto vs Binário (Excel entra como Binário agora)
        for (const file of tempFiles) {
            const lowerMime = file.mimeType.toLowerCase();

            // XLSX/XLS -> Upload Binário
            if (lowerMime.includes('spreadsheetml') || lowerMime.includes('excel') || lowerMime.includes('xls')) {
                console.log(`Upload de Excel: ${file.originalName}`);
                filesToUpload.push(file);
            }
            // CSV/JSON/TXT -> Lê o texto e concatena no prompt
            else if (
                lowerMime.includes('csv') || lowerMime.includes('json') || 
                lowerMime.includes('text/') || lowerMime.includes('xml')
            ) {
                console.log(`Lendo texto: ${file.originalName}`);
                const content = fs.readFileSync(file.filepath, 'utf-8');
                textContext += `\n\n--- ARQUIVO DE TEXTO: ${file.originalName} ---\n${content}\n-----------------------------------\n`;
            } 
            // PDF/Imagem -> Upload Binário
            else {
                console.log(`Upload de binário: ${file.originalName}`);
                filesToUpload.push(file);
            }
        }

        // 3. Upload para o Google (Files API)
        if (filesToUpload.length > 0) {
            uploadedGeminiFiles = await Promise.all(
              filesToUpload.map(fileInfo => ai!.files.upload({
                file: fileInfo.filepath,
                mimeType: fileInfo.mimeType,
                displayName: fileInfo.originalName,
              }))
            );
        }

        // 4. Montagem do Payload (AQUI ESTAVA O ERRO, AGORA CORRIGIDO)
        const finalPrompt = userPrompt + (textContext ? `\n\nCONTEXTO DE TEXTO EXTRAÍDO:\n${textContext}` : "");

        // 🟢 CORREÇÃO: Usar 'fileData' com 'fileUri', NÃO 'inlineData'
        const fileParts = uploadedGeminiFiles.map(file => ({
            fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri // Usamos a URI retornada pelo upload
            }
        }));

        const promptPayload = [
            { text: finalPrompt },
            ...fileParts,
        ];

        // 5. Chamada à API (Gerar Conteúdo)
        const response = await ai!.models.generateContent({
          model: 'gemini-2.5-flash', 
          contents: promptPayload as any,
        });

        return res.status(200).json({ report: response.text() });

    } catch (error: any) {
        console.error('Erro detalhado:', JSON.stringify(error, null, 2));
        
        if (error.status === 503 || (error.message && error.message.includes('overloaded'))) {
             return res.status(503).json({ error: 'O modelo Gemini está sobrecarregado. Tente novamente.' });
        }
        
        // Tratamento para erro de MIME type inválido
        if (error.message && error.message.includes('MIME type')) {
            return res.status(400).json({ error: 'Erro de formato: O arquivo enviado não é suportado pelo Gemini.' });
        }

        return res.status(400).json({ error: error.message || 'Erro no processamento.' });

    } finally {
        // 6. Limpeza
        if (uploadedGeminiFiles.length > 0) {
            // Não bloqueia a resposta, mas limpa em background
            Promise.all(
              uploadedGeminiFiles.map(f => ai!.files.delete({ name: f.name }).catch(e => console.error('Erro delete Gemini:', e)))
            );
        }
        tempFiles.forEach(f => { 
          if (fs.existsSync(f.filepath)) fs.unlinkSync(f.filepath);
        });
    }
}