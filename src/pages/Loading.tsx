// src/pages/LoadingPage.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL = 2500;

const LoadingPage = () => {
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { jobId, files } = location.state || {};
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Enviando...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) { navigate("/"); return; }
    let mounted = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/energent/status?id=${encodeURIComponent(jobId)}`);
        if (!res.ok) throw new Error("Erro ao checar status");
        const data = await res.json();
        if (!mounted) return;
        const p = data.progress ?? (data.status === "completed" ? 100 : 30);
        setProgress(Math.min(100, p));
        setStatusText(data.message ?? data.status ?? "Processando...");
        if (["completed", "finished", "succeeded"].includes(String(data.status))) {
          // coleta URLs se houver
          const urls: string[] = [];
          if (data.result_url) urls.push(data.result_url);
          if (data.result_urls && Array.isArray(data.result_urls)) urls.push(...data.result_urls);
          if (data.raw && data.raw.result_url) urls.push(data.raw.result_url);
          // unique
          const unique = Array.from(new Set(urls));
          navigate("/checkout", { state: { jobId, files, fileUrls: unique } });
        } else if (["error", "failed", "FAILED"].includes(String(data.status))) {
          setError(data.message || "Erro no processamento");
        }
      } catch (err: any) {
        console.error("poll error", err);
        setError(err.message || "Erro desconhecido");
      }
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => { mounted = false; clearInterval(timer); };
  }, [jobId, files, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-xl p-8 bg-card rounded-2xl shadow-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Gerando seu relatório</h2>
        <p className="text-sm text-muted-foreground mb-6">{statusText}</p>

        <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </div>

        <p className="text-xs text-muted-foreground mb-6">{Math.round(progress)}%</p>

        {error ? (
          <>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate("/import")}>Voltar</Button>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Aguarde — isso pode levar alguns segundos a alguns minutos dependendo do tamanho do arquivo.</p>
        )}
      </div>
    </main>
  );
};

export default LoadingPage;
