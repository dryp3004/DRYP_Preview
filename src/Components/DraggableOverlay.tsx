
import React, { useRef } from 'react';
import Image from 'next/image';

interface Position {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface DraggableOverlayProps {
  image: string;
  position: Position;
  setPosition: (position: Position) => void;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function DraggableOverlay({ 
  image, 
  position, 
  setPosition, 
  isSelected, 
  onClick,
  onDelete 
}: DraggableOverlayProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!elementRef.current || isResizing) return;

    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        ...position,
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!elementRef.current || isResizing) return;

    const touch = e.touches[0];
    const startX = touch.clientX - position.x;
    const startY = touch.clientY - position.y;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({
        ...position,
        x: touch.clientX - startX,
        y: touch.clientY - startY
      });
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleTouchMove);
    }, { once: true });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isSelected) return;

    e.preventDefault();
    if (e.shiftKey) {
      // Rotation
      setPosition({
        ...position,
        rotation: position.rotation + (e.deltaY > 0 ? 5 : -5)
      });
    } else {
      // Scaling
      setIsResizing(true);
      const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.max(0.1, Math.min(3, position.scale * scaleDelta));
      setPosition({
        ...position,
        scale: newScale
      });
      setTimeout(() => setIsResizing(false), 100);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResize = (e: React.MouseEvent | React.TouchEvent, _corner: string) => {
    e.stopPropagation();
    if (!elementRef.current) return;

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startScale = position.scale;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const delta = Math.max(deltaX, deltaY);
      const scaleFactor = 0.005;
      const newScale = Math.max(0.1, Math.min(3, startScale + delta * scaleFactor));
      
      setPosition({
        ...position,
        scale: newScale
      });
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      setIsResizing(false);
    };

    setIsResizing(true);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  return (
    <div
      ref={elementRef}
      className={`absolute ${isResizing ? '' : 'cursor-move'}`}
      style={{ 
        left: position.x,
        top: position.y,
        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
        transformOrigin: 'center center',
        touchAction: 'none',
        position: 'absolute',
        zIndex: 30,
        width: '200px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseDown={(e) => {
        handleClick(e);
        handleMouseDown(e);
      }}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Image
          src={image}
          alt="Design overlay"
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
          crossOrigin="anonymous"
        />
      </div>
      {isSelected && (
        <>
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize"
            style={{ top: '-8px', left: '-8px' }}
            onMouseDown={(e) => handleResize(e, 'topLeft')}
            onTouchStart={(e) => handleResize(e, 'topLeft')}
          />
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize"
            style={{ top: '-8px', right: '-8px' }}
            onMouseDown={(e) => handleResize(e, 'topRight')}
            onTouchStart={(e) => handleResize(e, 'topRight')}
          />
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize"
            style={{ bottom: '-8px', left: '-8px' }}
            onMouseDown={(e) => handleResize(e, 'bottomLeft')}
            onTouchStart={(e) => handleResize(e, 'bottomLeft')}
          />
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize"
            style={{ bottom: '-8px', right: '-8px' }}
            onMouseDown={(e) => handleResize(e, 'bottomRight')}
            onTouchStart={(e) => handleResize(e, 'bottomRight')}
          />
          {onDelete && (
            <button
              className="absolute -top-8 -right-8 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              ×
            </button>
          )}
        </>
      )}
    </div>
  );
}