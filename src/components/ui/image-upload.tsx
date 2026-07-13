'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToImgBB } from '@/lib/upload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string;
  label?: string;
  className?: string;
  iconClassName?: string;
  compact?: boolean;
  aspect?: "square" | "video" | "banner";
}

export function ImageUpload({ onUpload, value, label, className, iconClassName, compact, aspect = "banner" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const generatedId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setLoading(true);
    try {
      const url = await uploadToImgBB(file);
      onUpload(url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
      if ('target' in e && 'value' in e.target) {
        (e.target as any).value = '';
      }
      setIsDragging(false);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpload('');
  };

  return (
    <div className={cn("w-full", !compact && "space-y-3")}>
      {label && !compact && <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</Label>}
      
      <div className="relative group h-full">
        <Label
          htmlFor={generatedId}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileChange}
          className={cn(
            "relative flex flex-col items-center justify-center w-full transition-all duration-300 overflow-hidden",
            compact ? "h-full min-h-0 rounded-lg border-0 bg-transparent" : "min-h-[120px] rounded-2xl border-2 border-dashed",
            isDragging 
              ? "border-primary bg-primary/5 scale-[0.99]" 
              : !compact && "border-gray-200 bg-gray-50/50 hover:bg-white hover:border-primary hover:shadow-xl hover:shadow-primary/5",
            loading && "opacity-70 cursor-not-allowed",
            className
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={cn("animate-spin text-primary", compact ? "h-4 w-4" : "h-10 w-10")} />
              {!compact && <p className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-tighter">Uploading...</p>}
            </div>
          ) : value ? (
            <div className={cn("flex flex-col items-center w-full", compact ? "p-0 h-full" : "p-4")}>
               <div className={cn(
                  "relative rounded-xl overflow-hidden border-2 border-white shadow-xl group/img transition-all duration-500",
                  compact ? "h-full w-full rounded-none border-0 shadow-none" : "w-full max-h-[400px]",
                  !compact && aspect === "banner" && "aspect-[21/9]",
                  !compact && aspect === "video" && "aspect-video",
                  !compact && aspect === "square" && "aspect-square max-w-[200px]"
                )}>
                  <Image src={value} alt="Preview" fill unoptimized className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="flex items-center gap-2">
                         <ImageIcon className={cn("text-white", compact ? "h-4 w-4" : "h-6 w-6")} />
                         {!compact && <span className="text-white text-xs font-bold uppercase tracking-widest">Replace Image</span>}
                      </div>
                  </div>
               </div>
               {!compact && (
                 <div className="flex items-center justify-between w-full mt-4 bg-white/50 p-3 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-bold text-gray-900 truncate">Image Selected</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tight font-medium">Professional Quality • PNG, JPG or WEBP</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all active:scale-90 shadow-sm"
                    onClick={removeImage}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                 </div>
               )}
            </div>
          ) : (
            <div className={cn("flex flex-col items-center text-center", compact ? "gap-1 p-0" : "gap-2 p-6")}>
              <div className={cn(
                "rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
                compact ? "p-1.5 rounded-lg" : "p-3",
                iconClassName
              )}>
                <Upload className={cn("text-primary", compact ? "h-4 w-4" : "h-6 w-6")} />
              </div>
              {!compact && (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">
                    Click to <span className="text-primary underline underline-offset-4">upload</span>
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                    PNG, JPG or WEBP (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          )}
          
          <Input
            id={generatedId}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
            accept="image/*"
          />
        </Label>
      </div>
    </div>
  );
}



