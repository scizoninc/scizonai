// src/pages/OutputPage.tsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, Download, Loader2, FileText, Sparkles, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 

// 2. Função de Chamada API REAL (MODIFICADA para tratamento de erro robusto)
const callGeminiApi = async (prompt: string, files: File[]): Promise<string> => {
    // 1. Cria um objeto FormData para enviar arquivos e campos de texto
    const formData = new FormData();
    formData.append('user_prompt', prompt);

    // Adiciona cada arquivo (File object) ao FormData
    files.forEach((file) => {
        // 'files' deve corresponder ao nome que sua rota de API espera receber.
        formData.append('files', file); 
    });

    const API_ENDPOINT = '/api/generate-report'; // Sua rota Serverless Function

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData, // Envia o FormData, incluindo arquivos e prompt
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`;

            // 🟢 TRATAMENTO DE ERRO ROBUSTO: Tenta ler JSON, senão assume erro de servidor
            if (contentType && contentType.includes("application/json")) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = "Erro na resposta da API (JSON Inválido no erro).";
                }
            } else {
                // Captura o cenário onde o Vercel retorna HTML (Ex: 'The page c...')
                errorMessage = `Erro Crítico do Servidor (Não JSON - Status ${response.status}). Verifique as logs ou a chave API.`;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        return data.report || "Relatório vazio retornado pelo servidor.";

    } catch (error: any) {
        console.error("Erro na chamada da API:", error);
        // Usamos error.message para passar a mensagem de erro do servidor
        throw new Error(`Falha ao obter relatório: ${error.message || 'Erro de rede/servidor'}`);
    }
};


const OutputPage = () => {
    const location = useLocation();
    
    // Desestruturação para garantir que os dados sejam lidos corretamente
    const { 
        fileNames = [], 
        fileObjects = [], // Array de objetos File
        prompt = '' 
    } = (location.state as { fileNames?: string[], fileObjects?: File[], prompt?: string }) || {};

    // Usamos fileObjects diretamente para o processamento
    const filesToProcess = fileObjects;
    const hasValidData = prompt.trim() !== '' && filesToProcess.length > 0;

    // 🟢 Estados para gerenciamento do relatório e animação
    const [fullReport, setFullReport] = useState<string | null>(null);
    const [displayedText, setDisplayedText] = useState("");
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 3. Efeito para Chamar a API REAL e Iniciar a Digitação
    useEffect(() => {
        if (!hasValidData) {
            setIsLoading(false);
            return;
        }

        const fetchReport = async () => {
            setIsLoading(true);
            setDisplayedText("");
            setIsTypingComplete(false);

            try {
                // 🟢 Chamada REAL para a rota de API com os objetos File
                const report = await callGeminiApi(prompt, filesToProcess as File[]); 
                setFullReport(report);
            } catch (error: any) {
                // Exibe o erro de forma formatada no relatório
                setFullReport(`## Erro no Processamento\n\n${error.message}`);
                console.error("Erro ao chamar a API Gemini via servidor:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [prompt, filesToProcess.length]); 
    
    // Efeito de digitação animada (mantido)
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
        }, 10); 

        return () => clearInterval(intervalId);
    }, [fullReport, isLoading]);


    // 4. Tratamento de Erro (Dados Ausentes - Geralmente após F5)
    if (!hasValidData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-border">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Sessão Expirada</h1>
                    <p className="text-muted-foreground">Os arquivos de processamento foram perdidos após a atualização da página.</p>
                    <Link to="/" className="text-primary hover:underline mt-4 block">
                        <Button>Voltar e Importar Novamente</Button>
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <main className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border/30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="text-xl font-semibold text-foreground">ScizonAI</Link>
                </div>
            </header>

            {/* Content */}
            <section className="container mx-auto px-6 py-16">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
                            <Sparkles className="w-8 h-8 text-primary" /> Relatório Gerado por IA
                        </h1>
                        <p className="text-muted-foreground text-lg">Análise profunda dos seus dados de mídia exterior.</p>
                    </div>

                    {/* Indicador de Processamento/Carregamento */}
                    {isLoading && (
                        <div className="text-center mb-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Conectando ao servidor Vercel e processando os arquivos com Gemini...</p>
                        </div>
                    )}

                    {/* Card do Relatório */}
                    {!isLoading && (
                        <Card className="shadow-2xl transition-all duration-500 animate-fade-in">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <CheckCircle className={`w-6 h-6 ${isTypingComplete ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`} />
                                    {isTypingComplete ? 'Relatório Concluído' : 'Gerando Relatório...'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Área de Texto Animada */}
                                <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed bg-muted/10 p-4 rounded-lg border border-border/50">
                                    {displayedText}
                                    {/* Simulação de cursor piscando */}
                                    {!isTypingComplete && <span className="animate-pulse bg-foreground w-1 h-4 inline-block ml-1"></span>}
                                </pre>

                                {/* Detalhes dos Arquivos */}
                                <div className="mt-6 text-sm">
                                    <h4 className="font-semibold mb-2">Arquivos Analisados ({filesToProcess.length}):</h4>
                                    <ul className="space-y-1 text-muted-foreground">
                                        {/* Usamos fileNames aqui pois são strings, os objetos File são apenas para o upload */}
                                        {fileNames.map((name, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 flex-shrink-0" /> {name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Botão de Download */}
                                <div className="mt-8 text-center">
                                    <Button 
                                        disabled={!isTypingComplete} 
                                        size="lg" 
                                        onClick={() => {
                                            // A lógica de download precisa ser implementada no lado do servidor
                                            alert(`Download simulado do relatório gerado (Markdown/PDF).`);
                                        }}
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Baixar Relatório
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