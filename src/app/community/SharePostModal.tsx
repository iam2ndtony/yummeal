'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, Loader2, Check, ChevronDown } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { createCommunityPost } from '@/actions/community';

interface Recipe { id: string; title: string; }

interface Point { x: number; y: number; }

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string | null> {
  const img = new Image();
  img.src = imageSrc;
  await new Promise((res) => (img.onload = res));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  const MAX = 1000;
  if (pixelCrop.width > MAX) {
    const sc = document.createElement('canvas');
    const scCtx = sc.getContext('2d');
    sc.width = MAX; sc.height = (pixelCrop.height * MAX) / pixelCrop.width;
    scCtx?.drawImage(canvas, 0, 0, sc.width, sc.height);
    return sc.toDataURL('image/jpeg', 0.85);
  }
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function SharePostModal({ recipes, onSuccess }: { recipes: Recipe[]; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'upload' | 'crop' | 'details'>('upload');

  // Image
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Details
  const [caption, setCaption] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const onCropComplete = useCallback((_: any, pixels: any) => { setCroppedAreaPixels(pixels); }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setRawSrc(reader.result as string); setStep('crop'); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async () => {
    if (!rawSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(rawSrc, croppedAreaPixels);
    setCroppedSrc(cropped);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!croppedSrc) return;
    setIsLoading(true);
    const res = await createCommunityPost({
      imageBase64: croppedSrc,
      caption: caption.trim() || undefined,
      recipeId: selectedRecipeId || undefined,
    });
    setIsLoading(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setStep('upload');
        setRawSrc(null); setCroppedSrc(null); setCaption(''); setSelectedRecipeId(''); setSuccess(false);
        onSuccess();
      }, 1200);
    }
  };

  const handleOpen = () => { setIsOpen(true); setStep('upload'); };
  const handleClose = () => {
    setIsOpen(false);
    setStep('upload'); setRawSrc(null); setCroppedSrc(null); setCaption(''); setSelectedRecipeId('');
  };

  return (
    <>
      <button
        onClick={handleOpen}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '99px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(211,84,0,0.2)', fontSize: '0.95rem', transition: 'all 0.2s' }}
      >
        <Camera size={18} /> Chia sẻ ảnh
      </button>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      {isOpen && mounted && createPortal(
        <div
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          {/* ── STEP 1: UPLOAD ── */}
          {step === 'upload' && (
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '28px', padding: '40px', width: '100%', maxWidth: '480px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
              <button onClick={handleClose} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '16px' }}></button>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffedd5, #fed7aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Camera size={32} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Khoe thành quả nào!</h2>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Chia sẻ những món ngon bạn đã nấu theo Yummeal nhé</p>

              <button
                onClick={() => fileRef.current?.click()}
                style={{ width: '100%', padding: '20px', border: '2px dashed #e2e8f0', borderRadius: '20px', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.background = '#fffaf7'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ fontSize: '2.5rem' }}>📸</div>
                <span style={{ fontWeight: 700, color: '#334155' }}>Chọn ảnh từ thiết bị</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>JPG, PNG, WEBP – tối đa 10MB</span>
              </button>

              <button onClick={handleClose} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>Để sau</button>
            </div>
          )}

          {/* ── STEP 2: CROP ── */}
          {step === 'crop' && rawSrc && (
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#0f172a', borderRadius: '28px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                <h3 style={{ color: 'white', margin: 0, fontWeight: 700 }}>Chỉnh sửa ảnh</h3>
                <button
                  onClick={handleCropConfirm}
                  style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '99px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Xác nhận →
                </button>
              </div>

              <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                <Cropper
                  image={rawSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.04)' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 10px 0', textAlign: 'center' }}>Thu phóng</p>
                <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} />
              </div>
            </div>
          )}

          {/* ── STEP 3: DETAILS ── */}
          {step === 'details' && croppedSrc && (
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <button onClick={() => setStep('crop')} style={{ background: '#f8fafc', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>←</button>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Thêm chi tiết</h3>
                <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', gap: '20px', padding: '24px' }}>
                {/* Preview */}
                <img src={croppedSrc} alt="preview" style={{ width: '130px', height: '130px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Caption */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.85rem', marginBottom: '8px' }}>Chia sẻ cảm nghĩ của bạn</label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Món này ngon lắm! Lần đầu làm theo Yummeal..."
                      maxLength={300}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '0.9rem', minHeight: '90px', resize: 'none', outline: 'none', lineHeight: '1.5', transition: 'border 0.2s', fontFamily: 'inherit' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={(e) => (e.target.style.borderColor = '#f1f5f9')}
                    />
                    <p style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>{caption.length}/300</p>
                  </div>

                  {/* Recipe link */}
                  {recipes.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.85rem', marginBottom: '8px' }}>Gắn với công thức</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={selectedRecipeId}
                          onChange={(e) => setSelectedRecipeId(e.target.value)}
                          style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '0.9rem', outline: 'none', background: 'white', appearance: 'none', cursor: 'pointer', transition: 'border 0.2s' }}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                          onBlur={(e) => (e.target.style.borderColor = '#f1f5f9')}
                        >
                          <option value="">— Không gắn công thức —</option>
                          {recipes.map((r) => (
                            <option key={r.id} value={r.id}>{r.title}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={handleClose} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#f8fafc', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || success}
                  style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: success ? '#22c55e' : 'var(--primary)', color: 'white', fontWeight: 700, cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px', justifyContent: 'center', transition: 'background 0.3s', boxShadow: '0 4px 12px rgba(211,84,0,0.2)' }}
                >
                  {success ? <><Check size={18} /> Đã đăng!</> : isLoading ? <><Loader2 size={18} className="spin" /> Đang đăng...</> : '🚀 Đăng ảnh'}
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
