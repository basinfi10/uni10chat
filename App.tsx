
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import ApiKeyModal from './components/ApiKeyModal';
import LiveSession from './components/LiveSession';
import { AppMode, Attachment, ChatMessage, ChatSession, Role, ChatFeatures, PromptStyle, InterpretationMode, MODELS } from './types';
import { streamResponse, handleImageFeature, generateSpeech, updateApiKey } from './services/geminiService';
import { Sparkles, Menu } from 'lucide-react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const APP_VERSION = "v2.26";

const App: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [promptStyle, setPromptStyle] = useState<PromptStyle>('default');
  const [isAutoTranslate, setIsAutoTranslate] = useState(false);
  const [isInterpretActive, setIsInterpretActive] = useState(false);
  const [interpretMode, setInterpretMode] = useState<InterpretationMode>('voice_text');
  
  const [features, setFeatures] = useState<ChatFeatures>({
    deepResearch: false, imageGenEdit: false, canvas: false, dynamicView: false, guideLearning: false,
  });

  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState(1.0);
  const [isAudioLooping, setIsAudioLooping] = useState(false);
  
  const globalAudioRef = useRef<HTMLAudioElement>(new Audio());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const initApp = async () => {
      const saved = localStorage.getItem('uni10_sessions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessions(parsed);
          if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
        } catch (e) { createNewSession(); }
      } else { createNewSession(); }
      setIsHistoryLoaded(true);

      const savedKey = localStorage.getItem('uni10_api_key');
      if (savedKey) {
        updateApiKey(savedKey);
      } else if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) setIsSettingsModalOpen(true);
      } else {
        setIsSettingsModalOpen(true);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isHistoryLoaded) {
      const sessionsToSave = sessions.filter(s => s.messages.length > 0 || s.id === currentSessionId);
      try { localStorage.setItem('uni10_sessions', JSON.stringify(sessionsToSave)); } catch (e) {}
    }
  }, [sessions, isHistoryLoaded, currentSessionId]);

  useEffect(() => {
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = audioVolume;
      globalAudioRef.current.loop = isAudioLooping;
    }
  }, [audioVolume, isAudioLooping]);

  const handleClearAllSettings = () => {
    if (window.confirm("주의: 모든 기록과 설정을 삭제하시겠습니까?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const createNewSession = () => {
    const current = getCurrentSession();
    if (current && current.messages.length === 0) return;
    const newSession: ChatSession = { id: uuidv4(), title: '새로운 작업', messages: [], updatedAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsGenerating(false);
    setMode(AppMode.CHAT);
    setFeatures({ deepResearch: false, imageGenEdit: false, canvas: false, dynamicView: false, guideLearning: false });
    setIsInterpretActive(false);
  };

  const handleSaveApiKey = (key: string) => { updateApiKey(key); setIsSettingsModalOpen(false); };
  const handleResetApiKey = async () => { if (window.aistudio) { await window.aistudio.openSelectKey(); } setIsSettingsModalOpen(false); };
  const handleRenameSession = (id: string, newTitle: string) => { setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s)); };
  const handleMoveSessionUp = (id: string) => { setSessions(prev => { const idx = prev.findIndex(s => s.id === id); if (idx <= 0) return prev; const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next; }); };
  const handleSaveSessionManually = () => { const current = getCurrentSession(); if (!current) return; const data = JSON.stringify(current, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `uni10_session_${current.title.replace(/\s+/g, '_')}_${new Date().getTime()}.json`; a.click(); URL.revokeObjectURL(url); };
  const handleExportBackup = () => { const data = JSON.stringify(sessions, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `uni10_all_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const handleImportSession = (file: File) => { const reader = new FileReader(); reader.onload = (e) => { try { const imported = JSON.parse(e.target?.result as string); if (Array.isArray(imported)) { setSessions(prev => { const existingIds = new Set(prev.map(s => s.id)); const filteredImported = imported.filter(s => !existingIds.has(s.id)); return [...filteredImported, ...prev]; }); alert(`${imported.length}개의 기록을 불러왔습니다.`); } else if (imported?.id) { setSessions(prev => [imported, ...prev]); setCurrentSessionId(imported.id); } } catch (err) { alert("백업 파일 오류"); } }; reader.readAsText(file); };

  const handleSetMode = (newMode: AppMode) => { setMode(prev => prev === newMode ? AppMode.CHAT : newMode); setIsMobileSidebarOpen(false); };

  const handleSendMessage = async (text: string, attachments: Attachment[], displayLabel?: string) => {
    if (!currentSessionId || isGenerating) return;
    abortControllerRef.current = new AbortController();
    const current = getCurrentSession();
    if (current && (current.title === '새로운 작업' || !current.title)) {
      const cleanTitle = (displayLabel || text).trim().slice(0, 15);
      handleRenameSession(currentSessionId, cleanTitle + (text.length > 15 ? "..." : ""));
    }
    const userMsg: ChatMessage = { id: uuidv4(), role: Role.USER, text: displayLabel || text, timestamp: Date.now(), attachments, metadata: { mode, promptStyle } };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg], updatedAt: Date.now() } : s));
    setIsGenerating(true);
    const botMsgId = uuidv4();
    const activeModel = localStorage.getItem('uni10_pref_text_model') || MODELS.G25_FLASH; // 기본값 변경 (G3 Flash -> G2.5 Flash)
    try {
      if (features.imageGenEdit) {
        addMessageToSession(currentSessionId, Role.MODEL, "이미지 생성 중...", botMsgId, activeModel);
        const base64Image = await handleImageFeature(text, attachments);
        updateBotMessage(botMsgId, currentSessionId, { text: "이미지를 생성했습니다.", generatedImage: base64Image });
      } else {
        const history = getCurrentSession()?.messages || [];
        let accumulatedText = "";
        addMessageToSession(currentSessionId, Role.MODEL, "", botMsgId, activeModel);
        await streamResponse(history, text, attachments, mode, features, promptStyle, isAutoTranslate, (chunk) => {
          accumulatedText += chunk;
          updateBotMessage(botMsgId, currentSessionId, { text: accumulatedText });
        }, abortControllerRef.current.signal);
        if (isSpeakerActive && accumulatedText.trim()) { handleGenerateSpeech(botMsgId, accumulatedText, 'Kore'); }
      }
    } catch (error: any) { addMessageToSession(currentSessionId, Role.MODEL, `\n\n### ⛔ 시스템 오류\n${error.message}`, botMsgId, activeModel); } 
    finally { setIsGenerating(false); abortControllerRef.current = null; }
  };

  const handleGenerateSpeech = async (msgId: string, text: string, voice: string) => {
    const targetSessionId = currentSessionId;
    if (!targetSessionId) return;

    const msg = getCurrentSession()?.messages.find(m => m.id === msgId);
    if (msg?.audioUrl) { handlePlayAudio(msgId); return; }
    if (msg?.isAudioGenerating) {
      updateBotMessage(msgId, targetSessionId, { isAudioGenerating: false });
      return;
    }

    updateBotMessage(msgId, targetSessionId, { isAudioGenerating: true });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("음성 생성 시간이 초과되었습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.")), 60000));

    try {
      const audioUrl = await Promise.race([generateSpeech(text, voice), timeoutPromise]) as string;
      updateBotMessage(msgId, targetSessionId, { audioUrl, isAudioGenerating: false });
      handlePlayAudio(msgId);
    } catch (e: any) { 
      updateBotMessage(msgId, targetSessionId, { isAudioGenerating: false });
      console.warn("Speech generation error:", e.message);
      alert(`음성 생성 실패: ${e.message}`);
    }
  };

  const handlePlayAudio = (id: string) => {
    const msg = getCurrentSession()?.messages.find(m => m.id === id);
    if (msg?.audioUrl) {
      try {
        globalAudioRef.current.pause();
        globalAudioRef.current.src = msg.audioUrl;
        globalAudioRef.current.load(); // 다른 채팅 다녀올 시 브라우저 오디오 상태 리셋 방지
        globalAudioRef.current.volume = audioVolume;
        globalAudioRef.current.loop = isAudioLooping;
        
        const playPromise = globalAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
             console.error("재생 오류:", e);
             setCurrentlyPlayingId(null);
          });
        }
        
        setCurrentlyPlayingId(id);
        globalAudioRef.current.onended = () => {
          if (!isAudioLooping) {
            setCurrentlyPlayingId(null);
          }
        };
      } catch (e) {
        console.error("오디오 엔진 오류:", e);
        setCurrentlyPlayingId(null);
      }
    }
  };

  const handleResetSpeech = (msgId: string) => {
    const targetSessionId = currentSessionId;
    if (!targetSessionId) return;
    if (currentlyPlayingId === msgId) {
      globalAudioRef.current.pause();
      setCurrentlyPlayingId(null);
    }
    updateBotMessage(msgId, targetSessionId, { audioUrl: undefined, isAudioGenerating: false });
  };

  const updateBotMessage = (msgId: string, sessionId: string | null, updates: Partial<ChatMessage>) => {
    if (!sessionId) return;
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: s.messages.map(m => m.id === msgId ? { ...m, ...updates } : m) } : s));
  };

  const addMessageToSession = (sessionId: string, role: Role, text: string, id?: string, modelName?: string) => {
     setSessions(prev => prev.map(s => sessionId === s.id ? { ...s, messages: [...s.messages, { id: id || uuidv4(), role, text, timestamp: Date.now(), metadata: { mode, model: modelName } }], updatedAt: Date.now() } : s));
  };
  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen w-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar
        isOpen={isMobileSidebarOpen} isCollapsed={isDesktopCollapsed} toggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        sessions={sessions} currentSessionId={currentSessionId} onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession} onDeleteSession={(id) => { const next = sessions.filter(s => s.id !== id); setSessions(next); if (currentSessionId === id) setCurrentSessionId(next[0]?.id || null); }}
        onRenameSession={handleRenameSession} onMoveSessionUp={handleMoveSessionUp} onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentMode={mode} onSetMode={handleSetMode} onSettingsClick={() => setIsSettingsModalOpen(true)} 
        onImportSession={handleImportSession} onExportBackup={handleExportBackup} onSaveSession={handleSaveSessionManually}
        isInterpretActive={isInterpretActive} interpretMode={interpretMode} onSetInterpretMode={setInterpretMode}
      />
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {isInterpretActive && <div className="absolute inset-0 z-50 animate-fade-in-up"><LiveSession onClose={() => setIsInterpretActive(false)} /></div>}
        <div className="h-14 border-b border-gray-100 flex items-center px-4 justify-between bg-white z-10 no-print">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Menu size={20} /></button>
             <div className="flex items-center gap-2">
               <h2 className="text-2xl font-black text-gray-800 flex items-center gap-1"><Sparkles className="text-blue-600" size={24}/>Uni10</h2>
               <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter mt-1">{APP_VERSION}</span>
             </div>
           </div>
        </div>
        <div className="flex-1 overflow-hidden relative flex flex-col">
           <ChatArea 
             messages={getCurrentSession()?.messages || []} isGenerating={isGenerating} onGenerateSpeech={handleGenerateSpeech}
             currentlyPlayingId={currentlyPlayingId} onStopAudio={() => { globalAudioRef.current.pause(); setCurrentlyPlayingId(null); }}
             onPlayAudio={handlePlayAudio} onResetSpeech={handleResetSpeech}
             onOpenSettings={() => setIsSettingsModalOpen(true)} onClearAll={handleClearAllSettings}
             audioVolume={audioVolume} setAudioVolume={setAudioVolume}
             isAudioLooping={isAudioLooping} onToggleLoop={() => setIsAudioLooping(!isAudioLooping)}
           />
        </div>
        <div className="shrink-0 bg-white">
          <InputArea 
            onSend={handleSendMessage} isGenerating={isGenerating} onStop={() => abortControllerRef.current?.abort()}
            mode={mode} features={features} setFeatures={setFeatures} isMicActive={isMicActive} toggleMic={() => setIsMicActive(!isMicActive)}
            isSpeakerActive={isSpeakerActive} toggleSpeaker={() => setIsSpeakerActive(!isSpeakerActive)}
            promptStyle={promptStyle} setPromptStyle={setPromptStyle} isAutoTranslate={isAutoTranslate} toggleAutoTranslate={() => setIsAutoTranslate(!isAutoTranslate)}
            isInterpretActive={isInterpretActive} interpretMode={interpretMode} setInterpretMode={setInterpretMode} toggleInterpret={() => setIsInterpretActive(!isInterpretActive)}
          />
        </div>
      </div>
      {isSettingsModalOpen && <ApiKeyModal isSettingsMode={true} onSave={handleSaveApiKey} onClose={() => setIsSettingsModalOpen(false)} onReset={handleResetApiKey} />}
    </div>
  );
};

export default App;
