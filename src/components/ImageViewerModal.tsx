import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset scale and position when opening a new image
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setHasMoved(false);
    }
  }, [isOpen, imageUrl]);

  // Handle ESC key to close and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 5));
      } else if (e.key === '-') {
        e.preventDefault();
        setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
      } else if (e.key === '0') {
        e.preventDefault();
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.35).toFixed(2)), 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.35).toFixed(2)), 0.5);
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleSetPreset = useCallback((targetScale: number) => {
    setScale(targetScale);
    if (targetScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((prev) => {
      const next = Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.5), 5);
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  // Click on image handler:
  // If user clicks without dragging, toggle zoom!
  const handleImageClick = (e: React.MouseEvent) => {
    // If the user was dragging the image, do not treat as click
    if (hasMoved) return;

    if (scale <= 1.05) {
      // Zoom in to 2x focused on clicked point
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left - rect.width / 2;
        const clickY = e.clientY - rect.top - rect.height / 2;
        // Shift opposite to bring clicked area into view
        setPosition({
          x: -clickX * 0.8,
          y: -clickY * 0.8,
        });
      }
      setScale(2);
    } else if (scale < 3) {
      // Step to 3x
      setScale(3);
    } else {
      // Reset back to fit (1x)
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - position.x - dragStart.x;
    const dy = e.clientY - position.y - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setHasMoved(true);
    }
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handling for mobile / trackpads
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
      setIsDragging(true);
      setHasMoved(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - position.x - touchStartRef.current.x;
    const dy = e.touches[0].clientY - position.y - touchStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      setHasMoved(true);
    }
    setPosition({
      x: e.touches[0].clientX - touchStartRef.current.x,
      y: e.touches[0].clientY - touchStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Toggle fullscreen mode on the container element
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-150"
      onMouseUp={handleMouseUp}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 text-white z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[280px] sm:max-w-md">
            {title || 'Детальный просмотр графика'}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Scale presets */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 mr-1 text-[11px] font-mono">
            <button
              onClick={() => handleSetPreset(1)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                scale === 1 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Вписать в экран"
            >
              100%
            </button>
            <button
              onClick={() => handleSetPreset(1.5)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                scale === 1.5 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Масштаб 150%"
            >
              150%
            </button>
            <button
              onClick={() => handleSetPreset(2)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                scale === 2 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Масштаб 200%"
            >
              200%
            </button>
            <button
              onClick={() => handleSetPreset(3)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                scale === 3 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Масштаб 300%"
            >
              300%
            </button>
          </div>

          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            title="Приблизить (+)"
          >
            <ZoomIn className="w-4 h-4 text-emerald-400" />
            <span className="text-xs hidden md:inline">Приблизить</span>
          </button>

          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            title="Отдалить (-)"
          >
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <span className="text-xs hidden md:inline">Отдалить</span>
          </button>

          <button
            onClick={handleResetZoom}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            title="Сбросить масштаб (100%)"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs hidden md:inline">Сброс</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Open original link if it's an external URL */}
          {!imageUrl.startsWith('data:') && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Открыть ссылку оригинала в новой вкладке"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors ml-1 cursor-pointer"
            title="Закрыть просмотрщик (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // If clicked directly on the background (not on the image), close modal
          if (e.target === containerRef.current && !hasMoved) {
            onClose();
          }
        }}
        className={`flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-4 relative ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt={title || 'Trade chart'}
          onClick={handleImageClick}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            maxHeight: scale === 1 ? '88vh' : undefined,
            maxWidth: scale === 1 ? '94vw' : undefined,
          }}
          className={`object-contain rounded-lg shadow-2xl transition-all ${
            scale <= 1 ? 'cursor-zoom-in' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          draggable={false}
        />

        {/* Floating bottom guidance hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-full text-xs text-slate-300 font-sans pointer-events-none shadow-2xl flex items-center gap-2.5 backdrop-blur-md">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ZoomIn className="w-3.5 h-3.5" />
            Клик: приблизить / отдалить
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Move className="w-3.5 h-3.5 text-slate-400" />
            Зажать и тянуть: перемещение
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-slate-400">Колесико мыши: масштаб</span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-slate-400">Esc: закрыть</span>
        </div>
      </div>
    </div>
  );
};
