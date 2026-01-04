import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  CheckCircle, 
  Download, 
  Loader2, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  FileDown 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 

// Importações para geração de documentos
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const callGeminiApi = async (prompt: string, files: File[]): Promise<string> => {
    const formData = new FormData();
    formData.append('user_prompt', prompt);
    files.forEach((file) => formData.append('files', file));

    const API_ENDPOINT = '/api/generate-report';

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            let errorMessage = `Erro HTTP: ${response.status}`;

            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } else {
                errorMessage = "Erro crítico no servidor (Verifique as logs do Vercel).";
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.report || "Relatório vazio retornado pelo servidor.";

    } catch (error: any) {
        throw new Error(error.message || 'Erro de rede/servidor');
    }
};

// ----------------------------------------------------------------------
// 2. Componente Principal
// ----------------------------------------------------------------------
const OutputPage = () => {
    const location = useLocation();
    
    const { 
        fileNames = [], 
        fileObjects = [], 
        prompt = '' 
    } = (location.state as { fileNames?: string[], fileObjects?: File[], prompt?: string }) || {};

    const hasValidData = prompt.trim() !== '' && fileObjects.length > 0;

    const [fullReport, setFullReport] = useState<string | null>(null);
    const [displayedText, setDisplayedText] = useState("");
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Efeito: Chamada da API
    useEffect(() => {
        if (!hasValidData) {
            setIsLoading(false);
            return;
        }

        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const report = await callGeminiApi(prompt, fileObjects as File[]); 
                setFullReport(report);
            } catch (error: any) {
                setFullReport(`## Erro no Processamento\n\n${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [prompt, fileObjects.length]); 
    
    // Efeito: Animação de Digitação
    useEffect(() => {
        if (!fullReport || isLoading) return;

        let i = 0;
        const intervalId = setInterval(() => {
            if (i < fullReport.length) {
                setDisplayedText(prev => prev + fullReport.charAt(i));
                i++;
            } else {
                clearInterval(intervalId);
                setIsTypingComplete(true);
            }
        }, 5); // Velocidade da digitação

        return () => clearInterval(intervalId);
    }, [fullReport, isLoading]);

    const downloadAsWord = async () => {
        if (!fullReport) return;

        // Formata o texto para parágrafos do Word
        const lines = fullReport.split("\n");
        const docContent = lines.map(line => {
            return new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        size: 24, // Equivale a 12pt
                        font: "Arial",
                    }),
                ],
                spacing: { after: 200 },
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "RELATÓRIO DE ANÁLISE - SCIZON AI",
                                bold: true,
                                size: 32,
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    ...docContent,
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Relatorio_ScizonAI_${new Date().toLocaleDateString().replace(/\//g, '-')}.docx`);
    };

    if (!hasValidData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-border">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Sessão Expirada</h1>
                    <p className="text-muted-foreground">Os dados foram perdidos. Por favor, reinicie a importação.</p>
                    <Link to="/" className="mt-4 block">
                        <Button>Voltar ao Início</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border/30">
                <div className="container mx-auto px-6 py-4">
                    <Link to="/" className="text-xl font-bold tracking-tight text-primary">ScizonAI</Link>
                </div>
            </header>

            <section className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 flex items-center justify-center gap-3">
                            <Sparkles className="w-8 h-8 text-primary" /> Relatório Inteligente
                        </h1>
                        <p className="text-muted-foreground">Resultados gerados pela IA.</p>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="animate-pulse text-muted-foreground">Processando dados e gerando insights...</p>
                        </div>
                    )}

                    {!isLoading && (
                        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/10">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <CheckCircle className={`w-5 h-5 ${isTypingComplete ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`} />
                                    {isTypingComplete ? 'Análise Finalizada' : 'IA escrevendo...'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {/* Área do Texto */}
                                <div className="bg-muted/20 p-6 rounded-xl border border-border/40 mb-6">
                                    <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground/90">
                                        {displayedText}
                                        {!isTypingComplete && <span className="animate-pulse bg-primary w-2 h-5 inline-block ml-1"></span>}
                                    </pre>
                                </div>

                                {/* Lista de Arquivos */}
                                <div className="p-4 bg-muted/10 rounded-lg">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Arquivos processados:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {fileNames.map((name, i) => (
                                            <span key={i} className="text-xs bg-background border border-border px-3 py-1 rounded-full text-muted-foreground">
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Ações de Download */}
                                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <Button 
                                        onClick={downloadAsWord} 
                                        disabled={!isTypingComplete}
                                        size="lg"
                                        className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 font-bold"
                                    >
                                        <FileDown className="w-5 h-5 mr-2" />
                                        Baixar Relatório (.docx)
                                    </Button>

                                    <Button 
                                        variant="outline"
                                        onClick={() => window.print()} 
                                        disabled={!isTypingComplete}
                                        size="lg"
                                        className="w-full sm:w-auto px-8"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Imprimir / PDF
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </main>
    );
};

export default OutputPage;