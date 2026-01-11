import { useState, useMemo } from "react";
import { 
  Home, 
  BarChart3, 
  Settings, 
  Upload, 
  User, 
  Sparkles, 
  AreaChart, 
  DollarSign,
  Menu,
  X,
  Megaphone 
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import { Button } from "@/components/ui/button";

// Definição dos itens do menu lateral (mantido)
const navItems = [
  { name: "Visão Geral", icon: Home, route: "/outdoor" },
  { name: "Análise de Dados", icon: BarChart3, route: "/dashboard/analytics" },
  { name: "Dashboard", icon: Megaphone, route: "/Dashboard" }, 
  { name: "Relatórios", icon: AreaChart, route: "/dashboard/reports" },
  { name: "Configurações", icon: Settings, route: "/dashboard/settings" },
];

// Tipagem simulada para o resultado da análise
interface AnalysisResult {
  totalImpressions: string;
  avgCpm: string;
  activeCampaigns: string;
  currentOccupancy: string;
  tableData: any[]; // Dados da tabela
}

// Função de Simulação de Análise de Dados da Planilha
// Em um cenário real, você faria o parsing do arquivo (CSV/Excel) aqui.
const analyzeData = (fileContents: string[]): AnalysisResult => {
  // Se não houver conteúdo, retorna valores padrão/vazios
  if (!fileContents || fileContents.length === 0) {
    return {
      totalImpressions: "0",
      avgCpm: "R$ 0.00",
      activeCampaigns: "0",
      currentOccupancy: "0%",
      tableData: [],
    };
  }

  // SIMULAÇÃO: Se houver dados (um ou mais arquivos), retorna dados de exemplo mais ricos
  const impressions = 1250000 + Math.floor(Math.random() * 500000);
  const cpm = 5.20 + Math.random() * 2 - 1; // Entre 4.20 e 6.20
  const campaigns = 10 + Math.floor(Math.random() * 5);
  const occupancy = 60 + Math.floor(Math.random() * 20);

  // Simulação de dados da tabela (5 linhas)
  const simulatedTable = Array.from({ length: 5 }).map((_, i) => ({
    id: `OOH-${100 + i}`,
    location: `Rua Principal ${i + 1}`,
    impressionsPerDay: (20000 - i * 500).toLocaleString('pt-BR'),
  }));


  return {
    totalImpressions: `${(impressions / 1000000).toFixed(1)}M`,
    avgCpm: `R$ ${cpm.toFixed(2)}`,
    activeCampaigns: campaigns.toString(),
    currentOccupancy: `${occupancy}%`,
    tableData: simulatedTable,
  };
};


const OutdoorPage = () => {
  const [activeItem, setActiveItem] = useState("/outdoor");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  // Leitura dos dados passados via state
  const location = useLocation();
  const { fileUrls } = (location.state as { fileUrls?: string[] }) || {};

  // 3. Análise de dados usando useMemo para evitar recalculos desnecessários
  const analysis = useMemo(() => {
    // Em um cenário real, você buscaria e leria o conteúdo dos fileUrls aqui.
    // Por enquanto, passamos apenas os URLs para a função, indicando que o arquivo existe.
    return analyzeData(fileUrls || []);
  }, [fileUrls]);


  // Função para simular o clique (mantida)
  const handleItemClick = (route: string) => {
    setActiveItem(route);
    setIsSidebarOpen(false); 
    navigate(route);
  };

  // Componente de Cartão de Métrica Simulado (mantido)
  const MetricCard = ({ icon: Icon, title, value, change }: { icon: any, title: string, value: string, change?: string }) => (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-bold">{value}</p>
        {/* O campo 'change' agora é opcional */}
        {change && <p className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>}
      </div>
    </div>
  );

  // Mensagem de estado
  const dataMessage = fileUrls && fileUrls.length > 0
    ? `Dados carregados de ${fileUrls.length} arquivo(s) importado(s).`
    : "Nenhum arquivo importado. Exibindo dados de simulação.";


  return (
    <div className="flex h-screen bg-background text-foreground">
      
      {/* 1. Sidebar (Menu Lateral) - Mantido */}
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
        
        {/* 2.1. Header Superior (Mantido) */}
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
                <Megaphone className="h-6 w-6 text-primary" />
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

          {/* Mensagem de estado dos dados */}
          <p className="text-sm text-center text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border">
            {dataMessage}
          </p>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Usando dados da análise para popular os cards */}
            <MetricCard icon={Megaphone} title="Campanhas Ativas" value={analysis.activeCampaigns} change="+3" />
            <MetricCard icon={AreaChart} title="Total de Impressões" value={analysis.totalImpressions} change="+18.0%" />
            <MetricCard icon={DollarSign} title="Custo Médio/CPM" value={analysis.avgCpm} change="-0.5%" />
            <MetricCard icon={Sparkles} title="Ocupação Atual" value={analysis.currentOccupancy} change="+7.0%" />
          </section>

          {/* Mapa de Localizações Outdoor (Mantido) */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg animate-fade-in-slow">
            <h2 className="text-xl font-semibold mb-4">Localização dos Painéis Ativos (Simulação de Mapa)</h2>
            <div className="h-72 flex items-center justify-center bg-muted/30 rounded-lg">
              <Megaphone className="h-16 w-16 text-muted-foreground opacity-50" />
              <p className="ml-4 text-muted-foreground">Área para Mapa Interativo de Outdoors</p>
            </div>
          </section>

          {/* Tabela/Detalhamento de Painéis */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg animate-fade-in-slow">
            <h2 className="text-xl font-semibold mb-4">Detalhamento dos Painéis Ativos</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Painel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Localização</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Impressões/Dia</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {/* Usando dados da análise para popular a tabela */}
                        {analysis.tableData.map((panel, i) => (
                            <tr key={i} className="hover:bg-muted/10 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{panel.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{panel.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{panel.impressionsPerDay}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button variant="ghost" size="sm" onClick={() => console.log('Ver detalhes')}>Ver Status</Button>
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

export default OutdoorPage;