/**
 * Voice Integration Service
 * Handles Text-to-Speech (TTS) using Web Speech API and Speech Recognition
 * Future: Integration with Kokoro TTS for higher quality voice
 */

import type {
  VoiceConfig,
  SpeechRecognitionResult as AppSpeechRecognitionResult,
  VoiceSession,
  TTSOptions,
} from "@/types";

// Default voice configuration
const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceId: "default",
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  lang: "en-US",
};

/**
 * Text-to-Speech Service
 */
export class TTSService {
  private synth: SpeechSynthesis | null = null;
  private config: VoiceConfig;
  private isSpeaking = false;
  private onEndCallback?: () => void;

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };

    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Check if TTS is available
   */
  isAvailable(): boolean {
    return this.synth !== null && "speechSynthesis" in window;
  }

  /**
   * Speak text
   */
  speak(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("Speech synthesis not available"));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? this.config.rate;
      utterance.pitch = options?.pitch ?? this.config.pitch;
      utterance.volume = options?.volume ?? this.config.volume;
      utterance.lang = this.config.lang;

      if (options?.voice) {
        utterance.voice = options.voice;
      } else {
        // Try to find a good English voice
        const voices = this.synth.getVoices();
        const preferredVoice =
          voices.find(
            (v) => v.lang.startsWith("en") && v.name.includes("Google"),
          ) || voices.find((v) => v.lang.startsWith("en"));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.onEndCallback?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Check if currently speaking
   */
  getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  /**
   * Set on end callback
   */
  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Speech Recognition Service
 */
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResultCallback?: (result: AppSpeechRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;

  constructor(lang: string = "en-US") {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        this.recognition = new SpeechRecognitionAPI();
        this.recognition.lang = lang;
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.setupEventHandlers();
      }
    }
  }

  /**
   * Check if speech recognition is available
   */
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const transcript = finalTranscript || interimTranscript;
      const confidence = event.results[event.resultIndex]?.[0]?.confidence || 0;

      this.onResultCallback?.({
        transcript,
        confidence,
        isFinal: event.results[event.resultIndex]?.isFinal || false,
      });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      this.onErrorCallback?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEndCallback?.();
    };
  }

  /**
   * Start listening
   */
  start(): void {
    if (!this.recognition) {
      this.onErrorCallback?.("Speech recognition not available");
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (_error) {
      this.onErrorCallback?.("Failed to start speech recognition");
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (_error) {
      // Ignore errors on stop
    }
  }

  /**
   * Abort listening (force stop)
   */
  abort(): void {
    if (!this.recognition) return;

    try {
      this.recognition.abort();
      this.isListening = false;
    } catch (_error) {
      // Ignore errors on abort
    }
  }

  /**
   * Check if currently listening
   */
  getListeningState(): boolean {
    return this.isListening;
  }

  /**
   * Set result callback
   */
  onResult(callback: (result: AppSpeechRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Set end callback
   */
  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * Update language
   */
  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}

/**
 * Voice Session Manager
 * Manages the complete voice session including TTS and speech recognition
 */
export class VoiceSessionManager {
  private tts: TTSService;
  private recognition: SpeechRecognitionService;
  private session: VoiceSession = {
    isListening: false,
    isSpeaking: false,
    transcript: "",
    interimTranscript: "",
  };
  private onStateChangeCallback?: (session: VoiceSession) => void;

  constructor(config?: { voiceConfig?: Partial<VoiceConfig>; lang?: string }) {
    this.tts = new TTSService(config?.voiceConfig);
    this.recognition = new SpeechRecognitionService(config?.lang);
    this.setupCallbacks();
  }

  private setupCallbacks(): void {
    // TTS callbacks
    this.tts.onEnd(() => {
      this.session.isSpeaking = false;
      this.notifyStateChange();
    });

    // Recognition callbacks
    this.recognition.onResult((result: AppSpeechRecognitionResult) => {
      if (result.isFinal) {
        this.session.transcript += result.transcript;
        this.session.interimTranscript = "";
      } else {
        this.session.interimTranscript = result.transcript;
      }
      this.notifyStateChange();
    });

    this.recognition.onError((error) => {
      this.session.error = error;
      this.session.isListening = false;
      this.notifyStateChange();
    });

    this.recognition.onEnd(() => {
      this.session.isListening = false;
      this.notifyStateChange();
    });
  }

  private notifyStateChange(): void {
    this.onStateChangeCallback?.({ ...this.session });
  }

  /**
   * Start voice session
   */
  startListening(): void {
    this.session.isListening = true;
    this.session.error = undefined;
    this.recognition.start();
    this.notifyStateChange();
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.recognition.stop();
    this.session.isListening = false;
    this.notifyStateChange();
  }

  /**
   * Speak text
   */
  async speak(text: string, options?: TTSOptions): Promise<void> {
    this.session.isSpeaking = true;
    this.notifyStateChange();

    try {
      await this.tts.speak(text, options);
    } catch (error) {
      this.session.error = error instanceof Error ? error.message : "TTS error";
      this.session.isSpeaking = false;
      this.notifyStateChange();
      throw error;
    }
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    this.tts.stop();
    this.session.isSpeaking = false;
    this.notifyStateChange();
  }

  /**
   * Get current transcript (final + interim)
   */
  getFullTranscript(): string {
    return this.session.transcript + this.session.interimTranscript;
  }

  /**
   * Get only final transcript
   */
  getFinalTranscript(): string {
    return this.session.transcript;
  }

  /**
   * Clear transcript
   */
  clearTranscript(): void {
    this.session.transcript = "";
    this.session.interimTranscript = "";
    this.notifyStateChange();
  }

  /**
   * Get session state
   */
  getSession(): VoiceSession {
    return { ...this.session };
  }

  /**
   * Set state change callback
   */
  onStateChange(callback: (session: VoiceSession) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Check if voice is available
   */
  isVoiceAvailable(): { tts: boolean; recognition: boolean } {
    return {
      tts: this.tts.isAvailable(),
      recognition: this.recognition.isAvailable(),
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.recognition.abort();
    this.tts.stop();
    this.onStateChangeCallback = undefined;
  }
}

// Export singleton instances
let ttsService: TTSService | null = null;
let recognitionService: SpeechRecognitionService | null = null;

export function getTTSService(config?: Partial<VoiceConfig>): TTSService {
  if (!ttsService) {
    ttsService = new TTSService(config);
  }
  return ttsService;
}

export function getSpeechRecognitionService(
  lang?: string,
): SpeechRecognitionService {
  if (!recognitionService) {
    recognitionService = new SpeechRecognitionService(lang);
  }
  return recognitionService;
}

export function createVoiceSession(config?: {
  voiceConfig?: Partial<VoiceConfig>;
  lang?: string;
}): VoiceSessionManager {
  return new VoiceSessionManager(config);
}

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
