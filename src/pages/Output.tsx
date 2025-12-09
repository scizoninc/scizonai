// src/pages/OutputPage.tsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, Download, Loader2, FileText, Sparkles, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 

// A CHAVE API NÃO É NECESSÁRIA AQUI NO FRONT-END.
// Ela será lida APENAS no seu Serverless Function (pages/api/generate-report.ts).

// 2. Função de Chamada API REAL
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
            // Se o servidor retornar um erro (ex: 500), lança exceção
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        // A rota de API deve retornar um objeto como { report: "Seu relatório Markdown" }
        return data.report || "Relatório vazio retornado pelo servidor.";

    } catch (error) {
        console.error("Erro na chamada da API:", error);
        throw new Error(`Falha ao obter relatório: ${error.message}`);
    }
};


const OutputPage = () => {
    const location = useLocation();
    // NOTA: O 'files' (array de nomes de arquivos) é o que veio do state,
    // mas precisaremos do objeto File real para enviar no FormData.
    // Assumindo que o componente ImportFile.tsx passou os objetos File reais.
    
    // ⚠️ Ajuste de Tipo: Garantimos que `files` é tratado como File[] se for onde você armazena os objetos File.
    // Se o `location.state` só tiver nomes, você precisará ajustar o componente anterior para passar os objetos File.
    // Por enquanto, vou usar o que foi passado, mas assumindo que 'fileObjects' é onde os Files reais estariam.
    const { 
        fileNames = [], // Lista de strings (nomes)
        fileObjects = [], // ⚠️ Deve ser a lista de objetos File reais!
        prompt = '' 
    } = (location.state as { fileNames?: string[], fileObjects?: File[], prompt?: string }) || {};

    const filesToProcess = fileObjects.length > 0 ? fileObjects : [];

    // 🟢 Estados para gerenciamento do relatório e animação
    const [fullReport, setFullReport] = useState<string | null>(null);
    const [displayedText, setDisplayedText] = useState("");
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 3. Efeito para Chamar a API REAL e Iniciar a Digitação
    useEffect(() => {
        if (!prompt || filesToProcess.length === 0) {
            setIsLoading(false);
            return;
        }

        const fetchReport = async () => {
            setIsLoading(true);
            setDisplayedText("");
            setIsTypingComplete(false);

            try {
                // 🟢 Chamada REAL para a rota de API do Vercel
                const report = await callGeminiApi(prompt, filesToProcess); 
                setFullReport(report);
            } catch (error) {
                // Exibe o erro retornado pela chamada real
                setFullReport(`## Erro no Processamento\n${error.message}`);
                console.error("Erro ao chamar a API Gemini via servidor:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [prompt, filesToProcess]); 
    
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
        }, 10); // Velocidade de digitação (10ms)

        return () => clearInterval(intervalId);
    }, [fullReport, isLoading]);


    // 4. Tratamento de Erro (Dados Ausentes)
    if (!prompt || filesToProcess.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-border">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Erro de Processamento</h1>
                    <p className="text-muted-foreground">Dados de entrada não encontrados. Por favor, <Link to="/import" className="text-primary hover:underline">volte e importe os arquivos</Link>.</p>
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
                                        {filesToProcess.map((file, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 flex-shrink-0" /> {file.name}
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
                                            alert(`Download simulado para o relatório e ${filesToProcess.length} arquivos.`);
                                        }}
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Baixar Relatório e Arquivos Processados
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