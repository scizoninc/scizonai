import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, BarChart3, FileDown, Sparkles, Zap, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in">
            <Sparkles className="h-6 w-6" />
            <span className="text-2xl font-bold">Scizon AI</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="animate-fade-in"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 text-sm">
              <Zap className="h-4 w-4" />
              <span>Transforme dados em insights com IA</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              Análise inteligente
              <br />
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                de planilhas
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload suas planilhas e transforme-as em dashboards interativos com insights poderosos.
              Exporte para PDF e PowerPoint em segundos.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                className="group"
                onClick={() => navigate("/auth")}
              >
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline">
                Ver demonstração
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl animate-glow" />
            <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 shadow-2xl">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <BarChart3 className="h-24 w-24 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Recursos poderosos</h2>
            <p className="text-xl text-muted-foreground">
              Tudo que você precisa para análise de dados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Upload Inteligente</h3>
              <p className="text-muted-foreground">
                Faça upload de planilhas em diversos formatos. Nossa IA processa e analisa automaticamente.
              </p>
            </div>

            <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Dashboards Interativos</h3>
              <p className="text-muted-foreground">
                Visualize seus dados com gráficos dinâmicos e indicadores em tempo real.
              </p>
            </div>

            <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileDown className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Exportação Fácil</h3>
              <p className="text-muted-foreground">
                Exporte apresentações profissionais para PDF e PowerPoint com um clique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Como funciona</h2>
            <p className="text-xl text-muted-foreground">
              Simples, rápido e inteligente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold">Faça upload</h3>
              <p className="text-muted-foreground">
                Envie sua planilha de vendas, finanças ou qualquer tipo de dado
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold">IA analisa</h3>
              <p className="text-muted-foreground">
                Nossa IA processa e identifica padrões, tendências e insights
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold">Visualize e exporte</h3>
              <p className="text-muted-foreground">
                Explore dashboards interativos e exporte apresentações prontas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Pronto para transformar seus dados?
          </h2>
          <p className="text-xl opacity-90">
            Comece gratuitamente hoje e descubra insights que você nunca imaginou
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="group"
            onClick={() => navigate("/auth")}
          >
            Criar conta grátis
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-bold">Scizon AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Scizon AI. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
