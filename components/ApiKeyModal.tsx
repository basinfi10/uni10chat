
import React, { useState, useEffect } from 'react';
import { Key, Lock, CheckCircle, AlertCircle, ExternalLink, BarChart2, RotateCcw, X, Info, Settings, ShieldCheck, Trash2, Cpu, Image as ImageIcon, Speaker, Check } from 'lucide-react';
import { MODELS } from '../types';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  onClose?: () => void;
  onReset?: () => void;
  isSettingsMode?: boolean; 
}

interface ModelOption {
  id: string;
  name: string;
  category: 'text' | 'image' | 'tts';
  description: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, onClose, onReset, isSettingsMode = false }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [currentKeyHint, setCurrentKeyHint] = useState<string | null>(null);

  // 모델별 선택 상태 - 초기 설정 변경 (G3 -> G2.5)
  const [prefTextModel, setPrefTextModel] = useState(MODELS.G25_FLASH);
  const [prefImageModel, setPrefImageModel] = useState(MODELS.G25_FLASH_IMAGE);
  const [prefTtsModel, setPrefTtsModel] = useState(MODELS.G25_FLASH_TTS);

  const modelOptions: ModelOption[] = [
    { id: MODELS.G3_PRO, name: 'Gemini 3 Pro', category: 'text', description: 'Expert Reasoning' },
    { id: MODELS.G3_FLASH, name: 'Gemini 3 Flash', category: 'text', description: 'Lightning Fast' },
    { id: MODELS.G25_PRO, name: 'Gemini 2.5 Pro', category: 'text', description: 'Stable Expert' },
    { id: MODELS.G25_FLASH, name: 'Gemini 2.5 Flash', category: 'text', description: 'Stable Fast' },
    { id: MODELS.G3_PRO_IMAGE, name: 'G3 Pro Image', category: 'image', description: 'Hi-Res Creation' },
    { id: MODELS.G25_FLASH_IMAGE, name: 'G2.5 Flash Image', category: 'image', description: 'Fast Editing' },
    { id: MODELS.G25_PRO_TTS, name: 'G2.5 Pro TTS', category: 'tts', description: 'Natural Voice' },
    { id: MODELS.G25_FLASH_TTS, name: 'G2.5 Flash TTS', category: 'tts', description: 'Fast Speech' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('uni10_api_key');
    if (saved) {
      setKey(saved);
      setCurrentKeyHint(`${saved.slice(0, 4)}...${saved.slice(-4)}`);
    }

    const savedText = localStorage.getItem('uni10_pref_text_model');
    const savedImage = localStorage.getItem('uni10_pref_image_model');
    const savedTts = localStorage.getItem('uni10_pref_tts_model');

    if (savedText) setPrefTextModel(savedText);
    if (savedImage) setPrefImageModel(savedImage);
    if (savedTts) setPrefTtsModel(savedTts);
  }, []);

  const handleSelectModel = (m: ModelOption) => {
    if (m.category === 'text') {
      setPrefTextModel(m.id);
      localStorage.setItem('uni10_pref_text_model', m.id);
    } else if (m.category === 'image') {
      setPrefImageModel(m.id);
      localStorage.setItem('uni10_pref_image_model', m.id);
    } else if (m.category === 'tts') {
      setPrefTtsModel(m.id);
      localStorage.setItem('uni10_pref_tts_model', m.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = key.trim();
    if (trimmedKey && !trimmedKey.startsWith('AIza')) {
      setError('유효하지 않은 API Key 형식입니다.');
      return;
    }
    onSave(trimmedKey);
  };

  const handleClear = () => {
    if (window.confirm("모든 설정을 초기화하시겠습니까?")) {
      localStorage.removeItem('uni10_api_key');
      localStorage.removeItem('uni10_pref_text_model');
      localStorage.removeItem('uni10_pref_image_model');
      localStorage.removeItem('uni10_pref_tts_model');
      window.location.reload();
    }
  };

  const isSelected = (id: string) => [prefTextModel, prefImageModel, prefTtsModel].includes(id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-8 animate-fade-in-up">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-full overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <Settings size={22} className="text-blue-400" />
            <div className="flex flex-col">
              <h2 className="text-xl font-black tracking-tight">Uni10 시스템 설정</h2>
              {currentKeyHint && <span className="text-[10px] text-green-400 font-bold uppercase tracking-tighter">API KEY ACTIVE</span>}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Section: API Key */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Lock size={14} /> API Key Configuration
              </h3>
              {currentKeyHint && (
                <button type="button" onClick={handleClear} className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1">
                  <Trash2 size={12} /> Reset All
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(''); }}
                  placeholder="AIzaSy..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-mono"
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 p-4 rounded-xl border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="font-bold">{error}</span>
                </div>
              )}
              <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg transition-all transform hover:-translate-y-0.5">
                API Key 저장 및 즉시 적용
              </button>
            </form>
          </section>

          {/* Section: AI Model Settings */}
          <section>
            <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Cpu size={14} /> AI Model Selection (용도별 엔진 설정)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modelOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectModel(opt)}
                  className={`relative flex flex-col items-start p-4 rounded-2xl border transition-all text-left group
                    ${isSelected(opt.id) 
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                      : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="flex items-center gap-2 font-black text-sm text-gray-800">
                      {opt.category === 'text' && <Cpu size={14} className="text-blue-500" />}
                      {opt.category === 'image' && <ImageIcon size={14} className="text-purple-500" />}
                      {opt.category === 'tts' && <Speaker size={14} className="text-green-500" />}
                      {opt.name}
                    </span>
                    {isSelected(opt.id) ? (
                      <span className="bg-blue-600 text-white rounded-full p-0.5"><Check size={10} strokeWidth={4} /></span>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-blue-300 transition-colors" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{opt.description}</span>
                  <div className="mt-2 text-[9px] font-mono text-gray-400 truncate w-full">{opt.id}</div>
                </button>
              ))}
            </div>
          </section>

          <div className="mt-10 pt-8 border-t border-gray-100 space-y-3">
             <button 
                onClick={onReset}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3"><RotateCcw size={18} className="text-indigo-400"/><span>구글 인증 다이얼로그 열기</span></div>
                <ExternalLink size={14} className="opacity-40" />
              </button>

              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3"><BarChart2 size={18} className="text-gray-400"/><span>할당량 및 사용량 확인</span></div>
                <ExternalLink size={14} className="opacity-40" />
              </a>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
            <Info size={12} />
            <span>Uni10 Multi-Model Engine v2.27</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
