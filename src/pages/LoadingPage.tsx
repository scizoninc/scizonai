// src/pages/LoadingPage.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL = 2000; // ms

const LoadingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as { jobId?: string };
  const jobId = state.jobId;

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Iniciando processamento...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    let mounted = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        if (!res.ok) throw new Error("Erro ao checar status");
        const data = await res.json(); // { status: 'processing'|'completed'|'error', progress: number, message?: string, resultReady?: boolean }
        if (!mounted) return;
        setProgress(Math.min(100, Math.max(0, data.progress ?? 0)));
        setStatusText(data.message ?? (data.status === "processing" ? "Processando..." : data.status));
        if (data.status === "completed") {
          // redireciona para checkout
          navigate("/checkout", { state: { jobId } });
        } else if (data.status === "error") {
          setError(data.message || "Erro no processamento");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Erro desconhecido");
      }
    };

    // primeira chamada imediata
    poll();
    const timer = setInterval(poll, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [jobId, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-xl p-8 bg-card rounded-2xl shadow-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Seu relatório está sendo gerado</h2>
        <p className="text-sm text-muted-foreground mb-6">{statusText}</p>

        <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </div>

        <p className="text-xs text-muted-foreground mb-6">{Math.round(progress)}%</p>

        {error ? (
          <>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate("/")}>Voltar</Button>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Aguarde — isso pode levar alguns segundos a alguns minutos dependendo do tamanho do arquivo.</p>
        )}
      </div>
    </main>
  );
};

export default LoadingPage;
