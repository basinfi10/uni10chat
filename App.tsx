
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import ApiKeyModal from './components/ApiKeyModal';
import { AppMode, Attachment, ChatMessage, ChatSession, Role, ChatFeatures, PromptStyle, InterpretationMode, MODELS } from './types';
import { streamResponse, handleImageFeature, generateSpeech, updateApiKey, LiveClient } from './services/geminiService';
import { Sparkles, Menu } from 'lucide-react';
import { LIVE_PERSONAS, PERSONA_COMMON_RULES } from './constants/LivePersonas';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const APP_VERSION = "v2.29";

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

  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("0");
  const [liveStatus, setLiveStatus] = useState<string>("disconnected");
  const [liveUserTrans, setLiveUserTrans] = useState("");
  const [liveModelTrans, setLiveModelTrans] = useState("");
  const [userVolume, setUserVolume] = useState(0);
  const [modelVolume, setModelVolume] = useState(0);
  const liveClientRef = useRef<LiveClient | null>(null);

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
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      liveClientRef.current = null;
      setLiveStatus("disconnected");
    }
  };

  const handleToggleLiveChat = async () => {
    if (isInterpretActive) {
      setIsInterpretActive(false);
      if (liveClientRef.current) {
        liveClientRef.current.disconnect();
        liveClientRef.current = null;
      }
      setLiveStatus("disconnected");
    } else {
      const savedKey = localStorage.getItem('uni10_api_key');
      if (!savedKey && !window.aistudio) {
        alert("라이브 채팅을 시작하려면 API Key가 필요합니다.");
        setIsSettingsModalOpen(true);
        return;
      }
      
      setIsInterpretActive(true);
      setLiveStatus("connecting");
      setUserVolume(0);
      setModelVolume(0);
      setIsMicActive(true);   // AUTO ON
      setIsSpeakerActive(true); // AUTO ON

      // Clear current chat session messages on entry
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [] } : s));

      const persona = LIVE_PERSONAS.find(p => p.id === selectedPersonaId) || LIVE_PERSONAS[0];
      
      // 마이크 존재 여부 1차 확인 (사전 안내)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMic = devices.some(device => device.kind === 'audioinput');
        if (!hasMic) {
          alert("일시적으로 마이크를 찾을 수 없습니다. 마이크 장치를 연결해 주세요.");
          setIsInterpretActive(false);
          return;
        }
      } catch (e) {
        console.warn("Device check failed", e);
      }

      liveClientRef.current = new LiveClient(
        (status, err) => {
          setLiveStatus(status);
          if (err) {
            console.error("Live Chat Error:", err);
          }
        },
        (text, isUser, isFinal) => {
            if (isUser) {
              setLiveUserTrans(prev => isFinal ? "" : prev + text);
              if (isFinal && text.trim()) {
                handleAppendLiveTranscript(Role.USER, text);
              }
            } else {
              setLiveModelTrans(text);
              if (isFinal && text.trim()) {
                handleAppendLiveTranscript(Role.MODEL, text);
                // AI 대답 후 3초 뒤에 라이브 텍스트 클리어 (사용자 요청: 자동으로 clear 되게 한다)
                setTimeout(() => setLiveModelTrans(""), 3000);
              }
            }
        },
        (volume, isUser) => {
          if (isUser) setUserVolume(volume);
          else setModelVolume(volume);
        }
      );
      
      try {
        const fullInstruction = PERSONA_COMMON_RULES + "\n" + persona.systemInstruction;
        console.log("Connecting to Live Client with persona:", persona.label);
        
        // 연결 전 안내 메시지 (상태 업데이트) - 음성 표기창에 메세지로 상태 메세지를 보임
        setLiveModelTrans("연결 중... 대화를 준비하고 있습니다.");
        
        await liveClientRef.current.connect(fullInstruction);
        console.log("Live Client connected successfully");
        
        // 연결 성공 후 초기 메시지 - 음성 문자 표시부에만 표시 (메인 채팅창 제외)
        setLiveModelTrans(persona.initialMessage);
        // handleAppendLiveTranscript(Role.MODEL, persona.initialMessage); // 제거: 메인 채팅창에 안 나오게 함
        setTimeout(() => setLiveModelTrans(""), 5000);
      } catch (err) {
        console.error("Live Client connection failed:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        
        setIsInterpretActive(false);
        setLiveStatus("error");
        
        if (errMsg.includes("마이크")) {
          setLiveModelTrans(`마이크 설정 오류: ${errMsg}`);
        } else {
          setLiveModelTrans(`연결 실패: ${errMsg}`);
        }
        setTimeout(() => setLiveModelTrans(""), 5000);
      }
    }
  };

  const handleAppendLiveTranscript = (role: Role, text: string) => {
    if (!currentSessionId) return;
    const msgId = uuidv4();
    const activeModel = MODELS.LIVE;
    addMessageToSession(currentSessionId, role, text, msgId, activeModel);
  };

  const handleSelectPersona = async (personaId: string) => {
    setSelectedPersonaId(personaId);
    if (isInterpretActive && liveClientRef.current) {
      // Reconnect with new persona
      const persona = LIVE_PERSONAS.find(p => p.id === personaId) || LIVE_PERSONAS[0];
      const fullInstruction = PERSONA_COMMON_RULES + "\n" + persona.systemInstruction;
      
      // Disconnect and reconnect is safest for full context reset
      liveClientRef.current.disconnect();
      setLiveStatus("connecting");
      try {
        await liveClientRef.current.connect(fullInstruction);
        handleAppendLiveTranscript(Role.MODEL, persona.initialMessage);
      } catch (e) {
        setLiveStatus("error");
      }
    }
  };

  const handleSaveApiKey = (key: string) => { updateApiKey(key); setIsSettingsModalOpen(false); };
  const handleResetApiKey = async () => { if (window.aistudio) { await window.aistudio.openSelectKey(); } setIsSettingsModalOpen(false); };
  const handleRenameSession = (id: string, newTitle: string) => { setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s)); };
  const handleMoveSessionUp = (id: string) => { setSessions(prev => { const idx = prev.findIndex(s => s.id === id); if (idx <= 0) return prev; const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next; }); };
  const handleSaveSessionManually = () => { const current = getCurrentSession(); if (!current) return; const data = JSON.stringify(current, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `uni10_session_${current.title.replace(/\s+/g, '_')}_${new Date().getTime()}.json`; a.click(); URL.revokeObjectURL(url); };
  const handleExportBackup = () => { const data = JSON.stringify(sessions, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `uni10_all_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const handleImportSession = (file: File) => { const reader = new FileReader(); reader.onload = (e) => { try { const imported = JSON.parse(e.target?.result as string); if (Array.isArray(imported)) { setSessions(prev => { const existingIds = new Set(prev.map(s => s.id)); const filteredImported = imported.filter(s => !existingIds.has(s.id)); return [...filteredImported, ...prev]; }); alert(`${imported.length}개의 기록을 불러왔습니다.`); } else if (imported?.id) { setSessions(prev => [imported, ...prev]); setCurrentSessionId(imported.id); } } catch (err) { alert("백업 파일 오류"); } }; reader.readAsText(file); };

  const handleSetMode = (newMode: AppMode) => { 
    setMode(prev => prev === newMode ? AppMode.CHAT : newMode); 
    // Clear live mode status and disconnect
    if (isInterpretActive) {
       liveClientRef.current?.disconnect();
       setIsInterpretActive(false);
    }
    setLiveUserTrans("");
    setLiveModelTrans("");
    setUserVolume(0);
    setModelVolume(0);
  };

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
        selectedPersonaId={selectedPersonaId} onSelectPersona={handleSelectPersona}
      />
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        <div className="h-14 border-b border-gray-100 flex items-center px-4 justify-between bg-white z-10 no-print">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)} 
                className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="메뉴 열기"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-gray-800 flex items-center gap-1 leading-tight">
                    <Sparkles className="text-blue-600" size={20}/>Uni10
                  </h2>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter -mt-0.5">Project Next</span>
                </div>
                
                <div className="h-6 w-[1px] bg-gray-100 mx-1"></div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 uppercase tracking-tighter">
                    {APP_VERSION}
                  </span>
                  
                  {isInterpretActive && (
                    <div className="flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded-md animate-fade-in shadow-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${liveStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">
                        {liveStatus === 'connected' ? 'LIVE ACTIVE' : 'CONNECTING...'}
                      </span>
                    </div>
                  )}
                </div>
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
             liveStatus={liveStatus} liveUserTrans={liveUserTrans} liveModelTrans={liveModelTrans}
             isInterpretActive={isInterpretActive} modelVolume={modelVolume}
            />
        </div>
        <div className="shrink-0 bg-white">
          <InputArea 
            onSend={handleSendMessage} isGenerating={isGenerating} onStop={() => abortControllerRef.current?.abort()}
            mode={mode} features={features} setFeatures={setFeatures} isMicActive={isMicActive} toggleMic={() => setIsMicActive(!isMicActive)}
            isSpeakerActive={isSpeakerActive} toggleSpeaker={() => setIsSpeakerActive(!isSpeakerActive)}
            promptStyle={promptStyle} setPromptStyle={setPromptStyle} isAutoTranslate={isAutoTranslate} toggleAutoTranslate={() => setIsAutoTranslate(!isAutoTranslate)}
            isInterpretActive={isInterpretActive} interpretMode={interpretMode} setInterpretMode={setInterpretMode} toggleInterpret={handleToggleLiveChat}
            userVolume={userVolume}
          />
        </div>
      </div>
      {isSettingsModalOpen && <ApiKeyModal isSettingsMode={true} onSave={handleSaveApiKey} onClose={() => setIsSettingsModalOpen(false)} onReset={handleResetApiKey} />}
    </div>
  );
};

export default App;
