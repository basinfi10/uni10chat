
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
  private stream: MediaStream | null = null;
  constructor(private onStatus: (status: string, error?: string) => void, private onTranscription: (text: string, isUser: boolean, isFinal: boolean) => void) {}
  async connect(systemInstruction: string) {
    const ai = getAI();
    this.onStatus("connecting");
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            this.onStatus("connected");
            const source = this.audioContext!.createMediaStreamSource(this.stream!);
            const scriptProcessor = this.audioContext!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = { data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)), mimeType: 'audio/pcm;rate=16000' };
              this.sessionPromise?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(this.audioContext!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) this.onTranscription(message.serverContent.inputTranscription.text, true, !!message.serverContent.turnComplete);
            if (message.serverContent?.outputTranscription) this.onTranscription(message.serverContent.outputTranscription.text, false, !!message.serverContent.turnComplete);
          },
          onerror: (e: any) => this.onStatus("error", e.message || String(e)),
          onclose: () => this.onStatus("disconnected")
        },
        config: { responseModalities: [Modality.AUDIO], systemInstruction, inputAudioTranscription: {}, outputAudioTranscription: {} }
      });
      await this.sessionPromise;
    } catch (e: any) { this.onStatus("error", e.message || String(e)); throw e; }
  }
  disconnect() {
    if (this.sessionPromise) this.sessionPromise.then(session => session.close());
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    if (this.audioContext) this.audioContext.close();
  }
}
