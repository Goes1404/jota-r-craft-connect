/**
 * Compressão de imagens no navegador antes do upload.
 * Permite que o lojista envie fotos direto da câmera (10–25MB) sem erro:
 * redimensiona para no máximo `maxDimension` px e re-encoda em WebP
 * (fallback JPEG), tipicamente reduzindo para menos de 1MB.
 */

export const MAX_INPUT_SIZE = 25 * 1024 * 1024; // 25MB de arquivo original

interface CompressOptions {
  maxDimension?: number; // maior lado, em px
  quality?: number;      // 0..1
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Não foi possível ler a imagem "${file.name}".`));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Comprime/redimensiona um arquivo de imagem. Retorna um novo File pronto
 * para upload. Se a compressão não reduzir o tamanho, mantém o original.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1920, quality = 0.85 } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" não é uma imagem.`);
  }
  if (file.size > MAX_INPUT_SIZE) {
    throw new Error(`"${file.name}" é muito grande (máx. 25MB).`);
  }

  const img = await loadImage(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    // Já é pequena e não precisa redimensionar → envia como está.
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return file;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    let blob = await canvasToBlob(canvas, 'image/webp', quality);
    let ext = 'webp';
    if (!blob || blob.type !== 'image/webp') {
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      ext = 'jpg';
    }
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, { type: blob.type });
  } finally {
    URL.revokeObjectURL(img.src);
  }
}
