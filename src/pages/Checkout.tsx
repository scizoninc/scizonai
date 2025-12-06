import { useState } from "react";
import { CreditCard, QrCode, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "card" | "pix" | null;

const CheckoutPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const files = location.state?.files || [];

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Selecione um método",
        description: "Escolha entre cartão ou PIX para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    setIsProcessing(false);
    toast({
      title: "Pagamento confirmado!",
      description: "Seu pagamento foi processado com sucesso.",
    });
    
    navigate("/download", { state: { files } });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-foreground">
            ScizonAI
          </Link>
          <Link 
            to="/import" 
            className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto">
          {/* Title */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento
            </h1>
            <p className="text-muted-foreground">
              {files.length} arquivo{files.length !== 1 ? "s" : ""} para processar
            </p>
          </div>

          {/* Price */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-slide-up">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">R$ 9,90</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4 mb-8">
            <p className="text-sm font-medium text-foreground">Método de pagamento</p>
            
            {/* Card Option */}
            <button
              onClick={() => setSelectedMethod("card")}
              className={`
                w-full p-4 rounded-xl border transition-all duration-200 text-left flex items-center gap-4
                ${selectedMethod === "card" 
                  ? "border-foreground bg-muted/30" 
                  : "border-border hover:border-muted-foreground/50 bg-card"
                }
              `}
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Cartão de crédito</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
              </div>
            </button>

            {/* PIX Option */}
            <button
              onClick={() => setSelectedMethod("pix")}
              className={`
                w-full p-4 rounded-xl border transition-all duration-200 text-left flex items-center gap-4
                ${selectedMethod === "pix" 
                  ? "border-foreground bg-muted/30" 
                  : "border-border hover:border-muted-foreground/50 bg-card"
                }
              `}
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <QrCode className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">PIX</p>
                <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
              </div>
            </button>
          </div>

          {/* Card Form */}
          {selectedMethod === "card" && (
            <div className="space-y-4 mb-8 animate-fade-in">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Número do cartão</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nome no cartão</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Validade</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "") })}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PIX QR Code */}
          {selectedMethod === "pix" && (
            <div className="mb-8 animate-fade-in">
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="w-32 h-32 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Escaneie o QR Code com o app do seu banco
                </p>
              </div>
            </div>
          )}

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              "Pagar R$ 9,90"
            )}
          </Button>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            Pagamento seguro e criptografado
          </p>
        </div>
      </section>
    </main>
  );
};

export default CheckoutPage;