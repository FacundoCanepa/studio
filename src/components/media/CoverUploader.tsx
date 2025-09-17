'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateImage } from '@/lib/strapi-media-config';
import { uploadFileToStrapi } from '@/lib/strapi-upload';
import { formatBytes } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ProgressBar } from '@/components/media/ProgressBar';

export type CoverAsset = {
  id: number;
  url: string;
  name: string;
  size: number; // in bytes
};

interface CoverUploaderProps {
  documentId: string;
  initialAsset?: CoverAsset;
  onAssetChange: (assetId: number | null) => void;
}

export const CoverUploader = ({
  documentId,
  initialAsset,
  onAssetChange,
}: CoverUploaderProps) => {
  const [currentAsset, setCurrentAsset] = React.useState<CoverAsset | null>(initialAsset || null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialAsset?.url || null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<'idle' | 'uploading' | 'pending_removal' | 'pending_upload'>('idle');
  const [progress, setProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File | null | undefined) => {
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.ok) {
      toast({
        title: 'Archivo no válido',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus('pending_upload');
  };

  const handleUpload = async () => {
    if (!pendingFile) return;

    setStatus('uploading');
    setProgress(0);

    try {
      const assetId = await uploadFileToStrapi(pendingFile, setProgress);
      onAssetChange(assetId);
      setCurrentAsset({
          id: assetId,
          url: previewUrl!,
          name: pendingFile.name,
          size: pendingFile.size
      });
      setStatus('idle');
      setPendingFile(null);
      toast({ title: 'Éxito', description: 'La nueva imagen de portada se ha subido. Guarda el artículo para aplicar el cambio.' });
    } catch (error: any) {
      toast({
        title: 'Error de subida',
        description: error.message || 'No se pudo subir el archivo.',
        variant: 'destructive',
      });
      setStatus('idle');
    } finally {
        setProgress(0);
    }
  };
  
  const handleRemoveClick = () => {
    setStatus('pending_removal');
    onAssetChange(null);
    setCurrentAsset(null);
    setPreviewUrl(null);
  };
  
  const handleCancelChange = () => {
      setStatus('idle');
      setPendingFile(null);
      if (initialAsset) {
          setPreviewUrl(initialAsset.url);
          onAssetChange(initialAsset.id);
      } else {
          setPreviewUrl(null);
          onAssetChange(null);
      }
  }

  const renderContent = () => {
    if (status === 'uploading') {
      return (
        <div className="text-center p-4">
          <p className="font-semibold mb-2">Subiendo...</p>
          <ProgressBar value={progress} />
          <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
        </div>
      );
    }
    
     if (status === 'pending_removal') {
        return (
             <div className="text-center p-4">
                <p className="text-destructive font-semibold">El cover se quitará al guardar.</p>
                <Button type="button" variant="link" size="sm" onClick={() => {
                    setStatus('idle');
                    setCurrentAsset(initialAsset || null);
                    setPreviewUrl(initialAsset?.url || null);
                    onAssetChange(initialAsset?.id || null);
                }}>Cancelar</Button>
            </div>
        )
    }

    if (previewUrl && (currentAsset || pendingFile)) {
      const assetDetails = pendingFile ? { name: pendingFile.name, size: pendingFile.size } : currentAsset;
      return (
        <div className="p-4">
          <div className="relative aspect-video rounded-md overflow-hidden mb-4">
            <Image src={previewUrl} alt="Vista previa del cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
          {assetDetails && (
            <div className="text-sm text-muted-foreground mb-4">
              <p className="font-medium text-foreground truncate">{assetDetails.name}</p>
              <p>{formatBytes(assetDetails.size)}</p>
            </div>
          )}

          {status === 'pending_upload' ? (
             <div className="space-y-2">
                <p className="text-sm font-semibold text-primary">Hay un cambio pendiente.</p>
                <Button type="button" onClick={handleUpload} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Confirmar y Subir
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancelChange} className="w-full">Cancelar Cambio</Button>
            </div>
          ) : (
             <div className="grid grid-cols-2 gap-2">
 <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Reemplazar</Button>
 <Button type="button" variant="destructive" onClick={handleRemoveClick}>Quitar</Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            handleFileSelect(e.dataTransfer.files?.[0]);
        }}
      >
        <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
        <p className="font-semibold">Subir Cover</p>
        <p className="text-sm text-muted-foreground">Arrastra una imagen o haz clic aquí</p>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        {renderContent()}
      </CardContent>
    </Card>
  );
};
