// src/pages/ImportFilePage.tsx
import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
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

  // Envia os arquivos para o backend e inicia o job no HF Space
  const handleProcessFiles = async () => {
    if (files.length === 0) return;

    const readyFiles = files.filter((f) => f.status === "ready" && f.file);
    if (readyFiles.length === 0) {
      toast({ title: "Nenhum arquivo válido", description: "Selecione arquivos para processar." });
      return;
    }

    const form = new FormData();
    readyFiles.forEach((f) => {
      if (f.file) form.append("files", f.file, f.name);
    });

    setFiles((prev) =>
      prev.map((f) => (readyFiles.find((r) => r.id === f.id) ? { ...f, status: "uploading", progress: 5 } : f))
    );

    try {
      const resp = await fetch("/api/energent/run", {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || "Erro no upload");
      }

      const data = await resp.json(); // { jobId }
      const jobId = data.jobId;
      toast({ title: "Processamento iniciado", description: "Seu arquivo está sendo processado." });

      setFiles((prev) =>
        prev.map((f) => (readyFiles.find((r) => r.id === f.id) ? { ...f, status: "success", progress: 100 } : f))
      );

      navigate("/loading", { state: { jobId, files: readyFiles.map((r) => r.name) } });
    } catch (err: any) {
      console.error(err);
      setFiles((prev) => prev.map((f) => (f.status === "uploading" ? { ...f, status: "error", progress: 0 } : f)));
      toast({ title: "Erro", description: err.message || "Erro ao enviar arquivo." });
    }
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
              <Button variant="default" size="lg" onClick={handleProcessFiles}>Processar arquivos</Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ImportFilePage;
