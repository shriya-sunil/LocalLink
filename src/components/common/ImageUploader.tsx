import React, { useRef } from 'react';
import { Camera, X, Image as ImageIcon, Plus } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  hint?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images = [],
  onChange,
  maxImages = 5,
  label,
  hint,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImgs = [...images];
    Array.from(files).forEach((file) => {
      if (newImgs.length < maxImages) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImgs.push(event.target.result as string);
            onChange([...newImgs]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addSamplePhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4b69?auto=format&fit=crop&w=600&q=80',
    ];
    const nextPhoto = samplePhotos[images.length % samplePhotos.length];
    if (images.length < maxImages) {
      onChange([...images, nextPhoto]);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-semibold text-navy">{label}</label>}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
        {images.map((imgUrl, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-sage-border group shadow-sm bg-white">
            <img src={imgUrl} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 p-1 rounded-full bg-navy/80 text-white hover:bg-coral transition-colors"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-sage-hover hover:border-teal bg-white/70 hover:bg-teal-light flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer"
            >
              <Camera size={22} className="text-teal mb-1" />
              <span className="text-[11px] font-semibold text-navy leading-tight">Add Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {images.length < maxImages && (
        <button
          type="button"
          onClick={addSamplePhoto}
          className="inline-flex items-center gap-1.5 text-xs text-teal font-semibold hover:underline mt-1 pt-1"
        >
          <Plus size={13} />
          <span>Insert demo sample photo</span>
        </button>
      )}
    </div>
  );
};
