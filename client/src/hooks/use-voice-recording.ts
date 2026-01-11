/**
 * Unified Voice Recording Hook
 * 
 * Provides consistent voice recording functionality across:
 * - Training Mode
 * - Voice Interview
 * - Voice Session
 * - Any future voice features
 * 
 * Features:
 * - Audio recording with MediaRecorder
 * - Live transcription with Speech Recognition
 * - Word count tracking
 * - Duration timer
 * - Playback support
 * - Auto-save transcripts
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  wordCount: number;
  audioBlob: Blob | null;
  transcript: string;
  finalTranscript: string;
}

export interface VoiceRecordingOptions {
  autoStart?: boolean;
  maxDuration?: number; // seconds
  onRecordingStart?: () => void;
  onTranscriptUpdate?: (transcript: string, wordCount: number) => void;
  onRecordingComplete?: (audioBlob: Blob, transcript: string) => void;
  onError?: (error: Error) => void;
}

export interface VoiceRecordingControls {
  state: VoiceRecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  playRecording: () => void;
  stopPlayback: () => void;
  isPlaying: boolean;
  currentWordIndex: number;
  playbackWords: string[];
}

const isSpeechSupported = typeof window !== 'undefined' && 
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export function useVoiceRecording(options: VoiceRecordingOptions = {}): VoiceRecordingControls {
  const {
    autoStart = false,
    maxDuration,
    onRecordingStart,
    onTranscriptUpdate,
    onRecordingComplete,
    onError
  } = options;

  // Store callbacks in refs to avoid stale closures
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onRecordingStartRef = useRef(onRecordingStart);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
    onRecordingStartRef.current = onRecordingStart;
    onErrorRef.current = onError;
  }, [onRecordingComplete, onRecordingStart, onError]);

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    wordCount: 0,
    audioBlob: null,
    transcript: '',
    finalTranscript: ''
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playbackWords, setPlaybackWords] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSpeechSupported) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      const fullTranscript = finalTranscript + interimTranscript;
      const wordCount = countWords(fullTranscript);
      
      // Update ref for use in callbacks
      if (finalTranscript) {
        finalTranscriptRef.current = (finalTranscriptRef.current + finalTranscript).trim();
      }
      
      setState(prev => ({ 
        ...prev, 
        wordCount,
        transcript: fullTranscript,
        finalTranscript: finalTranscriptRef.current
      }));

      if (onTranscriptUpdate) {
        onTranscriptUpdate(fullTranscript, wordCount);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (onError) {
        onError(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, [onTranscriptUpdate, onError]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
  }, [autoStart]);

  // Max duration check
  useEffect(() => {
    if (maxDuration && state.duration >= maxDuration && state.isRecording) {
      stopRecording();
    }
  }, [state.duration, maxDuration, state.isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const transcript = finalTranscriptRef.current;
        setState(prev => ({ ...prev, audioBlob, finalTranscript: transcript }));
        stream.getTracks().forEach(track => track.stop());

        if (onRecordingCompleteRef.current) {
          onRecordingCompleteRef.current(audioBlob, transcript);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Speech recognition already started');
        }
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      setState(prev => ({ ...prev, isRecording: true, isPaused: false }));
      
      // Call onRecordingStart callback
      if (onRecordingStartRef.current) {
        onRecordingStartRef.current();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (onErrorRef.current) {
        onErrorRef.current(error as Error);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition already started');
      }
    }

    timerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);

    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const resetRecording = useCallback(() => {
    stopRecording();
    finalTranscriptRef.current = '';
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      wordCount: 0,
      audioBlob: null,
      transcript: '',
      finalTranscript: ''
    });
    setIsPlaying(false);
    setCurrentWordIndex(-1);
    setPlaybackWords([]);
  }, [stopRecording]);

  const playRecording = useCallback(() => {
    if (!state.audioBlob) return;

    const url = URL.createObjectURL(state.audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;

    // Split transcript into words for highlighting
    const words = state.finalTranscript.trim().split(/\s+/);
    setPlaybackWords(words);
    setIsPlaying(true);
    setCurrentWordIndex(0);

    // Estimate word timing
    const totalDuration = state.duration * 1000;
    const msPerWord = words.length > 0 ? totalDuration / words.length : 0;

    let currentIndex = 0;
    playbackIntervalRef.current = setInterval(() => {
      currentIndex++;
      if (currentIndex >= words.length) {
        stopPlayback();
      } else {
        setCurrentWordIndex(currentIndex);
      }
    }, msPerWord);

    audio.onended = () => {
      stopPlayback();
    };

    audio.play();
  }, [state.audioBlob, state.finalTranscript, state.duration]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    playRecording,
    stopPlayback,
    isPlaying,
    currentWordIndex,
    playbackWords
  };
}

// Helper function
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export { isSpeechSupported };
