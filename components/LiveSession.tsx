
import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, X, Activity, AlertTriangle } from 'lucide-react';
import { LiveClient } from '../services/geminiService';

interface LiveSessionProps {
  onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [status, setStatus] = useState("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [client, setClient] = useState<LiveClient | null>(null);
  
  // Transcription State
  const [userTrans, setUserTrans] = useState("");
  const [modelTrans, setModelTrans] = useState("");
  
  // Canvas for visualizer (mock)
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const newClient = new LiveClient(
      (s, err) => {
        setStatus(s);
        if (err) setErrorMsg(err);
      },
      (text, isUser, isFinal) => {
        if (isUser) {
          setUserTrans(prev => isFinal ? "" : prev + text);
          if(isFinal) setTimeout(() => setUserTrans(""), 2000); // Clear after delay
        } else {
          setModelTrans(prev => text); // Model stream replaces usually
          if(isFinal) setTimeout(() => setModelTrans(""), 5000);
        }
      }
    );
    
    setClient(newClient);
    
    // Pass a default system instruction to connect()
    newClient.connect("You are a helpful AI assistant in a live voice session.").catch(err => {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "연결 실패");
    });

    return () => {
      newClient.disconnect();
    };
  }, []);

  // Simple animation for "Listening"
  useEffect(() => {
    if (status !== 'connected' || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let t = 0;
    const draw = () => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      ctx.fillStyle = '#60a5fa'; // lighter blue
      const bars = 7;
      t += 0.1;
      
      for (let i = 0; i < bars; i++) {
        // Create a sine wave effect based on time and index
        const h = 10 + Math.abs(Math.sin(t + i)) * (height * 0.7);
        const x = (width / bars) * i + 15;
        const y = (height - h) / 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, 10, h, 5);
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [status]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-white relative h-full overflow-hidden">
      {/* Background blobs for aesthetics */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition z-10"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col items-center gap-10 w-full max-w-2xl px-6 z-10">
        
        {/* Status Indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border
          ${status === 'error' ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-gray-800 border-gray-700'}
        `}>
          <div className={`w-2 h-2 rounded-full 
            ${status === 'connected' ? 'bg-green-500 animate-pulse' : ''}
            ${status === 'connecting' ? 'bg-yellow-500' : ''}
            ${status === 'error' ? 'bg-red-500' : ''}
            ${status === 'disconnected' ? 'bg-gray-500' : ''}
          `}></div>
          <span className="uppercase tracking-wider text-xs">
            {status === 'connecting' && "연결 중..."}
            {status === 'connected' && "LIVE SESSION"}
            {status === 'disconnected' && "종료됨"}
            {status === 'error' && "오류 발생"}
          </span>
        </div>

        {/* Error Message Display */}
        {status === 'error' && errorMsg && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 max-w-md text-center animate-fade-in-up">
            <div className="flex justify-center mb-2 text-red-400">
               <AlertTriangle size={32} />
            </div>
            <p className="text-red-200 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Central Visualizer */}
        <div className="relative">
          <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 
            ${status === 'connected' ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-[0_0_60px_rgba(59,130,246,0.4)]' : 'bg-gray-800'}
            ${status === 'error' ? 'bg-gray-800 border-2 border-red-900' : ''}
          `}>
             <Mic size={56} className={`drop-shadow-lg ${status === 'error' ? 'text-red-500' : 'text-white'}`} />
          </div>
          
          {/* Ripple Effect when active */}
          {status === 'connected' && (
            <>
              <div className="absolute inset-0 rounded-full border border-blue-400 opacity-20 animate-ping"></div>
              <div className="absolute -inset-4 rounded-full border border-blue-500 opacity-10 animate-pulse"></div>
            </>
          )}
        </div>

        {/* Transcriptions */}
        {status === 'connected' && (
          <div className="w-full space-y-4 min-h-[120px] text-center">
            {userTrans && (
              <div className="animate-fade-in-up">
                <p className="text-sm text-blue-300 font-medium mb-1">YOU</p>
                <p className="text-xl font-light text-white leading-relaxed">{userTrans}</p>
              </div>
            )}
            
            {modelTrans && (
               <div className="animate-fade-in-up">
                <p className="text-sm text-green-300 font-medium mb-1">GEMINI</p>
                <p className="text-xl font-light text-white leading-relaxed">{modelTrans}</p>
              </div>
            )}

            {!userTrans && !modelTrans && (
              <p className="text-gray-500 italic animate-pulse">듣고 있습니다...</p>
            )}
          </div>
        )}
        
        {/* Audio Visualizer Canvas */}
        <div className="h-16 w-full flex justify-center items-center">
          {status === 'connected' && (
            <canvas ref={canvasRef} width={200} height={60} />
          )}
        </div>
      </div>

      <div className="mt-12 z-10">
        <button 
          onClick={onClose}
          className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-full font-medium transition-all hover:scale-105 flex items-center gap-3 backdrop-blur-sm"
        >
          <MicOff size={20} />
          {status === 'error' ? '닫기' : '통화 종료'}
        </button>
      </div>
    </div>
  );
};

export default LiveSession;
