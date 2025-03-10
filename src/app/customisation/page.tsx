/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { UploadCloud, Loader2 } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import html2canvas from 'html2canvas';
import { StaticImageData } from 'next/image';
import { DraggableCore } from 'react-draggable';
import type { DraggableEvent, DraggableData } from 'react-draggable';
import { DraggableOverlay } from '@/Components/DraggableOverlay';

interface QueuedImage {
  file: File;
  id: string;  // Add unique identifier
}

interface Design {
  id: string;
  imageUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  side: 'front' | 'back';  // Add side property
}

interface Apparel {
  id: string;
  color: string;
  image: string;
  backImage: string;
  alt: string;
}

interface GeneratedImage {
  url: string;
  source?: string;
}

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

interface ApparelOption {
  id: number;
  name: string;
  image: StaticImageData;
  backImage: StaticImageData;
  color: string;
}

interface CropModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: string) => void;
}

interface OverlayPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface Overlay {
  id: string;
  image: string;
  position: OverlayPosition;
}

export default function Customisation() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [selectedDesigns, setSelectedDesigns] = useState<Design[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageQueue, setImageQueue] = useState<QueuedImage[]>([]);
  const [rotation, setRotation] = useState<number>(0);
  const [activeDesign, setActiveDesign] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialSize, setInitialSize] = useState<{ width: number; height: number } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeInitialSize, setResizeInitialSize] = useState<{ width: number; height: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('white');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const frontViewRef = useRef<HTMLDivElement>(null);
  const backViewRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [croppedOverlay, setCroppedOverlay] = useState<string>('');
  const [frontOverlay, setFrontOverlay] = useState<string>('');
  const [backOverlay, setBackOverlay] = useState<string>('');
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [frontPosition, setFrontPosition] = useState<OverlayPosition>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [backPosition, setBackPosition] = useState<OverlayPosition>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [frontOverlays, setFrontOverlays] = useState<Overlay[]>([]);
  const [backOverlays, setBackOverlays] = useState<Overlay[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  
  const apparelOptions = [
    {
      id: 1,
      name: 'T-Shirt',
      image: '/images/white-tshirt.png',
      backImage: '/images/white-tshirt-back.png',
      color: 'white',
    },
    {
      id: 2,
      name: 'T-Shirt',
      image: '/images/black-tshirt.png',
      backImage: '/images/black-tshirt-back.png',
      color: 'black',
    }
  ];

  console.log("Apparel Options:", apparelOptions);

  const selectedApparel = apparelOptions.find(apparel => apparel.color === selectedColor);

  console.log("Selected Apparel:", selectedApparel);

  // Load the selected color when the component mounts
  useEffect(() => {
    const savedColor = localStorage.getItem('selectedColor');
    if (savedColor) {
      setSelectedColor(savedColor);
    }
  }, []);

  // Save color selection when it changes
  useEffect(() => {
    localStorage.setItem('selectedColor', selectedColor);
  }, [selectedColor]);

  const handleGenerateImages = async (isRegenerate: boolean = false) => {
    if (!prompt) return;
    setIsLoading(true);
    setError(null);
    if (!isRegenerate) {
      setImages([]);
    }

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          useAI: useAI
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      if (data.images) {
        setImages(prevImages => [...(isRegenerate ? prevImages : []), ...data.images]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addDesignToShirt = (imageUrl: string) => {
    const newDesign = {
      id: Date.now().toString(),
      imageUrl,
      position: { x: 0, y: 0 },
      size: { width: 150, height: 150 },
      rotation: 0,
      side: activeSide  // Add the current active side
    };
    setSelectedDesigns(prev => [...prev, newDesign]);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    setIsDragging(true);
    setActiveDesign(id);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Add boundary check function
  const keepInBounds = (x: number, y: number, width: number, height: number) => {
    if (!containerRef.current) return { x, y };

    const container = containerRef.current;
    const bounds = container.getBoundingClientRect();

    return {
      x: Math.min(Math.max(x, 0), bounds.width - width),
      y: Math.min(Math.max(y, 0), bounds.height - height)
    };
  };

  // Update handleMouseMove with boundaries
  const handleMouseMove = (e: React.MouseEvent, id: string) => {
    if (!isDragging || activeDesign !== id) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const design = selectedDesigns.find(d => d.id === id);
    if (!design) return;

    const newPosition = keepInBounds(
      design.position.x + deltaX,
      design.position.y + deltaY,
      design.size.width,
      design.size.height
    );

    setSelectedDesigns(prev =>
      prev.map(design =>
        design.id === id
          ? {
              ...design,
              position: newPosition
            }
          : design
      )
    );

    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Updated getDistance function with correct typing
  const getDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    e.preventDefault();
    setActiveDesign(id);
    
    if (e.touches.length === 2) {
      // Pinch gesture started
      const distance = getDistance(e.touches);
      setInitialDistance(distance);
      const design = selectedDesigns.find(d => d.id === id);
      if (design) {
        setInitialSize(design.size);
      }
    } else {
      // Single touch for dragging
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
      const design = selectedDesigns.find(d => d.id === id);
      if (design) {
        setLastPosition(design.position);
      }
    }
  };

  // Update handleTouchMove with boundaries
  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    e.preventDefault();

    if (e.touches.length === 2 && initialDistance && initialSize) {
      // Handle pinch zoom (unchanged)
      const newDistance = getDistance(e.touches);
      const scale = newDistance / initialDistance;
      
      setSelectedDesigns(prev =>
        prev.map(design =>
          design.id === id
            ? {
                ...design,
                size: {
                  width: initialSize.width * scale,
                  height: initialSize.height * scale
                }
              }
            : design
        )
      );
    } else if (isDragging && e.touches.length === 1) {
      // Handle drag with boundaries
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;

      const design = selectedDesigns.find(d => d.id === id);
      if (!design) return;

      const newPosition = keepInBounds(
        lastPosition.x + deltaX,
        lastPosition.y + deltaY,
        design.size.width,
        design.size.height
      );

      setSelectedDesigns(prev =>
        prev.map(design =>
          design.id === id
            ? {
                ...design,
                position: newPosition
              }
            : design
        )
      );
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setInitialDistance(null);
    setInitialSize(null);
    
    if (activeDesign) {
      const design = selectedDesigns.find(d => d.id === activeDesign);
      if (design) {
        setLastPosition(design.position);
      }
    }
  };

  const handleResizeStart = (e: React.TouchEvent | React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const design = selectedDesigns.find(d => d.id === id);
    if (!design) return;

    setActiveDesign(id);
    setResizeInitialSize(design.size);
    
    if ('touches' in e) {
      setResizeStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else {
      setResizeStart({
        x: (e as React.MouseEvent).clientX,
        y: (e as React.MouseEvent).clientY
      });
    }
  };

  const handleResizeEnd = useCallback(() => {
    setResizeStart(null);
    setResizeInitialSize(null);
    setActiveDesign(null);
  }, []);

  useEffect(() => {
    if (resizeStart) {
      const handleResize = (e: TouchEvent | MouseEvent) => {
        if (!resizeStart || !resizeInitialSize || !activeDesign) return;

        const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = currentX - resizeStart.x;
        const deltaY = currentY - resizeStart.y;

        setSelectedDesigns(prev =>
          prev.map(design =>
            design.id === activeDesign
              ? {
                  ...design,
                  size: {
                    width: Math.max(50, resizeInitialSize.width + deltaX),
                    height: Math.max(50, resizeInitialSize.height + deltaY)
                  }
                }
              : design
          )
        );
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleResize(e);
      };

      const handleTouchEnd = () => {
        handleResizeEnd();
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizeStart, resizeInitialSize, activeDesign, handleResizeEnd]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0]; // Get the first file
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setTempImage(imageUrl);
      setCropModalOpen(true);
    } else {
      setError("Please upload a valid image file");
    }
  };

  const processNextImage = (queuedImage: QueuedImage) => {
    const imageUrl = URL.createObjectURL(queuedImage.file);
    setTempImage(imageUrl);
    setCropModalOpen(true);
    setRotation(0);
  };

  const getCroppedImg = () => {
    if (!imgRef.current || !crop.width || !crop.height) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get original image dimensions
    const originalWidth = imgRef.current.naturalWidth;
    const originalHeight = imgRef.current.naturalHeight;

    // Calculate the scale factors
    const scaleX = originalWidth / imgRef.current.width;
    const scaleY = originalHeight / imgRef.current.height;

    // Calculate actual crop dimensions
    const pixelCrop = {
      x: Math.round(crop.x * scaleX),
      y: Math.round(crop.y * scaleY),
      width: Math.round(crop.width * scaleX),
      height: Math.round(crop.height * scaleY)
    };

    // Set canvas size to match the cropped dimensions
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image maintaining aspect ratio
    ctx.drawImage(
      imgRef.current,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Get the final base64 string
    const base64Image = canvas.toDataURL('image/png');
    
    // Create new overlay with original aspect ratio information
    const newOverlay: Overlay = {
      id: Date.now().toString(),
      image: base64Image,
      position: { 
        x: 0, 
        y: 0, 
        scale: 1, 
        rotation: 0 
      }
    };

    // Store with the current view
    if (activeView === 'front') {
      setFrontOverlays(prevOverlays => [...prevOverlays, newOverlay]);
    } else {
      setBackOverlays(prevOverlays => [...prevOverlays, newOverlay]);
    }

    // Close the modal and clean up
    setCropModalOpen(false);
    setTempImage(null);
  };

  const handleImageSelect = async (image: string) => {
    try {
      const response = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: image }),
      });

      if (!response.ok) {
        throw new Error('Failed to load image');
      }

      const data = await response.json();
      setTempImage(data.imageUrl);
      setCropModalOpen(true);
    } catch (error) {
      console.error('Error loading image:', error);
      // Fallback to direct image
      setTempImage(image);
      setCropModalOpen(true);
    }
  };

  // Make sure to clear the file input value after upload
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event);
    // Reset the file input value
    if (event.target.value) {
      event.target.value = '';
    }
  };

  // Add this function to remove designs
  const removeDesign = (id: string) => {
    setSelectedDesigns(prev => prev.filter(design => design.id !== id));
    if (activeDesign === id) {
      setActiveDesign(null);
    }
  };

  // Updated click away handler
  const handleClickAway = (e: React.MouseEvent | React.TouchEvent) => {
    // Only deselect if clicking directly on the container background
    if (e.target === e.currentTarget) {
      setActiveDesign(null);
      setResizeStart(null);
      setResizeInitialSize(null);
    }
  };

  const captureView = async (viewRef: React.RefObject<HTMLDivElement | null>, viewName: string) => {
    if (!viewRef.current) return null;

    try {
      // Create main container
      const captureContainer = document.createElement('div');
      captureContainer.style.width = '375px';
      captureContainer.style.height = '375px';
      captureContainer.style.left = '50%';
      captureContainer.style.top = '100%';
      captureContainer.style.position = 'fixed';
      captureContainer.style.left = '-9999px';
      captureContainer.style.backgroundColor = 'white';
      captureContainer.style.overflow = 'hidden';
      document.body.appendChild(captureContainer);

      // Create design area container
      const designArea = document.createElement('div');
      designArea.style.position = 'relative';
      designArea.style.width = '100%';
      designArea.style.height = '100%';
      designArea.style.display = 'flex';
      designArea.style.alignItems = 'center';
      designArea.style.justifyContent = 'center';
      captureContainer.appendChild(designArea);

      // Add t-shirt image
      const shirtImg = document.createElement('img');
      shirtImg.src = viewName === 'front' 
        ? (selectedApparel?.image || '/images/white-tshirt.png')
        : (selectedApparel?.backImage || '/images/white-tshirt-back.png');
      shirtImg.style.position = 'absolute';
      shirtImg.style.left = '0';
      shirtImg.style.top = '0';
      shirtImg.style.width = '100%';
      shirtImg.style.height = '100%';
      shirtImg.style.objectFit = 'contain';
      shirtImg.crossOrigin = 'anonymous';
      designArea.appendChild(shirtImg);

      // Add overlays
      const overlays = viewName === 'front' ? frontOverlays : backOverlays;
      await Promise.all(overlays.map(async (overlay) => {
        const overlayContainer = document.createElement('div');
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.left = overlay.position.x + 'px';
        overlayContainer.style.top = overlay.position.y + 'px';
        overlayContainer.style.width = '200px';
        overlayContainer.style.height = '200px';
        overlayContainer.style.display = 'flex';
        overlayContainer.style.alignItems = 'center';
        overlayContainer.style.justifyContent = 'center';

        const overlayImg = document.createElement('img');
        overlayImg.src = overlay.image;
        overlayImg.style.maxWidth = '100%';  // Changed from width to maxWidth
        overlayImg.style.maxHeight = '100%'; // Changed from height to maxHeight
        overlayImg.style.objectFit = 'contain';
        overlayImg.style.transform = `rotate(${overlay.position.rotation}deg) scale(${overlay.position.scale})`;
        overlayImg.style.transformOrigin = 'center';
        overlayImg.crossOrigin = 'anonymous';

        overlayContainer.appendChild(overlayImg);
        designArea.appendChild(overlayContainer);

        await new Promise((resolve) => {
          overlayImg.onload = resolve;
        });
      }));

      // Wait for shirt image to load
      await new Promise((resolve) => {
        shirtImg.onload = resolve;
      });

      // Additional wait to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture with html2canvas
      const canvas = await html2canvas(captureContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
        width: 375,
        height: 425,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElements = clonedDoc.getElementsByTagName('*');
          Array.from(clonedElements).forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.visibility = 'visible';
              el.style.opacity = '1';
            }
          });
        }
      });

      document.body.removeChild(captureContainer);
      return canvas.toDataURL('image/png', 1.0);

    } catch (error) {
      console.error(`Error capturing ${viewName} view:`, error);
      return null;
    }
  };

  const saveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phoneNumber.trim()) return;

    setIsSaving(true);
    try {
      // Store current view
      const originalView = activeView;

      // Capture front view
      setActiveView('front');
      // Wait for view to update
      await new Promise(resolve => setTimeout(resolve, 500));
      const frontImage = await captureView(frontViewRef, 'front');

      // Capture back view
      setActiveView('back');
      // Wait for view to update
      await new Promise(resolve => setTimeout(resolve, 500));
      const backImage = await captureView(backViewRef, 'back');

      // Restore original view
      setActiveView(originalView);

      if (!frontImage || !backImage) {
        throw new Error('Failed to capture design views');
      }

      const now = new Date();
      const date = now.toLocaleDateString('en-GB').split('/').join('-');
      const time = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      }).toLowerCase().replace(' ', '');

      const fileName = `${customerName.trim()}-${phoneNumber.trim()}-${date}-${time}`;

      // Save overlays first
      if (frontOverlays.length > 0 || backOverlays.length > 0) {
        // Save front overlays
        for (const overlay of frontOverlays) {
          await fetch('/api/save-overlay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              overlayImage: overlay.image,
              fileName: `${fileName}-front`,
              position: 'front'
            }),
          });
        }

        // Save back overlays
        for (const overlay of backOverlays) {
          await fetch('/api/save-overlay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              overlayImage: overlay.image,
              fileName: `${fileName}-back`,
              position: 'back'
            }),
          });
        }
      }

      // Send to API
      const response = await fetch('/api/save-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frontImage,
          backImage,
          fileName,
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save design');
      }

      const data = await response.json();
      
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setShowSaveModal(false);
          setCustomerName('');
          setPhoneNumber('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error in saveDesign:', error);
      alert(error instanceof Error ? error.message : 'Failed to save design. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(e.target.value.trim());
  };

  // Update the function to handle MouseEvent instead of DragEvent
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Add this right after your apparelOptions definition
  console.log("Current apparelOptions:", apparelOptions);
  console.log("Current selectedApparel:", selectedApparel);

  // Update the front/back button handlers
  const handleFrontClick = () => {
    setActiveView('front');
    // ... any existing front button logic ...
  };

  const handleBackClick = () => {
    setActiveView('back');
    // ... any existing back button logic ...
  };

  // Add position update handler
  const handlePositionChange = (id: string, newPosition: OverlayPosition, side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontOverlays(frontOverlays.map(overlay => 
        overlay.id === id ? { ...overlay, position: newPosition } : overlay
      ));
    } else {
      setBackOverlays(backOverlays.map(overlay => 
        overlay.id === id ? { ...overlay, position: newPosition } : overlay
      ));
    }
  };

  // Add delete handler
  const handleDeleteOverlay = (id: string, side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontOverlays(frontOverlays.filter(overlay => overlay.id !== id));
    } else {
      setBackOverlays(backOverlays.filter(overlay => overlay.id !== id));
    }
  };

  // Add click handler for the main container to deselect when clicking outside
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container background
    if (e.target === e.currentTarget) {
      setSelectedOverlayId(null);
    }
  };

  return (
    <main className="min-h-screen bg-black py-4 sm:py-16">
      <div className="flex justify-center gap-4 mb-4">
        {/* Conditionally render active view */}
        {activeView === 'front' ? (
          /* Front View Container */
          <div 
            ref={frontViewRef}
            data-testid="front-view"
            className="relative"
            style={{
              width: '375px',
              height: '375px',
              position: 'relative',
              overflow: 'visible',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Base T-shirt Image */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ position: 'absolute', zIndex: 1 }}>
              <Image
                src={selectedApparel?.image || '/images/white-tshirt.png'}
                alt="T-shirt front view"
                fill
                data-next-image
                style={{ 
                  objectFit: 'contain',
                  margin: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  left: '50%',
                  top: '100%',
                  transform: 'translate(-50%, -50%)'
                }}
                priority
                crossOrigin="anonymous"
              />
            </div>

            {/* Front Overlays */}
            <div 
              className="absolute inset-0" 
              style={{ position: 'absolute', zIndex: 20 }}
              onClick={handleContainerClick}
            >
              {frontOverlays.map((overlay, index) => (
                <DraggableOverlay
                  key={index}
                  image={overlay.image}
                  position={overlay.position}
                  setPosition={(newPosition) => {
                    const newOverlays = [...frontOverlays];
                    newOverlays[index] = { ...overlay, position: newPosition };
                    setFrontOverlays(newOverlays);
                  }}
                  isSelected={selectedOverlayId === overlay.id}
                  onClick={() => setSelectedOverlayId(overlay.id)}
                  onDelete={() => {
                    setFrontOverlays(overlays => overlays.filter(o => o.id !== overlay.id));
                    setSelectedOverlayId(null);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Back View Container */
          <div 
            ref={backViewRef}
            data-testid="back-view"
            className="relative"
            style={{
              width: '375px',
              height: '375px',
              position: 'relative',
              overflow: 'visible',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Base T-shirt Image */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ position: 'absolute', zIndex: 1 }}>
              <Image
                src={selectedApparel?.backImage || '/images/white-tshirt-back.png'}
                alt="T-shirt back view"
                fill
                data-next-image
                style={{ 
                  objectFit: 'contain',
                  margin: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  left: '50%',
                  top: '100%',
                  transform: 'translate(-50%, -50%)'
                }}
                priority
                crossOrigin="anonymous"
              />
            </div>

            {/* Back Overlays */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              onClick={handleContainerClick}
            >
              {backOverlays.map((overlay, index) => (
                <DraggableOverlay
                  key={index}
                  image={overlay.image}
                  position={overlay.position}
                  setPosition={(newPosition) => {
                    const newOverlays = [...backOverlays];
                    newOverlays[index] = { ...overlay, position: newPosition };
                    setBackOverlays(newOverlays);
                  }}
                  isSelected={selectedOverlayId === overlay.id}
                  onClick={() => setSelectedOverlayId(overlay.id)}
                  onDelete={() => {
                    setBackOverlays(overlays => overlays.filter(o => o.id !== overlay.id));
                    setSelectedOverlayId(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-2 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Add Print Side Selection Buttons */}
          <div className="flex gap-4 mb-6 justify-center items-center">
            {apparelOptions.map((apparel) => (
              <button
                key={apparel.id}
                onClick={() => setSelectedColor(apparel.color)}
                className={`w-10 h-10 rounded-full border-2 ${
                  selectedColor === apparel.color 
                    ? 'border-blue-500 ring-2 ring-blue-500' 
                    : 'border-gray-400'
                }`}
                style={{
                  backgroundColor: apparel.color,
                }}
                aria-label={`Select ${apparel.color} t-shirt`}
              />
            ))}
          </div>

          {/* Print Side Selection */}
          <div className="flex gap-4 mb-6 justify-center items-center">
            <button
              onClick={handleFrontClick}
              className={`px-6 py-2 rounded-lg ${
                activeView === 'front' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              Front Print
            </button>
            <button
              onClick={handleBackClick}
              className={`px-6 py-2 rounded-lg ${
                activeView === 'back' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              Back Print
            </button>
          </div>

          {/* T-Shirt Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            marginTop: '2rem',
            width: '100%'
          }}>
            {/* Front View */}
            <div className="relative aspect-square bg-gray-700 rounded-lg overflow-hidden">
              <div
                ref={activeView === 'front' ? frontViewRef : backViewRef}
                className="relative w-full h-full"
              >
                {/* Base Layer - Apparel Image */}
                <div className="absolute inset-0" style={{ zIndex: 1 }}>
                  <Image
                    src={activeView === 'front' 
                      ? (selectedApparel?.image || '/images/white-tshirt.png')
                      : (selectedApparel?.backImage || '/images/white-tshirt-back.png')
                    }
                    alt={`${selectedApparel?.color || 'white'} t-shirt ${activeView} view`}
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>

                {/* Overlay Layer - Update z-index to be higher */}
                <div className="absolute inset-0" style={{ zIndex: 10, pointerEvents: 'none' }}>
                  {selectedDesigns
                    .filter(design => design.side === activeView)
                    .map((design) => (
                      <div
                        key={design.id}
                        data-design-overlay
                        onClick={() => setActiveDesign(design.id)}
                        onMouseDown={(e) => handleDragStart(e)}
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) translate(${design.position.x}px, ${design.position.y}px) rotate(${design.rotation}deg)`,
                          width: design.size.width,
                          height: design.size.height,
                          cursor: 'move',
                          border: activeDesign === design.id ? '2px solid blue' : 'none',
                          pointerEvents: 'auto',
                          zIndex: 20 // Add explicit z-index
                        }}
                      >
                        <Image
                          src={design.imageUrl}
                          alt="Design overlay"
                          layout="fill"
                          objectFit="contain"
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    ))}
                </div>

                {/* DraggableOverlay components - Ensure they're above the apparel */}
                <div className="absolute inset-0" style={{ zIndex: 30 }}>
                  {activeView === 'front' ? (
                    frontOverlays.map((overlay, index) => (
                      <DraggableOverlay
                        key={index}
                        image={overlay.image}
                        position={overlay.position}
                        setPosition={(newPosition) => {
                          const newOverlays = [...frontOverlays];
                          newOverlays[index] = { ...overlay, position: newPosition };
                          setFrontOverlays(newOverlays);
                        }}
                        isSelected={selectedOverlayId === overlay.id}
                        onClick={() => setSelectedOverlayId(overlay.id)}
                        onDelete={() => {
                          setFrontOverlays(overlays => overlays.filter(o => o.id !== overlay.id));
                          setSelectedOverlayId(null);
                        }}
                      />
                    ))
                  ) : (
                    backOverlays.map((overlay, index) => (
                      <DraggableOverlay
                        key={index}
                        image={overlay.image}
                        position={overlay.position}
                        setPosition={(newPosition) => {
                          const newOverlays = [...backOverlays];
                          newOverlays[index] = { ...overlay, position: newPosition };
                          setBackOverlays(newOverlays);
                        }}
                        isSelected={selectedOverlayId === overlay.id}
                        onClick={() => setSelectedOverlayId(overlay.id)}
                        onDelete={() => {
                          setBackOverlays(overlays => overlays.filter(o => o.id !== overlay.id));
                          setSelectedOverlayId(null);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          {selectedDesigns.length > 0 && (
            <div className="mb-8">
              {selectedDesigns.map((design, index) => (
                <div key={design.id} className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white">Design {index + 1}</h3>
                    <button
                      onClick={() => removeDesign(design.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white mb-2">Size: {design.size.width} x {design.size.height}</label>
                    </div>

                    <div>
                      <label className="block text-white mb-2">Position: {design.position.x}, {design.position.y}</label>
                    </div>

                    <div>
                      <label className="block text-white mb-2">Rotation: {design.rotation}°</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Controls Container */}
          <div className="w-full flex flex-col items-center gap-4 mt-4">
            {/* Toggle Switches Container */}
            <div className="flex gap-8 items-center justify-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useWebSearch}
                    onChange={(e) => {
                      setUseWebSearch(e.target.checked);
                      if (e.target.checked) {
                        setUseAI(false);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </div>
                <span className="ml-2 text-sm font-medium text-white">Web Search</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => {
                      setUseAI(e.target.checked);
                      if (e.target.checked) {
                        setUseWebSearch(false);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </div>
                <span className="ml-2 text-sm font-medium text-white">Use AI</span>
              </label>

              {/* Upload Button */}
              <label className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                Upload Image
              </label>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 mt-12">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(image.url)}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-white bg-transparent"
              >
                <Image
                  src={image.url}
                  alt={`Design option ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={500}
                  height={500}
                  style={{
                    backgroundColor: 'transparent'
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                  Option {index + 1}
                </div>
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="You think we create..."
            className="w-full h-24 p-4 bg-gray-900 text-white border border-gray-700 rounded-lg focus:border-white focus:ring-1 focus:ring-white mb-4 -mt-8"
          />

          {/* Generate Button */}
          <button
            onClick={() => handleGenerateImages(false)}
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-lg text-black bg-white hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed -mt-2"
          >
            {isLoading ? 'Generating...' : 'Generate Design'}
          </button>

          {/* Regenerate Button */}
          {images.length > 0 && (
            <button
              onClick={() => handleGenerateImages(true)}
              disabled={isLoading}
              className="w-full mt-4 py-2 px-4 rounded-lg text-white bg-gray-800 hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : '↻ Generate New Options'}
            </button>
          )}

          {error && (
            <p className="mt-4 text-red-500 text-center">{error}</p>
          )}

          {/* Save Design Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Save Design
            </button>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-black">
              You are one step away from saving your DRYP
            </h3>
            <form onSubmit={saveDesign}>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                required
                disabled={isSaving}
              />
              <input
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your 10 digit phone number"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                required
                disabled={isSaving}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveModal(false);
                    setShowSuccess(false);
                    setCustomerName('');
                    setPhoneNumber('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customerName || !phoneNumber || isSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
            
            {showSuccess && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Design saved successfully!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropModalOpen && tempImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-2xl">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCrop(c)}
            >
              <img
                ref={imgRef}
                src={tempImage}
                alt="Crop me"
                style={{ 
                  maxHeight: '70vh',
                  maxWidth: '100%',
                  display: 'block'
                }}
              />
            </ReactCrop>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setCropModalOpen(false);
                  setTempImage(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={getCroppedImg}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}













