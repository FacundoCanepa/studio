'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateImage } from '@/lib/strapi-media-config';
import { uploadFileToStrapi } from '@/lib/strapi-upload';
import { formatBytes } from '@/lib/utils';
import { Upload, X, GripVertical, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ItemGrid, type ItemType } from '@/components/media/ItemGrid';

export type CarouselAsset = ItemType & {
  url: string;
  name: string;
  size: number; // in bytes
  isNew?: boolean;
};

interface CarouselUploaderProps {
  documentId: string;
  initialAssets: CarouselAsset[];
  onAssetIdsChange: (assetIds: number[]) => void;
  max?: number;
}

const CarouselItem = ({ item, onRemove }: { item: CarouselAsset; onRemove: (id: number) => void; }) => (
    <div className="relative group border rounded-lg overflow-hidden aspect-video bg-card p-2 flex flex-col justify-between">
        <div className="relative flex-grow rounded-md overflow-hidden">
             <Image src={item.url} alt={item.name} fill className="object-cover" sizes="150px" />
        </div>
        <div className="pt-2 text-xs">
            <p className="font-medium text-foreground truncate">{item.name}</p>
            <p className="text-muted-foreground">{formatBytes(item.size)}</p>
        </div>
        <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(item.id)}
        >
            <X className="h-4 w-4" />
        </Button>
        {item.isNew && <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full">Nuevo</div>}
        <div className="absolute bottom-1 right-1 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" >
             <GripVertical className="h-5 w-5" />
        </div>
    </div>
);


export const CarouselUploader = ({
  documentId,
  initialAssets,
  onAssetIdsChange,
  max = 8,
}: CarouselUploaderProps) => {
  const [items, setItems] = React.useState<CarouselAsset[]>(initialAssets);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    onAssetIdsChange(items.map(item => item.id));
  }, [items, onAssetIdsChange]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const acceptedFiles = Array.from(files).slice(0, max - items.length);
    if (acceptedFiles.length === 0) {
        toast({ title: "Límite alcanzado", description: `Puedes subir un máximo de ${max} imágenes.`});
        return;
    }

    setIsLoading(true);

    const uploadPromises = acceptedFiles.map(async file => {
        const validation = validateImage(file);
        if (!validation.ok) {
            toast({ title: 'Archivo no válido', description: `${file.name}: ${validation.error}`, variant: 'destructive' });
            return null;
        }

        try {
            const assetId = await uploadFileToStrapi(file);
            return {
                id: assetId,
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                isNew: true,
            };
        } catch (error: any) {
            toast({ title: 'Error de subida', description: `No se pudo subir ${file.name}: ${error.message}`, variant: 'destructive' });
            return null;
        }
    });

    const newAssets = (await Promise.all(uploadPromises)).filter(Boolean) as CarouselAsset[];

    if (newAssets.length > 0) {
        setItems(prev => [...prev, ...newAssets]);
        toast({ title: 'Éxito', description: `${newAssets.length} imagen(es) subida(s). Guarda el artículo para aplicar los cambios.`});
    }

    setIsLoading(false);
  };

  const handleRemove = (idToRemove: number) => {
    setItems(prev => prev.filter(item => item.id !== idToRemove));
    toast({ title: 'Imagen eliminada de la lista', description: 'El cambio se aplicará al guardar el artículo.'});
  };

  const canAddMore = items.length < max;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Galería de Imágenes</CardTitle>
                <CardDescription>Arrastra para reordenar. Máximo {max} imágenes.</CardDescription>
            </div>
             <div className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                {items.length} / {max}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
            <ItemGrid items={items} setItems={setItems} itemComponent={CarouselItem} onRemove={handleRemove} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="font-semibold">No hay imágenes en la galería.</p>
            <p className="text-sm text-muted-foreground">Agrega imágenes para crear un carrusel.</p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Button 
            className="w-full mt-6" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMore || isLoading}
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isLoading ? 'Subiendo...' : 'Agregar imágenes'}
        </Button>
      </CardContent>
    </Card>
  );
};
