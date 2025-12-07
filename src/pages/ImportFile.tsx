// src/pages/ImportFilePage.tsx
import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "ready" | "uploading" | "success" | "error";
  progress: number;
  file?: File;
}

const ImportFilePage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "ready",
      progress: 0,
      file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 🛑 CORREÇÃO PRINCIPAL AQUI: Processamento rápido e envio de dados para Checkout
  const handleProcessFiles = async () => {
    const readyFiles = files.filter((f) => f.status !== "error" && f.file);
    
    if (readyFiles.length === 0) {
      toast({ title: "Nenhum arquivo válido", description: "Selecione arquivos para processar." });
      return;
    }

    setIsProcessing(true);
    toast({ title: "Processamento simulado", description: "Arquivos processados e prontos para pagamento." });
    
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const fileNames = readyFiles.map(r => r.name);
    // Gera URLs de download simuladas que serão repassadas
    const simulatedFileUrls = fileNames.map((_, i) => `/simulated-download-${i}`); 

    // Redireciona para /checkout com os nomes dos arquivos e as URLs
    navigate("/checkout", { state: { files: fileNames, fileUrls: simulatedFileUrls } });
    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-foreground">ScizonAI</Link>
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Importar arquivos</h1>
            <p className="text-muted-foreground text-lg">Arraste seus arquivos ou clique para selecionar</p>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 animate-slide-up ${isDragging ? "border-foreground/50 bg-muted/20" : "border-border hover:border-muted-foreground/50 bg-card/30"}`}
          >
            <input type="file" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center transition-all duration-300 ${isDragging ? "scale-110" : ""}`}>
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">Solte os arquivos aqui</p>
                <p className="text-muted-foreground text-sm">ou clique para navegar</p>
              </div>
              <p className="text-muted-foreground text-xs">PDF, CSV, XLSX, JSON • Máx 50MB por arquivo</p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-8 space-y-3 animate-fade-in">
              <h3 className="text-sm font-medium text-foreground mb-4">Arquivos ({files.length})</h3>
              {files.map((file) => (
                <div key={file.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground text-sm font-medium truncate">{file.name}</p>
                      {file.status === "success" && <CheckCircle className="w-4 h-4 text-foreground flex-shrink-0" />}
                      {file.status === "error" && <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                    </div>
                    <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                    {file.status === "uploading" && (
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground transition-all duration-300 rounded-full" style={{ width: `${file.progress}%` }} />
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="flex-shrink-0 hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          {files.length > 0 && files.every((f) => f.status !== "uploading") && (
            <div className="mt-8 text-center animate-fade-in">
              <Button variant="default" size="lg" onClick={handleProcessFiles} disabled={isProcessing}>
                {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Processando...</>) : "Processar e Pagar"}
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ImportFilePage;