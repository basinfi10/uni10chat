
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Role } from '../types';
import { 
  Bot, User, Copy, Check, Speaker, 
  Loader2, FileDown, Square, Play, Volume2, Settings, AlertTriangle, Trash2, HelpCircle,
  Printer, FileText, Download, Volume1, Repeat, Repeat1, RotateCcw
} from 'lucide-react';

declare const Prism: any;

interface ChatAreaProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onGenerateSpeech?: (id: string, text: string, voice: string) => void;
  currentlyPlayingId: string | null;
  onStopAudio: () => void;
  onPlayAudio: (id: string) => void;
  onResetSpeech?: (id: string) => void;
  onOpenSettings?: () => void;
  onClearAll?: () => void;
  audioVolume?: number;
  setAudioVolume?: (vol: number) => void;
  isAudioLooping?: boolean;
  onToggleLoop?: () => void;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const rawLang = match ? match[1] : '';
  const isPlainText = !rawLang || rawLang === 'text' || rawLang === 'plaintext' || rawLang === 'txt';
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!inline && !isPlainText && codeRef.current && typeof Prism !== 'undefined') { Prism.highlightElement(codeRef.current); }
  }, [children, className, inline, isPlainText]);

  if (inline) { return <code className={`${className} bg-gray-100 px-1.5 py-0.5 rounded text-sm text-[#d93025] font-mono`} {...props}>{children}</code>; }

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-2xl border border-gray-200 font-mono text-sm group relative bg-[#f8f9fb]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50/50 rounded-t-2xl">
        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{rawLang || 'Code'}</span>
        <button onClick={handleCopy} className="text-gray-400 hover:text-blue-600 p-1 transition-colors">{isCopied ? <Check size={14} /> : <Copy size={14} />}</button>
      </div>
      <div className="p-5 overflow-x-auto"><code ref={codeRef} className={`language-${rawLang} block`}>{children}</code></div>
    </div>
  );
};

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  isGenerating, 
  onGenerateSpeech, 
  currentlyPlayingId, 
  onStopAudio, 
  onPlayAudio, 
  onResetSpeech,
  onOpenSettings, 
  onClearAll,
  audioVolume = 1.0,
  setAudioVolume,
  isAudioLooping = false,
  onToggleLoop
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState<string | null>(null);
  
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isGenerating]);

  const handleDownload = (text: string, type: 'txt' | 'doc') => {
    try {
      const filename = `uni10_response_${new Date().getTime()}.${type}`;
      let blob;
      if (type === 'txt') {
        blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      } else {
        const html = `<html><head><meta charset="utf-8"></head><body>${text.replace(/\n/g, '<br>')}</body></html>`;
        blob = new Blob([html], { type: 'application/msword' });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("파일 저장에 실패했습니다.");
    }
  };

  const handleDownloadAudio = (url: string, id: string) => {
    try {
      if (!url) {
        alert("저장할 음성 파일 데이터가 존재하지 않습니다. 다시 생성해 주세요.");
        return;
      }

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      a.download = `uni10_audio_${id.slice(0, 4)}_${dateStr}.wav`;
      
      a.target = '_blank';
      a.rel = 'noopener';

      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 200);
    } catch (err: any) {
      console.error("Audio save failed:", err);
      alert("음성 파일을 저장하는 중 오류가 발생했습니다: " + (err.message || "알 수 없는 오류"));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8 text-center animate-fade-in-up">
          <Bot size={64} className="opacity-10 mb-6" />
          <h2 className="text-4xl font-black text-gray-100 tracking-tighter uppercase">Uni10 AI</h2>
          <p className="mt-4 text-xs font-bold text-gray-400 max-w-xs leading-relaxed">대화를 시작하여 혁신적인 AI 워크스페이스를 경험하세요.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 custom-scrollbar chat-print-area">
          {messages.map((msg) => {
            const isPlaying = currentlyPlayingId === msg.id;
            const isError = msg.text.includes("시스템 오류") || msg.text.includes("할당량 초과");
            const modelLabel = msg.metadata?.model ? `[Uni10 ${msg.metadata.model}]` : '[Uni10 AI]';

            return (
              <div key={msg.id} className={`flex gap-5 max-w-5xl mx-auto ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                {msg.role === Role.MODEL && (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white mt-1 shadow-sm ${isError ? 'bg-red-600' : 'bg-gray-900'}`}>
                    {isError ? <AlertTriangle size={22} /> : <Bot size={22} />}
                  </div>
                )}
                <div className={`flex flex-col max-w-[85%] ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-2 px-1 text-[10px] font-black uppercase tracking-widest transition-all">
                    {isError ? (
                      <span className="text-red-500">System Warning</span>
                    ) : (
                      msg.role === Role.USER ? <span className="text-gray-400">User</span> : <span className="text-blue-600">{modelLabel}</span>
                    )}
                  </div>
                  <div className={`rounded-2xl px-6 py-5 shadow-sm border ${
                    msg.role === Role.USER ? 'bg-blue-50 border-blue-100 text-gray-800' : (isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-100 text-gray-800')
                  }`}>
                    <div className="markdown-content text-[15.5px] leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>{msg.text}</ReactMarkdown>
                    </div>

                    {isError && (
                      <div className="mt-6 pt-6 border-t border-red-200 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={onOpenSettings} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-red-700 transition-all">
                            <Settings size={14} /> 새 API Key 입력
                          </button>
                          <button onClick={onClearAll} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-xs font-black shadow-lg hover:bg-black transition-all">
                            <Trash2 size={14} /> 앱 설정 완전 초기화
                          </button>
                        </div>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all">
                          <HelpCircle size={14} /> 새 프로젝트에서 키 발급받기
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {msg.role === Role.MODEL && !isGenerating && !isError && (
                    <div className="flex items-center w-full mt-3 no-print gap-1">
                      <div className="flex items-center gap-0.5">
                        <button 
                          onClick={() => { navigator.clipboard.writeText(msg.text); setCopiedId(msg.id); setTimeout(()=>setCopiedId(null), 2000); }} 
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="텍스트 복사"
                        >
                          {copiedId === msg.id ? <Check size={16} className="text-green-500" /> : <Copy size={16}/>}
                        </button>
                        <button onClick={() => handleDownload(msg.text, 'doc')} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="docx 다운로드"><FileDown size={16} /></button>
                        <button onClick={() => handleDownload(msg.text, 'txt')} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="txt 다운로드"><FileText size={16} /></button>
                        <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="인쇄"><Printer size={16} /></button>
                      </div>

                      <div className="flex-1"></div>

                      <div className="flex items-center gap-1.5">
                        {msg.audioUrl ? (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => onResetSpeech?.(msg.id)} 
                              className="p-1.5 text-gray-300 hover:text-red-500 rounded-full hover:bg-red-50 transition-all"
                              title="음성 초기화 (다시 생성 가능)"
                            >
                              <RotateCcw size={15} />
                            </button>
                            <div className="flex items-center gap-1 bg-green-50 border border-green-100 rounded-full pr-1 shadow-sm">
                              <button 
                                onClick={() => isPlaying ? onStopAudio() : onPlayAudio(msg.id)} 
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${isPlaying ? 'text-red-600 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'}`}
                              >
                                {isPlaying ? <Square size={12} fill="currentColor"/> : <Play size={12} fill="currentColor"/>} 
                                {isPlaying ? 'STOP' : 'PLAY'}
                              </button>
                              <button 
                                onClick={onToggleLoop}
                                className={`p-1.5 rounded-full transition-all ${isAudioLooping ? 'bg-blue-500 text-white shadow-md' : 'text-green-600 hover:bg-green-100'}`}
                                title={isAudioLooping ? "연속 재생 중 (1번 재생으로 변경)" : "1번 재생 중 (연속 재생으로 변경)"}
                              >
                                {isAudioLooping ? <Repeat size={14} strokeWidth={3} /> : <Repeat1 size={14} />}
                              </button>
                              <button 
                                onClick={() => handleDownloadAudio(msg.audioUrl!, msg.id)}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                title="음성 파일 저장 (WAV)"
                              >
                                <Download size={14} />
                              </button>
                              <div className="relative group/vol flex items-center">
                                 <button 
                                   className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                   onMouseEnter={() => setShowVolumeSlider(msg.id)}
                                 >
                                   {audioVolume > 0.5 ? <Volume2 size={14} /> : audioVolume > 0 ? <Volume1 size={14} /> : <Volume2 size={14} className="opacity-30" />}
                                 </button>
                                 {showVolumeSlider === msg.id && (
                                   <div 
                                     className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white shadow-xl border border-gray-100 rounded-xl z-50 animate-fade-in-up flex items-center gap-2"
                                     onMouseLeave={() => setShowVolumeSlider(null)}
                                   >
                                     <input 
                                       type="range" min="0" max="1" step="0.01" 
                                       value={audioVolume} 
                                       onChange={(e) => setAudioVolume?.(parseFloat(e.target.value))}
                                       className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                     />
                                     <span className="text-[9px] font-black text-blue-600 w-6">{Math.round(audioVolume * 100)}%</span>
                                   </div>
                                 )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => onGenerateSpeech?.(msg.id, msg.text, 'Kore')} 
                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-[11px] font-black transition-all ${msg.isAudioGenerating ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-md scale-105 ring-2 ring-amber-100' : 'text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                            title={msg.isAudioGenerating ? "음성 생성을 중단하려면 클릭하세요" : "음성을 생성합니다"}
                          >
                            {msg.isAudioGenerating ? (
                              <><Loader2 size={14} className="animate-spin" /> [음성 생성 중...]</>
                            ) : (
                              <><Speaker size={14} /> VOICE</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === Role.USER && <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 mt-1 shadow-sm"><User size={22} /></div>}
              </div>
            );
          })}
          {isGenerating && (
            <div className="flex gap-5 max-w-5xl mx-auto justify-start animate-fade-in-up">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white mt-1 shadow-sm"><Bot size={22} /></div>
              <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3"><div className="flex gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span></div></div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}
    </div>
  );
};

export default ChatArea;
