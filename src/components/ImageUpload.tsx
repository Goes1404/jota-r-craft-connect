import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  currentImage?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageUpload, 
  currentImage, 
  className = "" 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = event.target.files?.[0];
    if (!rawFile) return;

    // Validar tipo de arquivo
    if (!rawFile.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione apenas arquivos JPG, JPEG, PNG ou WEBP.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Comprime no navegador — aceita fotos grandes (até 25MB) sem erro
      const file = await compressImage(rawFile);
      // Criar preview local
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      onImageUpload(publicUrl);

      toast({
        title: 'Upload realizado!',
        description: 'Imagem carregada com sucesso.',
      });

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer o upload da imagem.',
        variant: 'destructive',
      });
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Imagem do Produto</Label>
      
      <div className="space-y-4">
        {/* Preview da imagem */}
        {preview && (
          <div className="relative w-full max-w-xs mx-auto">
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Área de upload */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {preview ? <ImageIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                {preview ? 'Trocar Imagem' : 'Selecionar Imagem'}
              </div>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Formatos aceitos: JPG, JPEG, PNG, WEBP (até 25MB — comprimimos automaticamente)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;