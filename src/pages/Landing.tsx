import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, BarChart3, FileDown, Sparkles, Zap, TrendingUp, Database, Boxes } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in">
            <Sparkles className="h-6 w-6 animate-spin-slow" />
            <span className="text-2xl font-bold">Scizon AI</span>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/plans")}
            className="animate-fade-in hover:bg-muted/50 transition-all duration-300"
          >
            Plans
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="animate-fade-in hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            Login
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/outdoor")}
            className="animate-fade-in hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            Outdoor
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm animate-fade-up backdrop-blur-sm">
              <Zap className="h-4 w-4 animate-pulse-slow" />
              <span>Transforme dados em insights com IA</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Visualização Avançada de Dados
              <br />
              <span className="relative inline-block">
                <span className="absolute bottom-2 left-0 w-full h-4 bg-primary/20 -skew-x-12 animate-slide-in-left" style={{ animationDelay: '0.5s' }} />
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Tranforme seus dados em visualização avançada.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Button 
                size="lg" 
                className="group bg-primary text-primary-foreground hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-primary/50 px-8"
                onClick={() => navigate("/auth")}
              >
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Ver demonstração
              </Button>
            </div>
          </div>

          {/* Hero Visual with animated elements */}
          <div className="mt-20 relative animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 blur-3xl animate-glow" />
            <div className="relative rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm p-8 shadow-2xl hover:shadow-primary/20 transition-all duration-500 group">
              {/* Floating icons */}
              <div className="absolute -top-6 -left-6 bg-primary text-primary-foreground p-4 rounded-xl shadow-xl animate-bounce-slow">
                <Upload className="h-6 w-6" />
              </div>
              <div className="absolute -top-6 -right-6 bg-background border border-primary p-4 rounded-xl shadow-xl animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-4 rounded-xl shadow-xl animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <FileDown className="h-6 w-6" />
              </div>
              
              <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:bg-muted/50 transition-all duration-500">
                <BarChart3 className="h-24 w-24 text-muted-foreground group-hover:scale-110 transition-transform duration-500" />
                
                {/* Animated grid */}
                <div className="absolute inset-0 opacity-10">
                  <div className="h-full w-full" style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold">Recursos poderosos</h2>
            <p className="text-xl text-muted-foreground">
              Tudo que você precisa para análise de dados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "Dados Analisados",
                description: "Dados tratados com análise avançada.",
                delay: "0s"
              },
              {
                icon: BarChart3,
                title: "Dashboards Interativos",
                description: "Gráficos dinâmicos e indicadores em tempo real.",
                delay: "0.1s"
              },
              {
                icon: FileDown,
                title: "Exportação Fácil",
                description: "Exporte apresentações profissionais para PDF e PowerPoint com um clique.",
                delay: "0.2s"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl border border-primary/10 bg-background hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 animate-fade-up relative overflow-hidden"
                style={{ animationDelay: feature.delay }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-20 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold">Como funciona</h2>
            <p className="text-xl text-muted-foreground">
              Simples, rápido e inteligente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-pulse-slow" />
            
            {[
              { number: 1, icon: Upload, title: "Faça upload", description: "Envie sua planilha de vendas, finanças ou qualquer tipo de dado", delay: "0s" },
              { number: 2, icon: Database, title: "IA analisa", description: "Nossa IA processa e identifica padrões, tendências e insights", delay: "0.2s" },
              { number: 3, icon: Boxes, title: "Visualize e exporte", description: "Explore dashboards interativos e exporte apresentações prontas", delay: "0.4s" }
            ].map((step) => (
              <div key={step.number} className="text-center space-y-4 relative animate-fade-up" style={{ animationDelay: step.delay }}>
                <div className="relative inline-block">
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-2xl font-bold relative z-10 hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
                  <step.icon className="absolute -bottom-2 -right-2 h-8 w-8 bg-background border-2 border-primary rounded-lg p-1.5 animate-bounce-slow" />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="container mx-auto max-w-4xl text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold animate-fade-up">
            Pronto para transformar seus dados?
          </h2>
          <p className="text-xl opacity-90 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Comece gratuitamente hoje e descubra insights que você nunca imaginou
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="group bg-primary-foreground text-primary hover:scale-105 transition-all duration-300 shadow-2xl animate-fade-up px-8"
            style={{ animationDelay: '0.2s' }}
            onClick={() => navigate("/auth")}
          >
            Criar conta grátis
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border relative">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 animate-fade-in">
              <Sparkles className="h-5 w-5 animate-spin-slow" />
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
