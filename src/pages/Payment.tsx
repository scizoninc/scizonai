import { CreditCard, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
// 1. Importar useNavigate
import { Link, useNavigate } from "react-router-dom"; 

const PaymentPage = () => {
  // 2. Inicializar useNavigate
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      price: "Grátis",
      description: "Para começar a explorar",
      features: ["5 uploads por mês", "Processamento básico", "Suporte por email"],
      popular: false,
      // 🟢 Rota: Importar arquivo avulso (usando o plano gratuito)
      route: "/import", 
    },
    {
      name: "Pro",
      price: "R$ 49",
      period: "/mês",
      description: "Para uso profissional",
      features: ["Uploads ilimitados", "Processamento avançado", "Suporte prioritário", "API access"],
      popular: true,
      // 🟢 Rota: Checkout Pro
      route: "/checkout/pro", 
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      description: "Para grandes equipes",
      features: ["Tudo do Pro", "SLA dedicado", "Integração customizada", "Gerente de conta"],
      popular: false,
      // 🟢 Rota: Checkout Enterprise
      route: "/checkout/enterprise", 
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-foreground">
            ScizonAI
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/import" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Importar
            </Link>
            {/* Botão Entrar adicionado navegação para '/auth' */}
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Preços simples e transparentes. Sem taxas escondidas.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`
                relative rounded-2xl p-6 transition-all duration-300 animate-slide-up
                ${plan.popular 
                  ? "bg-card border-2 border-foreground/20" 
                  : "bg-card/50 border border-border hover:border-muted-foreground/30"
                }
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-foreground text-background text-xs font-medium px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-secondary-foreground">
                    <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.popular ? "default" : "outline"} 
                className="w-full"
                // 3. Adicionar a função de navegação
                onClick={() => navigate(plan.route)}
              >
                {plan.price === "Grátis" ? "Começar grátis" : "Assinar agora"}
              </Button>
            </article>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-6 py-16 border-t border-border/30">
        <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Pagamento seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Cancele a qualquer momento</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PaymentPage;