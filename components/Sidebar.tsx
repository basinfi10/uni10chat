
import React, { useRef } from 'react';
import { ChatSession, AppMode, InterpretationMode } from '../types';
import { 
  MessageSquare, Plus, Settings, Trash2, X, 
  Code, ImageIcon, Menu, 
  ChefHat, Heart, Lightbulb, GraduationCap, Save,
  Headphones, MessageSquareText, FileText, Speaker, Download, FileUp,
  ArrowUp, Edit2, Languages, Origami
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onMoveSessionUp: (id: string) => void;
  onCloseMobile: () => void;
  currentMode: AppMode;
  onSetMode: (mode: AppMode) => void;
  onSettingsClick?: () => void;
  onImportSession: (file: File) => void;
  onExportBackup?: () => void;
  onSaveSession: () => void;
  isInterpretActive: boolean;
  interpretMode: InterpretationMode;
  onSetInterpretMode: (mode: InterpretationMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  toggleCollapse,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onMoveSessionUp,
  onCloseMobile,
  currentMode,
  onSetMode,
  onSettingsClick,
  onImportSession,
  onExportBackup,
  onSaveSession,
  isInterpretActive,
  interpretMode,
  onSetInterpretMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { mode: AppMode.CODING_PARTNER, label: '코딩 파트너', icon: <Code size={20} /> },
    { mode: AppMode.IMAGE_EDIT_MODE, label: '이미지 편집', icon: <ImageIcon size={20} /> },
    { mode: AppMode.COOKING, label: '요리 배우기', icon: <ChefHat size={20} /> },
    { mode: AppMode.HEALTH, label: '건강 관리', icon: <Heart size={20} /> },
    { mode: AppMode.LIFE_TIPS, label: '생활 Tips', icon: <Lightbulb size={20} /> },
    { mode: AppMode.ENGLISH_LEARNING, label: '영어 학습', icon: <GraduationCap size={20} /> },
    { mode: AppMode.JAPANESE_LEARNING, label: '일본어 학습', icon: <Origami size={20} /> },
  ];

  const interpretItems = [
    { id: 'voice_text' as InterpretationMode, label: '[음성, 문자]', icon: <Headphones size={20} /> },
    { id: 'text_only' as InterpretationMode, label: '[문자 만]', icon: <MessageSquareText size={20} /> },
    { id: 'subtitle_text' as InterpretationMode, label: '[자막 - 문자]', icon: <FileText size={20} /> },
    { id: 'voice_only' as InterpretationMode, label: '[자막 - 음성]', icon: <Speaker size={20} /> },
  ];

  const handleRename = (id: string, currentTitle: string) => {
    const newTitle = window.prompt("새로운 대화 제목을 입력하세요:", currentTitle);
    if (newTitle && newTitle.trim()) {
      onRenameSession(id, newTitle.trim());
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onCloseMobile} />
      <div className={`fixed inset-y-0 left-0 z-50 bg-[#f8f9fa] border-r border-gray-200 transform transition-all duration-300 h-full flex flex-col lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'} ${!isOpen ? (isCollapsed ? 'w-[80px]' : 'w-[280px]') : ''}`}>
        
        <div className={`p-4 flex items-center shrink-0 h-14 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <button onClick={toggleCollapse} className="hidden lg:flex p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"><Menu size={22} /></button>
          <button onClick={onCloseMobile} className="lg:hidden p-2 text-gray-500 hover:bg-gray-200 rounded-lg"><X size={22} /></button>
        </div>

        <div className="px-4 py-2 shrink-0">
          <button onClick={onNewChat} className={`flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all shadow-md w-full py-3 ${isInterpretActive ? 'opacity-50 grayscale cursor-not-allowed' : ''}`} disabled={isInterpretActive}>
            <Plus size={isCollapsed ? 24 : 20} strokeWidth={3} />
            {!isCollapsed && <span className="font-bold tracking-wide">NEW CHAT</span>}
          </button>
        </div>

        <div className="px-3 py-4 space-y-1 shrink-0 border-b border-gray-100">
          {!isCollapsed && (
            <div className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isInterpretActive ? 'text-green-600' : 'text-gray-400'}`}>
              {isInterpretActive ? '통역 모드 선택' : '기능 선택'}
            </div>
          )}
          
          {isInterpretActive ? (
             interpretItems.map((item) => (
               <button key={item.id} onClick={() => onSetInterpretMode(item.id)} className={`flex items-center gap-3 rounded-lg transition-all w-full px-3 py-2.5 text-sm font-bold ${interpretMode === item.id ? 'bg-green-100 text-green-700 shadow-sm scale-[1.02]' : 'text-gray-400 hover:bg-gray-100'}`}>
                 {item.icon}
                 {!isCollapsed && <span>{item.label}</span>}
               </button>
             ))
          ) : (
            navItems.map((item) => (
              <button 
                key={item.mode} 
                onClick={() => onSetMode(item.mode)} 
                className={`flex items-center gap-3 rounded-lg transition-all w-full px-3 py-2.5 text-sm font-medium border-l-4 ${currentMode === item.mode ? 'bg-blue-100 text-blue-700 border-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100 border-transparent'}`}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            ))
          )}
        </div>

        <div className={`flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar transition-all ${isInterpretActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          {!isCollapsed && (
            <div className="px-3 py-2 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-[#f8f9fa] z-10">
              <span>최근 기록</span>
              {!isInterpretActive && (
                <div className="flex gap-1.5 no-print">
                  <button onClick={onSaveSession} className="p-1 hover:text-blue-600 transition-colors" title="현재 기록 저장 (JSON)"><Save size={14} /></button>
                  <button onClick={onExportBackup} className="p-1 hover:text-green-600 transition-colors" title="모든 기록 백업"><Download size={14} /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:text-purple-600 transition-colors" title="백업 불러오기"><FileUp size={14} /></button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => e.target.files && onImportSession(e.target.files[0])} />
                </div>
              )}
            </div>
          )}
          {sessions.map((session, index) => (
            <div key={session.id} onClick={() => onSelectSession(session.id)} className={`group relative flex items-center justify-between p-3 rounded-xl text-sm cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-white shadow-sm border border-gray-100 text-gray-800 font-bold' : 'text-gray-500 hover:bg-gray-100'}`}>
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'text-blue-500' : 'text-gray-400'}`} />
                {!isCollapsed && <span className="truncate">{session.title}</span>}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {index > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); onMoveSessionUp(session.id); }} className="p-1 text-gray-400 hover:text-blue-500" title="위로 이동"><ArrowUp size={13} /></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleRename(session.id, session.title); }} className="p-1 text-gray-400 hover:text-amber-500" title="이름 변경"><Edit2 size={13} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} className="p-1 text-gray-400 hover:text-red-500" title="삭제"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 shrink-0 bg-[#f8f9fa]">
          <button onClick={onSettingsClick} className="flex items-center gap-3 text-gray-500 hover:text-gray-700 w-full p-2 text-sm font-bold transition-colors">
            <Settings size={20} />
            {!isCollapsed && <span>환경 설정</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
