import { useState } from "react";
import { 
  Home, 
  BarChart3, 
  Settings, 
  Upload, 
  User, 
  Sparkles, 
  AreaChart, 
  LayoutDashboard, 
  DollarSign,
  Menu,
  X 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Definição dos itens do menu lateral
const navItems = [
  { name: "Visão Geral", icon: Home, route: "/dashboard" },
  { name: "Análise de Dados", icon: BarChart3, route: "/dashboard/analytics" },
  { name: "Relatórios", icon: AreaChart, route: "/dashboard/reports" },
  { name: "Configurações", icon: Settings, route: "/dashboard/settings" },
];

// Componente principal do Dashboard
const DashboardPage = () => {
  const [activeItem, setActiveItem] = useState("/dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Função para simular o clique e adicionar animação
  const handleItemClick = (route: string) => {
    setActiveItem(route);
    setIsSidebarOpen(false); // Fecha o menu em dispositivos móveis
    // Simula a navegação ou o carregamento da seção (em uma aplicação real)
    console.log(`Navegando para: ${route}`);
  };

  // Componente de Cartão de Métrica Simulado
  const MetricCard = ({ icon: Icon, title, value, change }: { icon: any, title: string, value: string, change: string }) => (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-bold">{value}</p>
        <p className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
      </div>
    </div>
  );

  // Layout do Dashboard
  return (
    <div className="flex h-screen bg-background text-foreground">
      
      {/* 1. Sidebar (Menu Lateral) - Desktop */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border p-5 shadow-2xl transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold transition-transform duration-300 hover:scale-[1.02]">
            <Sparkles className="h-6 w-6 text-primary animate-spin-slow" />
            Scizon AI
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeItem === item.route;
            const Icon = item.icon;
            return (
              <Button
                key={item.route}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start text-base transition-all duration-200 group ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted/50'}`}
                onClick={() => handleItemClick(item.route)}
              >
                <Icon className={`h-5 w-5 mr-3 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </aside>

      {/* 2. Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 2.1. Header Superior */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          
          <div className="flex items-center gap-4">
            {/* Botão para abrir o menu em mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                {navItems.find(item => item.route === activeItem)?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Opção Importar Arquivos */}
            <Button 
              variant="outline" 
              className="group transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              onClick={() => navigate("/import")}
            >
              <Upload className="h-4 w-4 mr-2 group-hover:rotate-3 transition-transform" />
              Importar Arquivos
            </Button>
            
            {/* Opção Login / Perfil do Usuário */}
            <Button 
              variant="default" 
              size="icon" 
              className="group transition-all duration-300 hover:scale-105"
              onClick={() => navigate("/auth")}
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* 2.2. Área de Conteúdo/Dashboards */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Métricas Chave */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard icon={DollarSign} title="Faturamento Total" value="R$ 150K" change="+12.5%" />
            <MetricCard icon={BarChart3} title="Novos Clientes" value="859" change="+5.2%" />
            <MetricCard icon={AreaChart} title="Taxa de Conversão" value="4.7%" change="-0.8%" />
            <MetricCard icon={Settings} title="Modelos Processados" value="1.2K" change="+21.0%" />
          </section>

          {/* Gráfico Principal */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg animate-fade-in-slow">
            <h2 className="text-xl font-semibold mb-4">Tendência de Faturamento (Simulação)</h2>
            <div className="h-72 flex items-center justify-center bg-muted/30 rounded-lg">
              <BarChart3 className="h-16 w-16 text-muted-foreground opacity-50" />
              <p className="ml-4 text-muted-foreground">Área para Gráfico Interativo</p>
            </div>
          </section>

          {/* Tabela/Detalhamento */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg animate-fade-in-slow">
            <h2 className="text-xl font-semibold mb-4">Detalhamento dos Últimos Processamentos</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Arquivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="hover:bg-muted/10 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">Relatorio_Vendas_Q{5-i}.pdf</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${i % 2 === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                        {i % 2 === 0 ? 'Concluído' : 'Processando'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">2025-11-{20 - i}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button variant="ghost" size="sm" onClick={() => console.log('Ver detalhes')}>Detalhes</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </section>
        </main>
      </div>

      {/* Overlay para mobile quando o menu está aberto */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
    </div>
  );
};

export default DashboardPage;