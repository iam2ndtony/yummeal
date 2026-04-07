'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, RefreshCcw, Check, X as XIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { updateRecipeImage } from '@/actions/recipes';

interface Point {
  x: number;
  y: number;
}

export default function RecipeImageUpload({ recipeId, initialImage }: { recipeId: string, initialImage?: string }) {
  const [image, setImage] = useState(initialImage);
  const [isUploading, setIsUploading] = useState(false);
  
  // Crop state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset file input so user can pick the same file again if they cancel
    e.target.value = '';
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Xử lý resize nếu ảnh quá to (tránh lag database)
    const MAX_WIDTH = 800;
    if (pixelCrop.width > MAX_WIDTH) {
      const scaledCanvas = document.createElement('canvas');
      const scaleCtx = scaledCanvas.getContext('2d');
      scaledCanvas.width = MAX_WIDTH;
      scaledCanvas.height = (pixelCrop.height * MAX_WIDTH) / pixelCrop.width;
      scaleCtx?.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      return scaledCanvas.toDataURL('image/jpeg', 0.8);
    }

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleSaveCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (!croppedBase64) throw new Error('Cannot crop image');
      
      // Update UI first for fast feedback
      setImage(croppedBase64);
      setCropImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      await updateRecipeImage(recipeId, croppedBase64);
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi xử lý ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Crop Modal */}
      {cropImageSrc && mounted && createPortal(
        <div id="crop-modal-overlay" style={{
          position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: '#000',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ position: 'relative', flex: 1, backgroundColor: '#000' }}>
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div style={{ 
            padding: '24px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px',
            borderTopLeftRadius: '24px', borderTopRightRadius: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontWeight: 600, minWidth: '80px' }}>Phóng to:</span>
              <input 
                type="range" 
                min={1} 
                max={3} 
                step={0.1} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))} 
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                onClick={handleCancelCrop}
                disabled={isUploading}
                style={{
                  padding: '12px 24px', borderRadius: '99px', border: 'none', 
                  background: '#f0f0f0', color: '#333', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveCrop}
                disabled={isUploading}
                style={{
                  padding: '12px 24px', borderRadius: '99px', border: 'none', 
                  background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {isUploading ? <RefreshCcw size={18} className="spin" /> : <Check size={18} />}
                {isUploading ? 'Đang lưu...' : 'Cắt & Lưu ảnh'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main UI */}
      <div style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#f5f1e9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <label style={{
              position: 'absolute', bottom: 16, right: 16, background: 'rgba(255,255,255,0.9)', padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)',
              transition: 'all 0.2s'
            }}>
              <Camera size={16} /> Đổi ảnh
              <input type="file" accept="image/*" style={{ display: 'none' }} key={Date.now()} onChange={handleFileChange} />
            </label>
          </>
        ) : (
          <label style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', 
            color: 'var(--primary)', padding: '40px', border: '2px dashed rgba(211,84,0,0.3)', borderRadius: 16,
            transition: 'all 0.2s'
          }} className="hoverable-box">
            <style>{`.hoverable-box:hover { background: rgba(211,84,0,0.05); }`}</style>
            <Camera size={32} />
            <span style={{ fontWeight: 600 }}>Tự tải ảnh của bạn lên</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} key={Date.now()} onChange={handleFileChange} />
          </label>
        )}
      </div>
    </>
  );
}
