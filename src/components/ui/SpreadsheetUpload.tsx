import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SpreadsheetUploadProps {
  onUploadComplete?: (fileUrl: string) => void;
}

const SpreadsheetUpload = ({ onUploadComplete }: SpreadsheetUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const acceptedFileTypes = [
    '.xlsx',
    '.xls',
    '.csv',
    '.ods',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/vnd.oasis.opendocument.spreadsheet'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedFileTypes.some(type => 
      type.startsWith('.') ? fileExtension === type : selectedFile.type === type
    );

    if (!isValidType) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls), CSV ou ODS.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para fazer upload.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('spreadsheets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('spreadsheets')
        .getPublicUrl(fileName);

      // Store metadata in database
      const { error: dbError } = await supabase
        .from('spreadsheet_uploads')
        .insert({
          user_id: session.user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload concluído!",
        description: "Redirecionando para o dashboard...",
      });

      // Store auth token and file info for dashboard
      const token = session.access_token;
      const userEmail = session.user.email;
      
      // Redirect to external dashboard with auth info
      const dashboardUrl = new URL('https://dashboardscizonai.vercel.app/dashboard/default');
      dashboardUrl.searchParams.set('token', token);
      dashboardUrl.searchParams.set('email', userEmail || '');
      dashboardUrl.searchParams.set('fileUrl', publicUrl);
      dashboardUrl.searchParams.set('fileName', file.name);
      
      window.location.href = dashboardUrl.toString();

      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao fazer upload do arquivo.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          className={`rounded-2xl border-2 border-dashed ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          } bg-card p-12 text-center hover:border-primary/50 transition-colors cursor-pointer`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Arraste sua planilha aqui</h3>
          <p className="text-muted-foreground mb-6">
            ou clique para selecionar (Excel, CSV, ODS)
          </p>
          <Button type="button">
            Selecionar arquivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileInput}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? "Fazendo upload..." : "Fazer upload e ir para o dashboard"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetUpload;
