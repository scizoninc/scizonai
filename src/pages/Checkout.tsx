// src/pages/CheckoutPage.tsx
import { useState, useMemo } from "react";
import { CreditCard, QrCode, ArrowLeft, Loader2, Mail, Users, CheckCircle } from "lucide-react"; // Adicionado Mail e Users
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"; // Adicionado useParams
import { useToast } from "@/hooks/use-toast";

// =======================================================
// Funções Auxiliares (mantidas)
// =======================================================
function detectCardBrand(cardNumber: string) {
  const num = cardNumber.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  if (/^4/.test(num)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^(504175|5090|627780|636297|636368|451416|509048)/.test(num)) return "Elo";
  if (/^(606282|384100|384140|384160)/.test(num)) return "Hipercard";
  if (/^36|38|300|301|302|303|304|305/.test(num)) return "Diners";
  return "Desconhecida";
}
const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  return v.replace(/(.{4})/g, "$1 ").trim();
};
const formatExpiry = (v: string) => {
  const x = v.replace(/\D/g, "");
  return x.length >= 3 ? x.substring(0, 2) + "/" + x.substring(2, 4) : x;
};
type PaymentMethod = "card" | "pix" | null;
// =======================================================


const CheckoutPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [enterpriseEmail, setEnterpriseEmail] = useState("");
  
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🟢 1. Obter o parâmetro da URL (para Pro/Enterprise)
  const { planId } = useParams<{ planId: string }>();

  // 🟢 2. Obter dados do estado (para pagamento de Arquivo Avulso)
  const files: string[] = location.state?.files || [];
  const fileUrls: string[] = location.state?.fileUrls || [];

  const brand = useMemo(() => detectCardBrand(cardData.number), [cardData.number]);

  // 🟢 3. Determinar o contexto da página (Plano ou Arquivo)
  const context = useMemo(() => {
    if (planId === 'pro') {
      return {
        type: 'plan',
        title: 'Assinatura Pro',
        description: 'Acesso ilimitado e recursos avançados.',
        amount: 'R$ 49,90/mês',
        successRoute: '/dashboard', // Mudar para o dashboard após a assinatura
        isPaymentForm: true
      };
    }
    if (planId === 'enterprise') {
      return {
        type: 'enterprise',
        title: 'Plano Enterprise',
        description: 'Soluções customizadas para grandes empresas.',
        amount: 'Customizado',
        successRoute: '/', // Voltar para Home/Landing após o envio
        isPaymentForm: false // Não exibe formulário de pagamento
      };
    }
    // Contexto de Pagamento de Arquivo Avulso
    return {
      type: 'file',
      title: 'Pagamento Avulso',
      description: `${files.length} arquivo${files.length !== 1 ? "s" : ""} pronto(s) para análise.`,
      amount: 'R$ 9,90',
      successRoute: '/download', // Redireciona para Download após o pagamento
      isPaymentForm: true
    };
  }, [planId, files.length]);


  // 🟢 4. Ação de Pagamento Unificada
  const handleAction = async () => {
    setIsProcessing(true);

    if (context.type === 'enterprise') {
      // Lógica de solicitação Enterprise
      if (!enterpriseEmail || !enterpriseEmail.includes('@')) {
        toast({ title: "Email inválido", description: "Por favor, insira um email válido.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      toast({ title: "Solicitação enviada!", description: "Entraremos em contato em breve.", variant: "success" });
      navigate(context.successRoute);
      
    } else {
      // Lógica de Pagamento (Plano Pro ou Arquivo Avulso)
      if (!selectedMethod) {
        toast({ title: "Selecione um método", description: "Escolha entre cartão ou PIX.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      // Adicionar validação de cartão
      if (selectedMethod === "card" && cardData.number.replace(/\s/g, "").length < 13) {
        toast({ title: "Cartão inválido", description: "Informe um número válido", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      
      // Simula o pagamento
      await new Promise(resolve => setTimeout(resolve, 2000)); 

      toast({ title: "Pagamento simulado!", description: "A transação foi registrada como sucesso.", variant: "success" });
      
      // Redireciona, repassando os dados do arquivo se for contexto 'file'
      if (context.type === 'file') {
        navigate(context.successRoute, { state: { files, fileUrls } });
      } else {
        navigate(context.successRoute);
      }
    }
    
    setIsProcessing(false);
  };
  
  // Se for pagamento de arquivo, mas não houver arquivos, redireciona para import
  if (context.type === 'file' && files.length === 0) {
    toast({ title: "Nenhum arquivo para pagar.", description: "Você foi redirecionado para a página de importação.", variant: "default" });
    navigate("/import");
    return null; // Não renderiza nada enquanto redireciona
  }


  // 🟢 5. Renderização Condicional
  const PaymentContent = () => (
    <>
      <div className="space-y-4 mb-8">
        <p className="text-sm font-medium">Método de pagamento</p>
        {/* Botão Cartão */}
        <button onClick={() => setSelectedMethod("card")} className={`w-full p-4 rounded-xl border ${selectedMethod === "card" ? "border-foreground bg-muted/30" : "border-border"}`}>
          <div className="flex items-center gap-4"><CreditCard className="w-6 h-6" /><div><p className="font-medium">Cartão de crédito</p><p className="text-sm text-muted-foreground">Visa, Mastercard, Elo, Amex</p></div></div>
        </button>
        {/* Botão PIX */}
        <button onClick={() => setSelectedMethod("pix")} className={`w-full p-4 rounded-xl border ${selectedMethod === "pix" ? "border-foreground bg-muted/30" : "border-border"}`}>
          <div className="flex items-center gap-4"><QrCode className="w-6 h-6" /><div><p className="font-medium">PIX</p><p className="text-sm text-muted-foreground">Pagamento instantâneo</p></div></div>
        </button>
      </div>

      {/* Formulário de Cartão */}
      {selectedMethod === "card" && (
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Número do cartão</label>
            <input type="text" maxLength={23} placeholder="0000 0000 0000 0000" value={cardData.number} onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })} className="w-full bg-card border border-border rounded-lg px-4 py-3" />
            <p className="text-xs text-muted-foreground mt-1">Bandeira detectada: <strong>{brand}</strong></p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Nome no cartão</label>
            <input type="text" placeholder="Nome completo" value={cardData.name} onChange={(e) => setCardData({ ...cardData, name: e.target.value })} className="w-full bg-card border border-border rounded-lg px-4 py-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Validade</label>
              <input type="text" maxLength={5} placeholder="MM/AA" value={cardData.expiry} onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })} className="w-full bg-card border border-border rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">CVV</label>
              <input type="text" maxLength={4} placeholder="123" value={cardData.cvv} onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "") })} className="w-full bg-card border border-border rounded-lg px-4 py-3" />
            </div>
          </div>
        </div>
      )}

      {/* PIX */}
      {selectedMethod === "pix" && (
        <div className="mb-8">
          <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4"><QrCode className="w-32 h-32 text-muted-foreground" /></div>
            <p className="text-sm text-muted-foreground">Escaneie o QR Code com o app do seu banco</p>
          </div>
        </div>
      )}
    </>
  );
  
  const EnterpriseContent = () => (
    <div className="space-y-6 mb-8 p-6 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-3 text-lg font-semibold text-primary">
            <Users className="w-6 h-6"/> Solicitar Orçamento Enterprise
        </div>
        <p className="text-muted-foreground">Preencha seu e-mail e entraremos em contato para discutir suas necessidades personalizadas e preços.</p>
        
        <ul className="space-y-2 text-sm text-secondary-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0"/> SLA dedicado</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0"/> Integração Customizada</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0"/> Gerente de Conta</li>
        </ul>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Seu melhor e-mail</label>
          <input 
            type="email" 
            placeholder="email@empresa.com" 
            value={enterpriseEmail} 
            onChange={(e) => setEnterpriseEmail(e.target.value)} 
            className="w-full bg-background border border-border rounded-lg px-4 py-3" 
          />
        </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">ScizonAI</Link>
          {/* Voltar é para Plans se for plano, ou Import se for arquivo avulso */}
          <Link to={context.type === 'file' ? "/import" : "/plans"} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> {context.type === 'file' ? "Voltar à Importação" : "Trocar Plano"}</Link>
        </div>
      </header>

      <section className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">{context.title}</h1>
            <p className="text-muted-foreground">{context.description}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor</span>
              <span className="text-2xl font-bold">{context.amount}</span>
            </div>
          </div>

          {/* Renderiza o formulário de Pagamento ou o formulário Enterprise */}
          {context.isPaymentForm ? <PaymentContent /> : <EnterpriseContent />}

          <Button 
            onClick={handleAction} 
            // Desabilita se for pagamento e não houver método selecionado, ou se estiver processando
            disabled={isProcessing || (context.isPaymentForm && !selectedMethod)} 
            className="w-full" 
            size="lg"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />
                {context.type === 'enterprise' ? "Enviando solicitação..." : "Processando pagamento..."}
              </>
            ) : (
              context.type === 'enterprise' ? "Solicitar contato" : `Pagar ${context.amount.replace('/mês', '')}`
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {context.isPaymentForm ? "Pagamento seguro e criptografado" : "Sua informação é confidencial"}
          </p>
        </div>
      </section>
    </main>
  );
};

export default CheckoutPage;