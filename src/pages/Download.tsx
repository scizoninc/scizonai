// src/pages/DownloadPage.tsx
import { Download, CheckCircle, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const DownloadPage = () => {
  const location = useLocation() as any;
  const { toast } = useToast();

  const files: string[] = location.state?.files || [];
  const fileUrls: string[] = location.state?.fileUrls || [];

  const downloadFile = async (index: number) => {
    toast({ title: "Download iniciado", description: "Seu arquivo está sendo baixado." });
    const url = fileUrls[index];
    const filename = (files[index] || `documento_${index+1}`).replace(/\.[^/.]+$/, "_processado.pdf");
    try {
      const res = await fetch(`/api/energent/download?${url ? `url=${encodeURIComponent(url)}` : `jobId=${encodeURIComponent(location.state.jobId)}`}`);
      if (!res.ok) throw new Error("Erro ao baixar");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("download error", err);
      toast({ title: "Erro", description: "Não foi possível baixar o arquivo.", variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">ScizonAI</Link>
          <Link to="/import" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Novo upload</Link>
        </div>
      </header>

      <section className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Processamento concluído</h1>
            <p className="text-muted-foreground">Seus arquivos estão prontos para download</p>
          </div>

          <div className="space-y-3 mb-8">
            {files.map((f, i) => {
              const name = f.replace(/\.[^/.]+$/, "_processado.pdf");
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0"><p className="text-foreground text-sm font-medium truncate">{name}</p><p className="text-muted-foreground text-xs">Pronto para download</p></div>
                  <Button variant="ghost" size="icon" onClick={() => downloadFile(i)}><Download className="w-5 h-5" /></Button>
                </div>
              );
            })}
          </div>

          {files.length > 1 && <Button onClick={() => files.forEach((_, i) => downloadFile(i))} className="w-full mb-4" size="lg"><Download className="w-4 h-4 mr-2" />Baixar todos</Button>}
          {files.length === 1 && <Button onClick={() => downloadFile(0)} className="w-full mb-4" size="lg"><Download className="w-4 h-4 mr-2" />Baixar arquivo</Button>}

          <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Os arquivos estarão disponíveis por 7 dias</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default DownloadPage;
