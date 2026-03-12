
import React, { useEffect, useRef } from 'react';

interface VoiceWaveProps {
  isActive: boolean;
  color?: string;
}

const VoiceWave: React.FC<VoiceWaveProps> = ({ isActive, color = '#3b82f6' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let t = 0;
    const draw = () => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      ctx.fillStyle = color;
      const bars = 15;
      t += 0.15;
      
      const barWidth = (width / bars) * 0.6;
      const gap = (width / bars) * 0.4;
      
      for (let i = 0; i < bars; i++) {
        // Create a sine wave effect based on time and index
        const h = 4 + Math.abs(Math.sin(t + i * 0.5)) * (height * 0.8);
        const x = (barWidth + gap) * i + gap / 2;
        const y = (height - h) / 2;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, h, barWidth / 2);
        } else {
          ctx.rect(x, y, barWidth, h);
        }
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [isActive, color]);

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center p-2 bg-blue-50/50 rounded-full border border-blue-100 shadow-inner animate-fade-in">
       <canvas ref={canvasRef} width={80} height={24} className="opacity-80" />
    </div>
  );
};

export default VoiceWave;
