// src/pages/CheckoutPage.tsx
import { useState, useMemo } from "react";
import { CreditCard, QrCode, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

function detectCardBrand(cardNumber: string) {
  const num = cardNumber.replace(/\s+/g, "");
  if (/^4/.test(num)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^(504175|5090|627780|636297|636368|451416|509048)/.test(num)) return "Elo";
  if (/^(606282|384100|384140|384160)/.test(num)) return "Hipercard";
  if (/^36|38|300|301|302|303|304|305/.test(num)) return "Diners";
  return "Desconhecida";
}

type PaymentMethod = "card" | "pix" | null;

const CheckoutPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { toast } = useToast();

  const files: string[] = location.state?.files || [];
  const fileUrls: string[] = location.state?.fileUrls || [];
  const jobId: string = location.state?.jobId;

  const brand = useMemo(() => detectCardBrand(cardData.number), [cardData.number]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    return v.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (v: string) => {
    const x = v.replace(/\D/g, "");
    return x.length >= 3 ? x.substring(0, 2) + "/" + x.substring(2, 4) : x;
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({ title: "Selecione um método", description: "Escolha entre cartão ou PIX.", variant: "destructive" });
      return;
    }
    if (selectedMethod === "card") {
      if (cardData.number.replace(/\s/g, "").length < 13) {
        toast({ title: "Cartão inválido", description: "Informe um número válido", variant: "destructive" });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/energent/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
      if (!res.ok) throw new Error("Erro no pagamento");
      const json = await res.json();
      if (!json.success) throw new Error("Pagamento rejeitado");
      toast({ title: "Pagamento confirmado!", description: "Seu pagamento foi processado com sucesso." });
      navigate("/download", { state: { files, fileUrls } });
    } catch (err: any) {
      console.error("Pagamento error", err);
      toast({ title: "Erro no pagamento", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">ScizonAI</Link>
          <Link to="/import" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
        </div>
      </header>

      <section className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Pagamento</h1>
            <p className="text-muted-foreground">{files.length} arquivo{files.length !== 1 ? "s" : ""} pronto(s)</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">R$ 9,90</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-sm font-medium">Método de pagamento</p>
            <button onClick={() => setSelectedMethod("card")} className={`w-full p-4 rounded-xl border ${selectedMethod === "card" ? "border-foreground bg-muted/30" : "border-border"}`}>
              <div className="flex items-center gap-4"><CreditCard className="w-6 h-6" /><div><p className="font-medium">Cartão de crédito</p><p className="text-sm text-muted-foreground">Visa, Mastercard, Elo, Amex</p></div></div>
            </button>
            <button onClick={() => setSelectedMethod("pix")} className={`w-full p-4 rounded-xl border ${selectedMethod === "pix" ? "border-foreground bg-muted/30" : "border-border"}`}>
              <div className="flex items-center gap-4"><QrCode className="w-6 h-6" /><div><p className="font-medium">PIX</p><p className="text-sm text-muted-foreground">Pagamento instantâneo</p></div></div>
            </button>
          </div>

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

          {selectedMethod === "pix" && (
            <div className="mb-8">
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4"><QrCode className="w-32 h-32 text-muted-foreground" /></div>
                <p className="text-sm text-muted-foreground">Escaneie o QR Code com o app do seu banco</p>
              </div>
            </div>
          )}

          <Button onClick={handlePayment} disabled={!selectedMethod || isProcessing} className="w-full" size="lg">
            {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Processando...</>) : ("Pagar R$ 9,90")}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">Pagamento seguro e criptografado</p>
        </div>
      </section>
    </main>
  );
};

export default CheckoutPage;
