import { Download, CheckCircle, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const DownloadPage = () => {
  const location = useLocation();
  const { toast } = useToast();

  // Recebe arquivos e URLs vindos da LoadingPage
  const files = location.state?.files || [];
  const fileUrls = location.state?.fileUrls || []; // Lista de URLs geradas pelo backend

  // Função padrão para baixar qualquer arquivo PDF
  const downloadFile = async (fileUrl: string, filename: string) => {
    toast({
      title: "Download iniciado",
      description: `${filename} está sendo baixado.`,
    });

    try {
      // Chama seu backend Next.js para BAIXAR
      const response = await fetch(
        `/api/energent/download?url=${encodeURIComponent(fileUrl)}`
      );

      if (!response.ok) {
        throw new Error("Erro ao baixar arquivo");
      }

      // Recupera o PDF como blob
      const blob = await response.blob();

      // Cria um link invisível para baixar o arquivo
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  // Baixar individual
  const handleDownload = (index: number, processedName: string) => {
    const fileUrl = fileUrls[index];
    downloadFile(fileUrl, processedName);
  };

  // Baixar todos
  const handleDownloadAll = () => {
    toast({
      title: "Download iniciado",
      description: "Todos os arquivos estão sendo baixados.",
    });

    fileUrls.forEach((url: string, index: number) => {
      const processedName = files[index].replace(/\.[^/.]+$/, "_processado.pdf");
      downloadFile(url, processedName);
    });
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
            Novo upload
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto">

          {/* Success State */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Processamento concluído
            </h1>
            <p className="text-muted-foreground">
              Seus arquivos estão prontos para download
            </p>
          </div>

          {/* File List */}
          <div className="space-y-3 mb-8">
            {files.map((fileName: string, index: number) => {
              const processedName = fileName.replace(/\.[^/.]+$/, "_processado.pdf");

              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">
                      {processedName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Pronto para download
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(index, processedName)}
                    className="flex-shrink-0"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Download All Button */}
          {files.length > 1 && (
            <Button
              onClick={handleDownloadAll}
              className="w-full mb-4"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar todos
            </Button>
          )}

          {files.length === 1 && fileUrls.length === 1 && (
            <Button
              onClick={() =>
                handleDownload(0, files[0].replace(/\.[^/.]+$/, "_processado.pdf"))
              }
              className="w-full mb-4"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar arquivo
            </Button>
          )}

          {/* Info */}
          <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Os arquivos estarão disponíveis por 7 dias
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default DownloadPage;
