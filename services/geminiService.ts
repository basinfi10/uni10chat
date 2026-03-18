
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";
import { AppMode, Attachment, ChatMessage, MODELS, Role, ChatFeatures, PromptStyle } from "../types";
import { PROMPTS } from "../constants/index";
import { FUNC_PROMPTS } from "../constants/FuncPrompts";

let runtimeApiKey: string | null = null;
// 음성 캐시: 동일한 텍스트에 대해 API 호출을 방지하여 할당량 초과(429) 해결
const speechCache = new Map<string, string>();

export const updateApiKey = (newKey: string) => {
  runtimeApiKey = newKey;
  if (newKey) localStorage.setItem('uni10_api_key', newKey);
  else localStorage.removeItem('uni10_api_key');
};

const getMaskedKey = (): string => {
  const key = runtimeApiKey || localStorage.getItem('uni10_api_key') || process.env.API_KEY || "";
  if (!key) return "설정된 키 없음";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
};

const parseGeminiError = (error: any): string => {
  const errorStr = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const lowerError = errorStr.toLowerCase();
  
  if (lowerError.includes("429") || lowerError.includes("resource_exhausted") || lowerError.includes("quota")) {
    return `[할당량 초과] 구글 API 호출 한도를 다 썼습니다. 무료 버전은 분당 요청 횟수가 매우 적습니다. 1분만 기다렸다가 다시 시도해 주세요.`;
  }
  if (lowerError.includes("404")) return `[모델 미지원] 현재 위치나 API 키가 선택한 모델을 지원하지 않습니다.`;
  if (lowerError.includes("403") || lowerError.includes("invalid")) return `[인증 오류] API Key가 올바르지 않습니다. 설정을 확인하세요.`;
  
  return `[시스템 오류] ${errorStr.slice(0, 100)}`;
};

const getAI = (): GoogleGenAI => {
  const userKey = runtimeApiKey || localStorage.getItem('uni10_api_key');
  const systemKey = process.env.API_KEY;
  const finalKey = userKey || systemKey;
  if (!finalKey) throw new Error("API Key 미설정. 환경설정에서 API Key를 입력하세요.");
  return new GoogleGenAI({ apiKey: finalKey });
};

// --- Decoding/Encoding Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const pcmToWav = (pcmData: Uint8Array, sampleRate: number) => {
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (v: DataView, o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true);
  view.setUint16(32, (numChannels * bitsPerSample) / 8, true); view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data'); view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmData);
  return buffer;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};

// --- Speech Generation (Maximum Efficiency & Caching) ---
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const cacheKey = `${voiceName}:${text.trim()}`;
  if (speechCache.has(cacheKey)) {
    return speechCache.get(cacheKey)!;
  }

  try {
    const ai = getAI();
    const preferredModel = localStorage.getItem('uni10_pref_tts_model') || MODELS.G25_FLASH_TTS;
    
    // 텍스트 정제: 마크다운 기호 제거
    let cleanText = text
      .replace(/[#*`_~[\]()>]/g, '') 
      .trim();

    // 학습 모드 문장(repeat 3 times)이 포함되어 있는지 확인
    const isLearningMode = cleanText.includes('...') || cleanText.includes('▣ 주요 단어');
    // 보통 속도로 재생하며 '... ...' 구간에서 1.2초 휴지를 갖도록 지시
    const ttsInstruction = isLearningMode 
      ? `보통 속도로 명확하게 읽어주세요. 문장 사이의 '... ...' 에서는 1.2초간 충분히 쉬어가며 읽으세요: `
      : `자연스럽고 명확하게 읽어주세요: `;

    if (!cleanText) throw new Error("변환할 내용이 없습니다.");

    const response = await ai.models.generateContent({
      model: preferredModel,
      contents: [{ parts: [{ text: ttsInstruction + cleanText.slice(0, 1800) }] }], 
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!audioPart?.inlineData?.data) throw new Error("음성 생성 응답이 비어있습니다.");

    const wavBuffer = pcmToWav(decode(audioPart.inlineData.data), 24000);
    const audioUrl = URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
    
    // 결과 캐싱
    speechCache.set(cacheKey, audioUrl);
    return audioUrl;
  } catch (e: any) {
    const errorMessage = parseGeminiError(e);
    console.error("TTS Call Failed:", e);
    throw new Error(errorMessage);
  }
};

export const speakWithBrowser = (text: string, lang: string = 'ko-KR') => {
  if (!window.speechSynthesis) {
    console.warn("Browser does not support Speech Synthesis");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean text: remove markdown symbols
  const cleanText = text.replace(/[#*`_~[\]()>]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};

export const handleImageFeature = async (prompt: string, attachments: Attachment[]): Promise<string> => {
  try {
    const ai = getAI();
    const model = localStorage.getItem('uni10_pref_image_model') || MODELS.G25_FLASH_IMAGE;
    const parts: any[] = [{ text: prompt }];
    attachments.forEach(a => { parts.push({ inlineData: { mimeType: a.mimeType, data: a.base64Data } }); });
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (data) return `data:image/png;base64,${data}`;
    throw new Error("이미지 생성 실패");
  } catch (e: any) { throw new Error(parseGeminiError(e)); }
};

export const streamResponse = async (
  history: ChatMessage[],
  prompt: string,
  attachments: Attachment[],
  mode: AppMode,
  features: ChatFeatures,
  promptStyle: PromptStyle,
  autoTranslate: boolean,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const client = getAI();
    const selectedModel = localStorage.getItem('uni10_pref_text_model') || MODELS.G25_FLASH;
    const contents = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.text }, ...(msg.attachments?.map(a => ({ inlineData: { mimeType: a.mimeType, data: a.base64Data } })) || [])]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }, ...(attachments.map(a => ({ inlineData: { mimeType: a.mimeType, data: a.base64Data } })))] });
    
    let systemInstruction = PROMPTS.default + (FUNC_PROMPTS[mode]?.systemInstruction || "");
    if (autoTranslate) {
      systemInstruction = PROMPTS.translate;
    } else if (promptStyle === 'blog') {
      systemInstruction = PROMPTS.blog;
    } else if (promptStyle === 'enhance') {
      systemInstruction = PROMPTS.enhance;
    }

    const result = await client.models.generateContentStream({ 
      model: selectedModel, 
      contents, 
      config: { 
        systemInstruction: systemInstruction,
        tools: autoTranslate ? [] : [{ googleSearch: {} }]
      } 
    });
    
    let fullText = "";
    for await (const chunk of result) {
      if (signal?.aborted) break;
      const text = chunk.text;
      if (text) { fullText += text; onChunk(text); }
    }
    return fullText;
  } catch (e: any) { throw new Error(parseGeminiError(e)); }
};

export class LiveClient {
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private nextScheduleTime: number = 0;
  private stream: MediaStream | null = null;

  constructor(
    private onStatus: (status: string, error?: string) => void, 
    private onTranscription: (text: string, isUser: boolean, isFinal: boolean) => void,
    private onVolumeChange: (volume: number, isUser: boolean) => void
  ) {}

  async connect(systemInstruction: string) {
    const ai = getAI();
    this.onStatus("connecting");
    try {
      if (!ai.live) {
        throw new Error("현재 SDK 버전에서 Multimodal Live API(ai.live)를 지원하지 않거나 초기화되지 않았습니다.");
      }
      
      console.log("Initializing AudioContext at 16000Hz (Synced for Input/Output)...");
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.nextScheduleTime = 0;
      
      console.log("Requesting microphone access...");
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            sampleRate: 16000, 
            channelCount: 1, 
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (micError: any) {
        console.warn("Microphone access failed:", micError);
        if (micError.name === 'NotFoundError' || micError.name === 'DevicesNotFoundError') {
          throw new Error("연결된 마이크를 찾을 수 없습니다. 라이브 채팅을 위해서는 마이크가 필요합니다.");
        } else if (micError.name === 'NotAllowedError' || micError.name === 'PermissionDeniedError') {
          throw new Error("마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해 주세요.");
        }
        throw new Error(`마이크 연결 오류: ${micError.message || "마이크를 확인할 수 없습니다."}`);
      }
      
      const modelName = MODELS.LIVE;
      console.log("Connecting to Live API with model:", modelName);
      
      this.sessionPromise = ai.live.connect({
        model: modelName,
        callbacks: {
          onopen: () => {
            console.log("Live Socket Opened");
            this.onStatus("connected");
            if (this.audioContext && this.stream) {
              if (this.audioContext.state === 'suspended') this.audioContext.resume();
              const source = this.audioContext.createMediaStreamSource(this.stream);
              const scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Volume tracking (RMS)
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                this.onVolumeChange(rms, true);

                // Correct 16-bit PCM encoding for 16kHz input
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
                }
                const pcmBlob = { data: encode(new Uint8Array(pcmData.buffer)), mimeType: 'audio/pcm;rate=16000' };
                this.sessionPromise?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              // CRITICAL: Connect at least one node to prevent the clock from stopping, but NOT to destination to prevent feedback
              const silentGain = this.audioContext.createGain();
              silentGain.gain.value = 0;
              scriptProcessor.connect(silentGain);
              silentGain.connect(this.audioContext.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) this.onTranscription(message.serverContent.inputTranscription.text, true, !!message.serverContent.turnComplete);
            if (message.serverContent?.outputTranscription) this.onTranscription(message.serverContent.outputTranscription.text, false, !!message.serverContent.turnComplete);
            
            const audioData = this.findAudioData(message);

            if (audioData && this.audioContext) {
              if (this.audioContext.state === 'suspended') await this.audioContext.resume();
              try {
                const binary = decode(audioData as string);
                const dataView = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
                const float32 = new Float32Array(binary.byteLength / 2);
                let sumSq = 0;
                for (let i = 0; i < float32.length; i++) {
                  const val = dataView.getInt16(i * 2, true);
                  float32[i] = val / 32768.0;
                  sumSq += float32[i] * float32[i];
                }
                
                const rms = Math.sqrt(sumSq / float32.length);
                this.onVolumeChange(rms * 2.5, false);

                // Gemini 2.0 Live output is 24000Hz. AudioContext at 16000Hz will resample.
                const buffer = this.audioContext.createBuffer(1, float32.length, 24000); 
                buffer.getChannelData(0).set(float32);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                
                // SCHEDULED PLAYBACK: prevent noise/jitter by queuing chunks end-to-end
                const now = this.audioContext.currentTime;
                if (this.nextScheduleTime < now) {
                   this.nextScheduleTime = now + 0.05; // 50ms safety buffer
                }
                source.start(this.nextScheduleTime);
                this.nextScheduleTime += buffer.duration;
              } catch (playErr) {
                console.error("Audio playback error:", playErr);
              }
            }
          },
          onerror: (e: any) => {
            console.error("Live Socket Error Callback:", e);
            const errMsg = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
            this.onStatus("error", errMsg);
          },
          onclose: () => {
            console.log("Live Socket Closed");
            this.onStatus("disconnected");
          }
        },
        config: { 
          responseModalities: [Modality.AUDIO], 
          systemInstruction, 
          inputAudioTranscription: {}, 
          outputAudioTranscription: {} 
        }
      });
      
      await this.sessionPromise;
      console.log("Live Session Promise Resolved");
    } catch (e: any) { 
      console.error("LiveClient.connect internal error:", e);
      const errorMessage = e.message || String(e);
      this.onStatus("error", errorMessage); 
      throw e; 
    }
  }
  private findAudioData(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.inlineData?.data) return obj.inlineData.data;
    if (obj.audio) return typeof obj.audio === 'string' ? obj.audio : obj.audio.data;
    if (obj.data && typeof obj.data === 'string' && obj.data.length > 100) return obj.data;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = this.findAudioData(item);
        if (result) return result;
      }
    } else {
      for (const key in obj) {
        const result = this.findAudioData(obj[key]);
        if (result) return result;
      }
    }
    return null;
  }

  disconnect() {
    if (this.sessionPromise) this.sessionPromise.then(session => session.close());
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    if (this.audioContext) this.audioContext.close();
  }
}
