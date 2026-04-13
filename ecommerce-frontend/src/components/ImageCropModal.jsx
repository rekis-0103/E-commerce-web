import { useState, useRef, useEffect } from 'react';

function ImageCropModal({ isOpen, onClose, imageSrc, imageSize, onCropComplete }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Refs untuk menghindari masalah closure stale state
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropAreaRef = useRef({ x: 0, y: 0, size: 0 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  // Load gambar saat modal dibuka
  useEffect(() => {
    if (isOpen && imageSrc) {
      // Untuk menghindari CORS issue, load gambar sebagai blob lalu convert ke data URL
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const img = new Image();
          img.onload = () => {
            imageRef.current = img;
            setIsImageLoaded(true);
            setImageDimensions({ width: img.width, height: img.height });

            // Hitung skala untuk display
            const maxWidth = 600;
            const maxHeight = 600;
            const imgScale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
            setScale(imgScale);

            // Inisialisasi crop area di tengah dengan ukuran minimum
            const minSide = Math.min(img.width, img.height);
            const cropSize = minSide * imgScale;
            const x = (img.width * imgScale - cropSize) / 2;
            const y = (img.height * imgScale - cropSize) / 2;

            const initialCrop = { x, y, size: cropSize };
            setCropArea(initialCrop);
            cropAreaRef.current = initialCrop;
          };
          
          img.onerror = () => {
            console.error('Gagal memuat gambar:', imageSrc);
            alert('Gagal memuat gambar. Coba lagi.');
          };
          
          img.src = URL.createObjectURL(blob);
        })
        .catch(err => {
          console.error('Error fetching image:', err);
          alert('Gagal memuat gambar dari server.');
        });
    } else if (!isOpen) {
      setIsImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Update refs saat state berubah
  useEffect(() => {
    cropAreaRef.current = cropArea;
  }, [cropArea]);

  useEffect(() => {
    dragStartRef.current = dragStart;
  }, [dragStart]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    isResizingRef.current = isResizing;
  }, [isResizing]);

  // Gambar ulang canvas
  useEffect(() => {
    if (!isOpen || !imageRef.current || !canvasRef.current || !isImageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    const displayWidth = img.width * scale;
    const displayHeight = img.height * scale;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Gambar image asli
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    // Overlay gelap di luar area crop
    const crop = cropAreaRef.current;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, crop.y); // Atas
    ctx.fillRect(0, crop.y + crop.size, canvas.width, displayHeight - crop.y - crop.size); // Bawah
    ctx.fillRect(0, crop.y, crop.x, crop.size); // Kiri
    ctx.fillRect(crop.x + crop.size, crop.y, displayWidth - crop.x - crop.size, crop.size); // Kanan

    // Border area crop
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);

    // Grid rule of thirds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    const third = crop.size / 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(crop.x, crop.y + third * i);
      ctx.lineTo(crop.x + crop.size, crop.y + third * i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(crop.x + third * i, crop.y);
      ctx.lineTo(crop.x + third * i, crop.y + crop.size);
      ctx.stroke();
    }

    // Handle di sudut untuk resize
    const handleSize = 12;
    ctx.fillStyle = '#fff';
    const corners = [
      { x: crop.x, y: crop.y },
      { x: crop.x + crop.size, y: crop.y },
      { x: crop.x, y: crop.y + crop.size },
      { x: crop.x + crop.size, y: crop.y + crop.size }
    ];

    corners.forEach(corner => {
      ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
    });

  }, [isOpen, cropArea, scale, isImageLoaded]);

  const getMousePosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const isInResizeHandle = (pos) => {
    const handleSize = 15;
    const crop = cropAreaRef.current;
    const corners = [
      { x: crop.x, y: crop.y },
      { x: crop.x + crop.size, y: crop.y },
      { x: crop.x, y: crop.y + crop.size },
      { x: crop.x + crop.size, y: crop.y + crop.size }
    ];

    for (const corner of corners) {
      if (
        pos.x >= corner.x - handleSize &&
        pos.x <= corner.x + handleSize &&
        pos.y >= corner.y - handleSize &&
        pos.y <= corner.y + handleSize
      ) {
        return true;
      }
    }
    return false;
  };

  const isInCropArea = (pos) => {
    const crop = cropAreaRef.current;
    return (
      pos.x >= crop.x &&
      pos.x <= crop.x + crop.size &&
      pos.y >= crop.y &&
      pos.y <= crop.y + crop.size
    );
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const pos = getMousePosition(e);

    if (isInResizeHandle(pos)) {
      setIsResizing(true);
      isResizingRef.current = true;
      setDragStart(pos);
      dragStartRef.current = pos;
    } else if (isInCropArea(pos)) {
      setIsDragging(true);
      isDraggingRef.current = true;
      setDragStart(pos);
      dragStartRef.current = pos;
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePosition(e);
    const canvas = canvasRef.current;
    
    if (!isDraggingRef.current && !isResizingRef.current) {
      // Update cursor
      if (canvas) {
        canvas.style.cursor = isInResizeHandle(pos) ? 'nwse-resize' : isInCropArea(pos) ? 'move' : 'default';
      }
      return;
    }

    const dx = pos.x - dragStartRef.current.x;
    const dy = pos.y - dragStartRef.current.y;

    if (isDraggingRef.current) {
      const displayWidth = imageDimensions.width * scale;
      const displayHeight = imageDimensions.height * scale;
      const crop = cropAreaRef.current;
      const newX = Math.max(0, Math.min(crop.x + dx, displayWidth - crop.size));
      const newY = Math.max(0, Math.min(crop.y + dy, displayHeight - crop.size));

      const newCrop = { ...crop, x: newX, y: newY };
      setCropArea(newCrop);
      cropAreaRef.current = newCrop;
      dragStartRef.current = pos;
      setDragStart(pos);
    } else if (isResizingRef.current) {
      const minSize = 50;
      const displayWidth = imageDimensions.width * scale;
      const displayHeight = imageDimensions.height * scale;
      const crop = cropAreaRef.current;

      // Hitung perubahan ukuran (tetap kotak)
      const avgDelta = (dx + dy) / 2;
      const newSize = Math.max(minSize, crop.size + avgDelta);

      // Pastikan tidak melebihi batas gambar
      const maxSize = Math.min(displayWidth - crop.x, displayHeight - crop.y);
      const finalSize = Math.min(newSize, maxSize);

      const newCrop = { ...crop, size: finalSize };
      setCropArea(newCrop);
      cropAreaRef.current = newCrop;
      dragStartRef.current = pos;
      setDragStart(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    isDraggingRef.current = false;
    isResizingRef.current = false;
  };

  const handleApplyCrop = () => {
    if (!imageRef.current) {
      alert('Gambar belum selesai dimuat. Coba lagi.');
      return;
    }

    if (cropArea.size <= 0) {
      alert('Area crop tidak valid.');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageSize;
      canvas.height = imageSize;
      const ctx = canvas.getContext('2d');

      // Hitung area crop dalam koordinat gambar asli
      const sourceX = cropArea.x / scale;
      const sourceY = cropArea.y / scale;
      const sourceSize = cropArea.size / scale;

      // Validasi nilai
      if (isNaN(sourceX) || isNaN(sourceY) || isNaN(sourceSize) || sourceSize <= 0) {
        alert('Parameter crop tidak valid.');
        return;
      }

      console.log('Cropping:', { sourceX, sourceY, sourceSize, imageSize });

      // Crop dan resize
      ctx.drawImage(
        imageRef.current,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, imageSize, imageSize
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Gagal membuat gambar hasil crop.');
          return;
        }

        const croppedFile = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
        console.log('Crop berhasil, memanggil onCropComplete...');
        onCropComplete(croppedFile);
        onClose();
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error saat crop:', error);
      alert('Terjadi kesalahan saat crop gambar.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '30px',
          maxWidth: '700px',
          width: '90%'
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>✂️ Crop Gambar</h3>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'default',
              maxWidth: '100%',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>

        <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px', textAlign: 'center' }}>
          💡 Drag area kotak untuk memindahkan, atau drag sudut untuk mengubah ukuran
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Batal
          </button>
          <button
            onClick={handleApplyCrop}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✓ Terapkan Crop
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
