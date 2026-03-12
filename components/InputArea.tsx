
import React, { useRef, useState, useEffect } from 'react';
import { AppMode, Attachment, ChatFeatures, PromptStyle, InterpretationMode } from '../types';
import { FUNC_PROMPTS } from '../constants/FuncPrompts';
import { 
  Send, Paperclip, X, Mic, Volume2, VolumeX, Menu, 
  Sparkles, PenTool, Zap, Square, Languages,
  FileText, Speaker, Image as ImageIcon,
  Activity, BookOpen, Layers, Monitor, Search, AudioLines, Check
} from 'lucide-react';
import { PLACEHOLDER_TEXT } from '../constants/index';
import { fileToBase64 } from '../services/geminiService';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[], displayLabel?: string) => void;
  isGenerating: boolean;
  mode: AppMode;
  features: ChatFeatures;
  setFeatures: React.Dispatch<React.SetStateAction<ChatFeatures>>;
  isMicActive: boolean;
  toggleMic: () => void;
  isSpeakerActive: boolean;
  toggleSpeaker: () => void;
  promptStyle: PromptStyle;
  setPromptStyle: (style: PromptStyle) => void;
  isAutoTranslate: boolean;
  toggleAutoTranslate: () => void;
  isInterpretActive: boolean;
  interpretMode: InterpretationMode;
  setInterpretMode: (mode: InterpretationMode) => void;
  toggleInterpret: () => void;
  onStop?: () => void;
  liveInputStream?: string;
  isModelSpeaking?: boolean; 
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isGenerating, 
  mode,
  features,
  setFeatures,
  isMicActive,
  toggleMic,
  isSpeakerActive,
  toggleSpeaker,
  promptStyle,
  setPromptStyle,
  isAutoTranslate,
  toggleAutoTranslate,
  isInterpretActive,
  toggleInterpret,
  onStop,
  liveInputStream,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubMenuHidden, setIsSubMenuHidden] = useState(false);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 모드 변경 시 서브 메뉴 다시 보여주기
    setIsSubMenuHidden(false);
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isInterpretActive || isMicActive || !input.trim()) return;
    const timeout = setTimeout(() => { handleSend(); }, 500);
    return () => clearTimeout(timeout);
  }, [input, isInterpretActive, isMicActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating) return;
    onSend(input, attachments);
    setInput('');
    setAttachments([]);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          id: Math.random().toString(36).substring(7),
          file,
          fileName: file.name,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          mimeType: file.type,
          base64Data: base64
        });
      } catch (err) {}
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const toggleFeatureMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isAnyFeatureActive = Object.values(features).some(v => v);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-8 pt-2 font-sans no-print text-center">
      {!isInterpretActive && !isSubMenuHidden && FUNC_PROMPTS[mode]?.subMenus?.length > 0 && (
        <div className="mb-3 relative group/submenu animate-fade-in-up">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 pr-8">
            {FUNC_PROMPTS[mode].subMenus.map((item, idx) => (
               <button 
                  key={idx} 
                  onClick={() => onSend(item.prompt, [], item.label)} 
                  disabled={isGenerating}
                  className="px-2 py-1.5 bg-white text-gray-600 border border-gray-100 rounded-lg text-xs font-bold shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed truncate"
                >
                  {item.label}
                </button>
            ))}
          </div>
          <button 
            onClick={() => setIsSubMenuHidden(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500 transition-colors rounded-full hover:bg-gray-100"
            title="서브 메뉴 닫기"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-2">
          {attachments.map(att => (
            <div key={att.id} className="relative group">
              {att.previewUrl ? <img src={att.previewUrl} className="w-14 h-14 object-cover rounded-xl border border-gray-200" /> : <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center"><FileText size={20} className="text-gray-400" /></div>}
              <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm transition-all"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
        <button onClick={() => setPromptStyle('default')} className={`flex items-center justify-center w-9 h-9 rounded-full transition-all border shadow-sm ${(!isInterpretActive && !isAutoTranslate && promptStyle === 'default') ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`} title="스마트"><Sparkles size={18} /></button>
        <button onClick={() => setPromptStyle('blog')} className={`flex items-center justify-center w-9 h-9 rounded-full transition-all border shadow-sm ${(!isInterpretActive && !isAutoTranslate && promptStyle === 'blog') ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`} title="블로그"><PenTool size={18} /></button>
        <button onClick={() => setPromptStyle('enhance')} className={`flex items-center justify-center w-9 h-9 rounded-full transition-all border shadow-sm ${(!isInterpretActive && !isAutoTranslate && promptStyle === 'enhance') ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`} title="전문가"><Zap size={18} /></button>
        <button onClick={toggleAutoTranslate} className={`flex items-center justify-center w-9 h-9 rounded-full transition-all border shadow-sm ${isAutoTranslate ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`} title="번역"><Languages size={18} /></button>

        <button onClick={toggleInterpret} className={`flex items-center justify-center w-9 h-9 rounded-full transition-all border shadow-sm relative ${isInterpretActive ? 'bg-green-500 text-white border-green-600 ring-2 ring-green-100' : 'bg-white text-gray-600 border-gray-200 hover:scale-110'}`} title="라이브 채팅">
          {isInterpretActive ? <Activity size={18} /> : <AudioLines size={18} />}
          {isInterpretActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-600 flex items-center justify-center"><Activity size={6} className="text-white" /></span></span>
          )}
        </button>

        <div className="flex-1"></div>
        <button onClick={toggleSpeaker} className={`flex items-center gap-2 px-3 h-10 rounded-full transition-all border shadow-sm mr-1 ${isSpeakerActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`} title="자동 음성 출력">
          {isSpeakerActive ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span className="text-[10px] font-black uppercase tracking-tighter">음성 생성</span>
        </button>
        <button onClick={toggleMic} className={`flex items-center justify-center w-9 h-9 rounded-full transition-all border shadow-sm mr-1 relative ${isMicActive ? 'bg-green-600 text-white border-green-700 ring-4 ring-green-100 scale-110' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}><Mic size={18} />{isMicActive && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}</button>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-white rounded-[28px] border transition-all shadow-md flex flex-col ${isDragging ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-100' : isMicActive ? 'border-green-500 ring-4 ring-green-50' : 'border-gray-200 focus-within:border-gray-400 focus-within:shadow-lg'}`}
      >
        {isMicActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
             <div className="relative flex items-center justify-center w-32 h-32">
                <div className="absolute inset-0 bg-green-500 rounded-full opacity-10 animate-ping"></div>
                <div className="absolute inset-4 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-8 bg-green-500 rounded-full opacity-30"></div>
                <Mic size={32} className="text-green-600 z-20" />
             </div>
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-green-700 font-black text-lg text-center px-4 w-full truncate drop-shadow-sm">{liveInputStream || "말씀하세요..."}</div>
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/80 z-20 rounded-[28px] border-2 border-dashed border-blue-400 animate-pulse pointer-events-none">
            <FileText size={48} className="text-blue-500 mb-2" />
            <span className="text-blue-700 font-bold">여기에 파일을 놓으세요</span>
          </div>
        )}

        <textarea ref={textAreaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isInterpretActive ? "실시간 통역 중..." : PLACEHOLDER_TEXT} disabled={isGenerating || isMicActive} className={`w-full bg-transparent border-0 focus:ring-0 resize-none pl-7 pr-24 pt-6 pb-16 text-gray-800 placeholder-gray-400 text-[17px] leading-relaxed transition-opacity z-10 ${isMicActive ? 'opacity-0' : 'opacity-100'}`} style={{ height: '140px', maxHeight: '250px' }} />
        
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
          {!isInterpretActive && (
            <>
              <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-blue-600 p-2.5 rounded-full hover:bg-blue-50 transition-all" title="파일 첨부"><Paperclip size={22} /></button>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => processFiles(e.target.files)} />
              <div className="relative" ref={menuRef}>
                <button onClick={toggleFeatureMenu} className={`p-2.5 rounded-full transition-all relative ${isMenuOpen ? 'bg-gray-100 text-gray-800 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <Menu size={22} />
                  {isAnyFeatureActive && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></span>}
                </button>
                {isMenuOpen && (
                  <div className="absolute bottom-16 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-fade-in-up origin-bottom-right overflow-hidden">
                    <div className="text-[10px] font-black text-gray-400 px-3 py-2 uppercase tracking-widest border-b border-gray-50 flex items-center justify-between">
                      <span>기능 선택</span>
                      <button onClick={() => setFeatures({deepResearch: false, imageGenEdit: false, canvas: false, dynamicView: false, guideLearning: false})} className="text-blue-500 hover:underline">모두 해제</button>
                    </div>
                    <div className="p-1 space-y-0.5">
                      {[
                        { key: 'deepResearch', label: 'Deep Research', icon: <Search size={16} /> },
                        { key: 'imageGenEdit', label: '이미지 편집 / 생성', icon: <ImageIcon size={16} /> },
                        { key: 'canvas', label: 'Canvas Mode', icon: <Layers size={16} /> },
                        { key: 'dynamicView', label: '동적 뷰 (Dynamic)', icon: <Monitor size={16} /> },
                        { key: 'guideLearning', label: '가이드 학습', icon: <BookOpen size={16} /> },
                      ].map((feat) => (
                        <button 
                          key={feat.key}
                          onClick={() => { setFeatures(prev => ({...prev, [feat.key]: !prev[feat.key as keyof ChatFeatures]})); }} 
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors text-sm ${features[feat.key as keyof ChatFeatures] ? 'bg-blue-50 text-blue-700 font-black ring-1 ring-blue-200' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                          <div className="flex items-center gap-3">
                            {feat.icon}
                            <span>{feat.label}</span>
                          </div>
                          {features[feat.key as keyof ChatFeatures] && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          <button onClick={isGenerating ? onStop : handleSend} disabled={(!input.trim() && attachments.length === 0 && !isGenerating && !isMicActive)} className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-lg ${(!input.trim() && attachments.length === 0 && !isGenerating && !isMicActive) ? 'bg-gray-200 text-gray-400' : isGenerating ? 'bg-gray-800 text-white hover:scale-95' : 'bg-black text-white hover:scale-110 active:scale-95'}`}>{isGenerating ? <Square size={18} fill="white" /> : <Send size={22} className="ml-1" />}</button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
