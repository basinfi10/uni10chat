
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export enum AppMode {
  // Main Chat
  CHAT = 'chat',
  // Dedicated Modes
  CODING_PARTNER = 'coding_partner',
  IMAGE_EDIT_MODE = 'image_edit_mode',
  COOKING = 'cooking',
  HEALTH = 'health',
  LIFE_TIPS = 'life_tips',
  ENGLISH_LEARNING = 'english_learning',
  JAPANESE_LEARNING = 'japanese_learning',
}

export type InterpretationMode = 'voice_text' | 'text_only' | 'subtitle_text' | 'voice_only';

export type TTSMode = 'api' | 'browser';

export type PromptStyle = 'default' | 'blog' | 'enhance';

export interface ChatFeatures {
  deepResearch: boolean;
  imageGenEdit: boolean;
  canvas: boolean;
  dynamicView: boolean;
  guideLearning: boolean;
}

export interface Attachment {
  id: string;
  file?: File; 
  fileName: string; 
  previewUrl?: string;
  mimeType: string;
  base64Data: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  generatedImage?: string; 
  generatedVideo?: string; 
  audioUrl?: string; 
  isAudioGenerating?: boolean; 
  isInterpretation?: boolean; 
  interpretationMode?: InterpretationMode;
  metadata?: {
    model?: string;
    mode?: AppMode | string;
    features?: string[]; 
    toolUsed?: string;
    groundingMetadata?: any;
    promptStyle?: PromptStyle;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export const MODELS = {
  // Text Models
  G3_PRO: 'gemini-3-pro-preview',
  G3_FLASH: 'gemini-3-flash-preview',
  G25_PRO: 'gemini-2.5-pro',
  G25_FLASH: 'gemini-2.5-flash',
  
  // Image Models
  G3_PRO_IMAGE: 'gemini-3-pro-image-preview',
  G25_FLASH_IMAGE: 'gemini-2.5-flash-image',
  
  // TTS Models
  G25_PRO_TTS: 'gemini-2.5-pro-preview-tts',
  G25_FLASH_TTS: 'gemini-2.5-flash-preview-tts',
  
  // Specialized
  VIDEO: 'veo-3.1-fast-generate-preview',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
};
