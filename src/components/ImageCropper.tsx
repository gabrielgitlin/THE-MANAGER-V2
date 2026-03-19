import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Move, Check, Upload } from 'lucide-react';

interface ImageCropperProps {
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
  initialFile?: File;
}

export default function ImageCropper({ onCropComplete, onCancel, initialFile }: ImageCropperProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cropSize = 280;
  const canvasSize = 360;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!initialFile) return;
    loadImageFromFile(initialFile);
  }, [initialFile]);

  const loadImageFromFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsLoading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setIsLoading(false);
        alert('Error loading image. Please try a different file.');
      };

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const minScale = Math.max(cropSize / img.width, cropSize / img.height);
        setScale(Math.max(minScale, 0.3));
        setPosition({ x: 0, y: 0 });
        setImage(img);
        setIsLoading(false);
      };

      img.src = objectUrl;
    } catch {
      setIsLoading(false);
      alert('Error loading image. Please try again.');
    }
  };

  const drawImage = useCallback(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    const x = (canvas.width - scaledWidth) / 2 + position.x;
    const y = (canvas.height - scaledHeight) / 2 + position.y;

    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const cropX = (canvas.width - cropSize) / 2;
    const cropY = (canvas.height - cropSize) / 2;
    ctx.fillRect(0, 0, canvas.width, cropY);
    ctx.fillRect(0, cropY + cropSize, canvas.width, cropY);
    ctx.fillRect(0, cropY, cropX, cropSize);
    ctx.fillRect(cropX + cropSize, cropY, cropX, cropSize);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    const third = cropSize / 3;
    ctx.beginPath();
    ctx.moveTo(cropX + third, cropY);
    ctx.lineTo(cropX + third, cropY + cropSize);
    ctx.moveTo(cropX + third * 2, cropY);
    ctx.lineTo(cropX + third * 2, cropY + cropSize);
    ctx.moveTo(cropX, cropY + third);
    ctx.lineTo(cropX + cropSize, cropY + third);
    ctx.moveTo(cropX, cropY + third * 2);
    ctx.lineTo(cropX + cropSize, cropY + third * 2);
    ctx.stroke();
  }, [image, scale, position, cropSize]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadImageFromFile(file);
  };

  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !image) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!image) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !image) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleZoom = (delta: number) => {
    if (!image) return;
    const minScale = Math.max(cropSize / image.width, cropSize / image.height);
    setScale(prev => Math.max(minScale, Math.min(4, prev + delta)));
  };

  const handleCrop = () => {
    if (!canvasRef.current || !image) return;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = 280;
    outputCanvas.height = 280;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const imgX = (canvasSize - scaledWidth) / 2 + position.x;
    const imgY = (canvasSize - scaledHeight) / 2 + position.y;

    const cropX = (canvasSize - cropSize) / 2;
    const cropY = (canvasSize - cropSize) / 2;

    const sourceX = (cropX - imgX) / scale;
    const sourceY = (cropY - imgY) / scale;
    const sourceSize = cropSize / scale;

    outputCtx.drawImage(
      image,
      sourceX, sourceY, sourceSize, sourceSize,
      0, 0, 280, 280
    );

    outputCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.75);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!mounted) return null;

  const content = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: '#111827',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '420px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1f2937' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Crop Cover Image</h3>
          <button
            onClick={onCancel}
            type="button"
            style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {isLoading ? (
            <div style={{
              border: '2px dashed #374151',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 12px',
                border: '3px solid #374151',
                borderTop: '3px solid #00C853',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{ color: '#d1d5db', fontWeight: 500 }}>Loading image...</div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : !image ? (
            <div
              onClick={handleSelectFileClick}
              style={{
                border: '2px dashed #374151',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#4b5563';
                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#374151';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Upload style={{ width: '40px', height: '40px', color: '#6b7280', margin: '0 auto 12px' }} />
              <div style={{ color: '#d1d5db', fontWeight: 500, marginBottom: '8px' }}>Click to select an image</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectFileClick();
                }}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#00C853',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginBottom: '8px',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#00B548'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#00C853'}
              >
                Choose File
              </button>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>JPEG, PNG, GIF, or WebP</div>
            </div>
          ) : (
            <>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'move',
                  margin: '0 auto',
                  maxWidth: '100%',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <canvas
                  ref={canvasRef}
                  width={canvasSize}
                  height={canvasSize}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '9999px',
                  padding: '6px 12px',
                }}>
                  <Move style={{ width: '14px', height: '14px', color: '#d1d5db' }} />
                  <span style={{ fontSize: '12px', color: '#d1d5db' }}>Drag to position</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleZoom(-0.15)}
                  style={{
                    padding: '10px',
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                >
                  <ZoomOut style={{ width: '20px', height: '20px', color: '#fff' }} />
                </button>
                <div style={{ width: '96px', height: '8px', backgroundColor: '#1f2937', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#00C853',
                      borderRadius: '9999px',
                      transition: 'width 0.15s',
                      width: `${Math.min(100, (scale / 4) * 100)}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleZoom(0.15)}
                  style={{
                    padding: '10px',
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                >
                  <ZoomIn style={{ width: '20px', height: '20px', color: '#fff' }} />
                </button>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        />

        <div style={{ display: 'flex', gap: '12px', padding: '0 20px 20px' }}>
          {image && (
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setScale(1);
                setPosition({ x: 0, y: 0 });
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
          >
            Cancel
          </button>
          {image && (
            <button
              type="button"
              onClick={handleCrop}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#00C853',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#00B548'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#00C853'}
            >
              <Check style={{ width: '16px', height: '16px' }} />
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
