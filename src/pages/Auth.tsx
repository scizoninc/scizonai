import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        });
        
        // Redirect to external dashboard with auth token
        if (data.session) {
          const dashboardUrl = new URL('https://dashboardscizonai.vercel.app/dashboard/auth-receiver');
          dashboardUrl.searchParams.set('token', data.session.access_token);
          dashboardUrl.searchParams.set('email', email);
          
          setTimeout(() => {
            window.location.href = dashboardUrl.toString();
          }, 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `https://dashboardscizonai.vercel.app/dashboard/default`,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Conta criada com sucesso!",
          description: "Redirecionando para o dashboard...",
        });
        
        // Redirect to external dashboard with auth token
        if (data.session) {
          const dashboardUrl = new URL('https://dashboardscizonai.vercel.app/dashboard/auth-receiver');
          dashboardUrl.searchParams.set('token', data.session.access_token);
          dashboardUrl.searchParams.set('email', email);
          
          setTimeout(() => {
            window.location.href = dashboardUrl.toString();
          }, 1000);
        } else {
          // If no session (email confirmation required), redirect to local dashboard
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        {/* Back button */}
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8" />
            <span className="text-3xl font-bold">Scizon AI</span>
          </div>
          <p className="text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Não tem uma conta? Criar conta" : "Já tem uma conta? Entrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
