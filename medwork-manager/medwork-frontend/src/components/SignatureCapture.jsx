import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Close, Restore } from '@mui/icons-material';

const SignatureCapture = ({ onSignatureChange, signatureData }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);

  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');

  const startDrawing = (e) => {
    setIsDrawing(true);
    const point = getPointerPosition(e);
    setPoints([point]);
  };

  const draw = (e) => {
    if (!isDrawing || !ctx) return;
    const point = getPointerPosition(e);
    setPoints(prev => [...prev, point]);
    drawPoint(point);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (points.length > 0) {
      const dataUrl = canvas?.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPoints([]);
      onSignatureChange(null);
    }
  };

  const getPointerPosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const drawPoint = ({ x, y }) => {
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Initialize canvas size - we'll set it in a useEffect to ensure the ref is set
  // but we can also set a default size and adjust on resize if needed.
  // For simplicity, we set a fixed size and handle it in the parent or via CSS.
  // We'll set the canvas size to 400x200 via the ref's style or parent.

  return (
    <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 1, position: 'relative' }}>
      {signatureData && (
        <Box sx={{ position: 'absolute', top: 0, right: 0, m: 1 }}>
          <Tooltip title="Visualizza firma">
            <IconButton size="small" onClick={() => {
              // We could open a dialog to show the signature, but for now just log
              console.log('Signature data:', signatureData);
            }}>
              <Restore fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancella firma">
            <IconButton size="small" color="error" onClick={() => {
              onSignatureChange(null);
            }}>
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        style={{
          border: '1px solid #ccc',
          cursor: 'crosshair',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={(e) => { e.preventDefault(); startDrawing(e); }}
        onMouseMove={(e) => { e.preventDefault(); draw(e); }}
        onMouseUp={(e) => { e.preventDefault(); stopDrawing(); }}
        onMouseLeave={(e) => { e.preventDefault(); stopDrawing(); }}
        onTouchStart={(e) => { e.preventDefault(); startDrawing(e.touches[0]); }}
        onTouchMove={(e) => { e.preventDefault(); draw(e.touches[0]); }}
        onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
      />
    </Box>
  );
};

export default SignatureCapture;