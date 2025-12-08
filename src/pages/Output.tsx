// src/pages/OutputPage.tsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, Download, Loader2, FileText, Sparkles, AlertCircle } from "lucide-react";

// Assumindo que você tem esses componentes UI (shadcn/ui ou similar) disponíveis:
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 

// 🟢 Configuração da Chave API (Assumindo VITE)
// Em um projeto real, esta chave deve ser usada apenas no Backend.
const API_KEY = import.meta.env.N_KEY; 

// 1. Simulação da Resposta do GPT
const generateSimulatedReport = (prompt: string, files: string[]) => {
  return `## Relatório de Análise de Mídia Exterior (GPT AI)
---
**Prompt de Análise:** "${prompt.slice(0, 100)}..."

A análise dos ${files.length} arquivos fornecidos (${files.join(', ')}) revela insights cruciais para a otimização de suas campanhas de Outdoor. 

### 📈 Desempenho Chave
Os dados processados indicam que o **Painel OOH-102** na Rua Principal 3 foi o de maior impacto no último ciclo, registrando um CPM 15% abaixo da média do portfólio. Este painel concentra 25% do total de impressões.

### 💡 Recomendações de Otimização
1.  **Concentração de Recursos:** Redirecione 10% do orçamento do Painel OOH-105 para OOH-102, aproveitando sua alta eficiência.
2.  **Análise de Fluxo:** Sugere-se cruzar o horário de pico do Painel OOH-101 com dados demográficos de tráfego para entender a baixa conversão relatada.
3.  **Sugestão Criativa:** O Prompt solicitou otimização de CPM. A IA sugere focar em criativos mais chamativos para painéis de baixo desempenho, aumentando a taxa de atenção.

A IA da Scizon concluiu a análise em 45 segundos e gerou este resumo executivo formatado.`;
};

// 2. Função de Chamada API (Simulada)
const callGptApi = async (prompt: string, files: string[]): Promise<string> => {
  // Se a chave não estiver presente, usamos a simulação, mas alertamos no console
  if (!API_KEY && import.meta.env.MODE === 'development') {
    console.warn("Aviso: Chave API do GPT não configurada em .env.local. Usando simulação total.");
  }
  
  // Simulação de delay da resposta real da API
  await new Promise(resolve => setTimeout(resolve, 3000)); 

  return generateSimulatedReport(prompt, files);
};


const OutputPage = () => {
  const location = useLocation();
  // Desestrutura e garante que os estados são arrays vazios/strings vazias se location.state for null
  const { files = [], fileUrls = [], prompt = '' } = (location.state as { files?: string[], fileUrls?: string[], prompt?: string }) || {};

  // 🟢 Estados para gerenciamento do relatório e animação
  const [fullReport, setFullReport] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Efeito para Chamar a API (simulada) e Iniciar a Digitação
  useEffect(() => {
    if (!prompt || files.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchReport = async () => {
      setIsLoading(true);
      setDisplayedText("");
      setIsTypingComplete(false);

      try {
        // 🟢 Chamada real (simulada) que usa a API_KEY internamente
        const report = await callGptApi(prompt, files); 
        setFullReport(report);
      } catch (error) {
        setFullReport("## Erro na Conexão com a IA\nNão foi possível obter a resposta do modelo. Verifique a chave API e a conexão de rede.");
        console.error("Erro ao chamar a API do GPT:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [prompt, files]); 
  
  // Efeito de digitação animada (roda após 'fullReport' ser definido)
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
  if (!prompt || files.length === 0) {
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
              <p className="text-sm text-muted-foreground">Conectando ao modelo GPT e processando os arquivos...</p>
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
                  <h4 className="font-semibold mb-2">Arquivos Analisados ({files.length}):</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    {files.map((name, index) => (
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
                      console.log("Simulando download do relatório e dos arquivos:", fileUrls);
                      alert(`Download iniciado para o relatório e ${files.length} arquivos.`);
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