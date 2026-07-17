import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';

interface MultiImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  currentImages?: string[];
  className?: string;
  maxImages?: number;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ 
  onImagesChange, 
  currentImages = [], 
  className = "",
  maxImages = 10
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [images, setImages] = useState<string[]>(currentImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mantém em sincronia quando o pai altera as imagens (ex.: geradas por IA)
  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validar limite de imagens
    if (images.length + files.length > maxImages) {
      toast({
        title: 'Limite excedido',
        description: `Você pode adicionar no máximo ${maxImages} imagens por produto.`,
        variant: 'destructive',
      });
      return;
    }

    const fileList = Array.from(files);
    setUploading(true);
    setProgress({ done: 0, total: fileList.length });

    try {
      const uploadFile = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        return publicUrl;
      };

      // Comprime UMA foto por vez (canvas pesa na thread da interface — em
      // paralelo travava a tela com várias fotos grandes). O upload de cada
      // uma dispara em seguida e roda em paralelo, pois é só rede.
      const uploadPromises: Promise<string>[] = [];
      const compressErrors: string[] = [];
      for (const rawFile of fileList) {
        if (!rawFile.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          compressErrors.push(`Formato inválido: ${rawFile.name}. Use JPG, PNG ou WEBP.`);
          continue;
        }
        try {
          const file = await compressImage(rawFile);
          uploadPromises.push(
            uploadFile(file).finally(() =>
              setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
            )
          );
        } catch (err: any) {
          compressErrors.push(err.message || `Falha ao processar ${rawFile.name}.`);
        }
        // Devolve o controle ao navegador entre uma compressão e outra
        await new Promise((r) => setTimeout(r, 0));
      }

      // Mantém as imagens que subiram mesmo se alguma falhar no meio
      const results = await Promise.allSettled(uploadPromises);
      const newUrls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map((r) => r.value);
      const failures = compressErrors.length + results.filter((r) => r.status === 'rejected').length;

      if (newUrls.length > 0) {
        const updatedImages = [...images, ...newUrls];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      }

      if (failures === 0) {
        toast({
          title: 'Upload realizado!',
          description: `${newUrls.length} imagem(ns) carregada(s) com sucesso.`,
        });
      } else {
        toast({
          title: newUrls.length > 0 ? 'Upload parcial' : 'Erro no upload',
          description: `${newUrls.length} enviada(s), ${failures} falhou(aram). ${compressErrors[0] ?? 'Tente novamente as que faltaram.'}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer o upload das imagens.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(from, 1);
    updatedImages.splice(to, 0, movedImage);
    
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>Imagens do Produto ({images.length}/{maxImages})</Label>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                {progress ? `Enviando ${Math.min(progress.done + 1, progress.total)}/${progress.total}...` : 'Enviando...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-3 w-3" />
                Adicionar
              </div>
            )}
          </Button>
        )}
      </div>

      {/* Grid de imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                <img
                  src={imageUrl}
                  alt={`Produto ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Controles da imagem */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs"
                    onClick={() => moveImage(index, index - 1)}
                    title="Mover para esquerda"
                  >
                    ←
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveImage(index)}
                  title="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </Button>
                
                {index < images.length - 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs"
                    onClick={() => moveImage(index, index + 1)}
                    title="Mover para direita"
                  >
                    →
                  </Button>
                )}
              </div>

              {/* Badge da posição */}
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Área de upload inicial */}
      {images.length === 0 && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">Adicione imagens do produto</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste e solte ou clique para selecionar até {maxImages} imagens
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                {progress ? `Enviando ${Math.min(progress.done + 1, progress.total)}/${progress.total}...` : 'Enviando...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Selecionar Imagens
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Formatos aceitos: JPG, JPEG, PNG, WEBP (até 25MB — comprimimos automaticamente). A primeira imagem será a principal.
      </p>
    </div>
  );
};

export default MultiImageUpload;