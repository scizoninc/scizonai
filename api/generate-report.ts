import { GoogleGenAI, File as GeminiFile } from '@google/genai';
import busboy from 'busboy';
import { NextApiRequest, NextApiResponse } from 'next';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx'; // 💡 Importação da biblioteca XLSX

// ----------------------------------------------------------------------
// 1. Configuração da API e Chave
// ----------------------------------------------------------------------
const API_KEY = process.env.GEMINI_API_KEY; 
const ai = API_KEY ? new GoogleGenAI(API_KEY) : null;

export const config = { api: { bodyParser: false } };

// ... [ Função parseMultipartForm permanece INALTERADA ] ...
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
// 3. Handler Principal (CORRIGIDO PARA JSON)
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');
    if (!ai) return res.status(500).json({ error: 'Chave API não configurada.' });

    let tempFiles: { filepath: string, mimeType: string, originalName: string }[] = [];
    let uploadedGeminiFiles: GeminiFile[] = [];
    let textContext = "";
    
    try {
        const { userPrompt, files: receivedFiles } = await parseMultipartForm(req);
        tempFiles = receivedFiles;
        
        if (tempFiles.length === 0) return res.status(400).json({ error: 'Nenhum arquivo anexado.' });
        if (!userPrompt.trim()) return res.status(400).json({ error: 'Prompt do usuário ausente.' });

        const filesToUpload: typeof tempFiles = [];

        // 2. Lógica Inteligente: Converte XLSX/Lê Texto/Prepara Upload Binário
        for (const file of tempFiles) {
            const lowerMime = file.mimeType.toLowerCase();
            const filenameExt = path.extname(file.originalName).toLowerCase();

            // 🟢 TRATAMENTO XLSX/XLS: LER E CONVERTER PARA JSON
            if (lowerMime.includes('spreadsheetml') || lowerMime.includes('excel') || lowerMime.includes('xls')) {
                console.log(`Convertendo Excel para JSON: ${file.originalName}`);
                
                try {
                    const workbook = XLSX.readFile(file.filepath);
                    const sheetName = workbook.SheetNames[0]; // Pega a primeira aba
                    const jsonContent = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                    // Adiciona o JSON ao contexto de texto do prompt
                    textContext += `\n\n--- DADOS DA PLANILHA ${file.originalName} (JSON) ---\n${JSON.stringify(jsonContent, null, 2)}\n-----------------------------------\n`;
                } catch (e) {
                    console.error('Erro ao processar XLSX:', e);
                    throw new Error(`Não foi possível ler o arquivo Excel (${file.originalName}). Verifique o formato.`);
                }
            }
            // Arquivos de texto que lemos localmente
            else if (
                lowerMime.includes('csv') || lowerMime.includes('json') || 
                lowerMime.includes('text/') || lowerMime.includes('xml')
            ) {
                console.log(`Lendo arquivo de texto: ${file.originalName}`);
                const content = fs.readFileSync(file.filepath, 'utf-8');
                textContext += `\n\n--- ARQUIVO DE TEXTO: ${file.originalName} ---\n${content}\n-----------------------------------\n`;
            } 
            // PDF/Imagem (Mídia) -> Upload Binário
            else {
                console.log(`Preparando upload de binário (Mídia): ${file.originalName}`);
                filesToUpload.push(file);
            }
        }

        // 3. Upload para o Google (Files API) - Apenas para Mídia
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

        // Referência dos arquivos upados (PDFs, Imagens)
        const fileParts = uploadedGeminiFiles.map(file => ({
            fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri
            }
        }));

        const promptPayload = [
            { text: finalPrompt },
            ...fileParts,
        ];

        // 5. Chamada à API
        const response = await ai!.models.generateContent({
          model: 'gemini-1.5-flash', 
          contents: promptPayload as any,
        });

        return res.status(200).json({ report: response.text() });

    } catch (error: any) {
        console.error('Erro detalhado:', JSON.stringify(error, null, 2));
        
        if (error.status === 503 || (error.message && error.message.includes('overloaded'))) {
             return res.status(503).json({ error: 'O modelo Gemini está sobrecarregado. Tente novamente.' });
        }
        
        return res.status(400).json({ error: error.message || 'Erro no processamento.' });

    } finally {
        // 6. Limpeza (Crucial em Serverless)
        if (uploadedGeminiFiles.length > 0) {
            Promise.all(
              uploadedGeminiFiles.map(f => ai!.files.delete({ name: f.name }).catch(e => console.error('Erro delete Gemini:', e)))
            );
        }
        tempFiles.forEach(f => { 
          if (fs.existsSync(f.filepath)) fs.unlinkSync(f.filepath);
        });
    }
}