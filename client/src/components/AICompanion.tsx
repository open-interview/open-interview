/**
 * AI Companion - Persistent conversational AI assistant
 * Stays with user across all pages, can chat, debate, and explain content
 * Uses selected AI provider with conversation history
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Settings, Loader2, Minimize2, Maximize2,
  VolumeX, RotateCcw, MessageSquare, Mic, MicOff
} from 'lucide-react';
// Disabled: AI Companion not in use
// import * as webllm from '@mlc-ai/web-llm';

// Type stub for webllm (component disabled, avoiding build error)
const webllm = {
  MLCEngine: class {
    chat = { completions: { create: async (_params: any) => null as any } };
  },
  CreateMLCEngine: async (_model: string, _opts?: { initProgressCallback?: (p: { text: string }) => void }) => null as any,
  ChatCompletionMessageParam: {} as any,
};
type WebLLMEngine = InstanceType<(typeof webllm)['MLCEngine']>;
type WebLLMMessage = { role: string; content: string };

import { useUnifiedToast } from '../hooks/use-unified-toast';
import { SITEMAP_RAG, searchRoutes, findRoutesByKeywords, getRouteByPath } from '../data/sitemap-rag';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { AICompanionMessages } from './AICompanionMessages';
import { AICompanionInput } from './AICompanionInput';
import { GoogleDialog } from './google/GoogleDialog';

interface AICompanionProps {
  pageContent?: {
    type?: string; // 'question' | 'blog' | 'certification' | 'learning-path' | 'home'
    title?: string;
    content?: string;
    question?: string;
    answer?: string;
    explanation?: string;
    code?: string;
    tags?: string[];
    difficulty?: string;
  };
  // Agent capabilities - allow AI to interact with the page
  onNavigate?: (path: string) => void;
  onAction?: (action: string, data?: any) => void;
  availableActions?: string[]; // List of actions AI can perform
}

type AIProvider = 'gemini' | 'openai' | 'groq' | 'cohere' | 'huggingface' | 'browser';
type TTSProvider = 'elevenlabs' | 'openai' | 'webspeech';
type Language = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'zh' | 'ja' | 'pt' | 'ar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  confidence?: number;
  isAIGenerated?: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function AICompanion({ pageContent, onNavigate, onAction, availableActions = [] }: AICompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState(true); // Enable agent capabilities
  const [currentModel, setCurrentModel] = useState<string>(''); // Track which model is being used
  const [currentTTSModel, setCurrentTTSModel] = useState<string>('Browser TTS'); // Track TTS model
  const [webLLMEngine, setWebLLMEngine] = useState<WebLLMEngine | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState<string>('');
  
  // Graceful degradation states (Section 9.5)
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [aiEnabled, setAiEnabled] = useState(() => {
    const saved = localStorage.getItem('ai-companion-ai-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [retryCount, setRetryCount] = useState(0);
  const [retryAfter, setRetryAfter] = useState<number | null>(null); // Rate limit wait time
  const [lastError, setLastError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false); // Server error fallback
  const [lastResponseConfidence, setLastResponseConfidence] = useState<number | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
   // Settings
  const [provider, setProvider] = useState<AIProvider>('groq'); // Default to Groq (more reliable)
  const [ttsProvider, setTTSProvider] = useState<TTSProvider>('webspeech'); // Default to Web Speech (no API key needed)
  const [language, setLanguage] = useState<Language>('en');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speechRate, setSpeechRate] = useState(0.95);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [cohereKey, setCohereKey] = useState('');
  const [huggingfaceKey, setHuggingfaceKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  
  // Settings validation errors
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // Push-to-talk voice mode
  const [isPushingToTalk, setIsPushingToTalk] = useState(false); // Spacebar pressed
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useUnifiedToast();
  const { preferences } = useUserPreferences();
  const { role, subscribedChannels, onboardingComplete } = preferences;

  // Initialize WebLLM engine
  useEffect(() => {
    if (provider === 'browser' && !webLLMEngine) {
      initializeWebLLM();
    }
  }, [provider]);

  // Network status detection (offline/online)
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastError(null);
      setRetryAfter(null);
      // Reset retry count on reconnection
      setRetryCount(0);
      toast({
        title: "🌐 Back Online",
        description: "AI features are now available",
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setFallbackMode(true);
      toast({
        title: "📴 Offline Mode",
        description: "AI features unavailable offline. Using static content.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    setIsOffline(!navigator.onLine);
    if (!navigator.onLine) {
      setFallbackMode(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeWebLLM = async () => {
    try {
      setIsLoadingModel(true);
      setModelLoadProgress('Initializing WebLLM...');
      
      const engine = await webllm.CreateMLCEngine(
        'Phi-3-mini-4k-instruct-q4f16_1-MLC', // 3.8B parameter model, ~2GB
        {
          initProgressCallback: (progress) => {
            setModelLoadProgress(progress.text);
            console.log('WebLLM loading:', progress);
          },
        }
      );
      
      setWebLLMEngine(engine);
      setCurrentModel('Phi-3-mini-4k (3.8B)');
      setModelLoadProgress('');
      setIsLoadingModel(false);
      
      toast({
        title: "🤖 Browser AI Ready",
        description: "Phi-3 model loaded! Running locally in your browser.",
      });
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      setIsLoadingModel(false);
      setModelLoadProgress('');
      toast({
        title: "⚠️ WebLLM Failed",
        description: "Falling back to rule-based responses. Check console for details.",
      });
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false; // Single utterance mode for PTT
      recognition.interimResults = true;
      recognition.lang = getVoiceLanguage(language);
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInputMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsListening(false);
          setIsPushingToTalk(false);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        
        // Auto-send when user releases spacebar (PTT mode)
        if (voiceMode && inputMessage.trim().length > 0) {
          console.log('PTT released, auto-sending:', inputMessage);
          setTimeout(() => {
            sendMessage();
          }, 300); // Brief delay to ensure transcript is complete
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, [language, voiceMode, inputMessage]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Load settings and conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-companion-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setProvider(settings.provider || 'groq');
        setTTSProvider(settings.ttsProvider || 'elevenlabs');
        setLanguage(settings.language || 'en');
        setAutoSpeak(settings.autoSpeak || false);
        setSelectedVoice(settings.selectedVoice || '');
        setSpeechRate(settings.speechRate || 0.95);
        setGeminiKey('');  // API keys removed - use backend proxy
        setOpenaiKey('');  // API keys removed - use backend proxy
        setGroqKey('');  // API keys removed - use backend proxy
        setCohereKey(settings.cohereKey || '');
        setHuggingfaceKey(settings.huggingfaceKey || '');
        setElevenlabsKey(settings.elevenlabsKey || '');
      } catch {}
    }

    // Load conversation history
    const savedMessages = localStorage.getItem('ai-companion-messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {}
    }
  }, []);

  // Save conversation history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-companion-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Helper functions for settings validation
  const getProviderKeyError = () => {
    const key = `${provider}Key`;
    return settingsErrors[key];
  };

  const getProviderKeyValue = () => {
    switch (provider) {
      case 'gemini': return geminiKey;
      case 'openai': return openaiKey;
      case 'groq': return groqKey;
      case 'cohere': return cohereKey;
      case 'huggingface': return huggingfaceKey;
      default: return '';
    }
  };

  const handleProviderKeyChange = (value: string) => {
    switch (provider) {
      case 'gemini': setGeminiKey(value); break;
      case 'openai': setOpenaiKey(value); break;
      case 'groq': setGroqKey(value); break;
      case 'cohere': setCohereKey(value); break;
      case 'huggingface': setHuggingfaceKey(value); break;
    }
    setSettingsErrors(prev => ({ ...prev, [`${provider}Key`]: '' }));
  };

  const getTTSError = () => {
    if (ttsProvider === 'elevenlabs') return settingsErrors['elevenlabsKey'];
    return settingsErrors['openaiTTSKey'];
  };

  const getTTSValue = () => {
    if (ttsProvider === 'elevenlabs') return elevenlabsKey;
    return openaiKey;
  };

  const handleTTSKeyChange = (value: string) => {
    if (ttsProvider === 'elevenlabs') {
      setElevenlabsKey(value);
      setSettingsErrors(prev => ({ ...prev, elevenlabsKey: '' }));
    } else {
      setOpenaiKey(value);
      setSettingsErrors(prev => ({ ...prev, openaiTTSKey: '' }));
    }
  };

  // Validate settings
  const validateSettings = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate API keys if provider requires them
    if (provider === 'gemini' && !geminiKey.trim()) {
      errors.geminiKey = 'Gemini API key is required for this provider';
    }
    if (provider === 'openai' && !openaiKey.trim()) {
      errors.openaiKey = 'OpenAI API key is required for this provider';
    }
    if (provider === 'groq' && !groqKey.trim()) {
      errors.groqKey = 'Groq API key is required for this provider';
    }
    if (provider === 'cohere' && !cohereKey.trim()) {
      errors.cohereKey = 'Cohere API key is required for this provider';
    }
    if (provider === 'huggingface' && !huggingfaceKey.trim()) {
      errors.huggingfaceKey = 'HuggingFace API key is required for this provider';
    }
    
    // Validate TTS API keys if provider requires them
    if (ttsProvider === 'elevenlabs' && !elevenlabsKey.trim()) {
      errors.elevenlabsKey = 'ElevenLabs API key is required for TTS';
    }
    if (ttsProvider === 'openai' && !openaiKey.trim()) {
      errors.openaiTTSKey = 'OpenAI API key is required for TTS';
    }
    
    setSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle settings field blur
  const handleSettingsBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateSettings();
  };

  // Save settings
  const saveSettings = () => {
    if (!validateSettings()) {
      return; // Don't save if validation fails
    }
    
    localStorage.setItem('ai-companion-settings', JSON.stringify({
      provider,
      ttsProvider,
      language,
      autoSpeak,
      selectedVoice,
      speechRate,
      geminiKey,
      openaiKey,
      groqKey,
      cohereKey,
      huggingfaceKey,
      elevenlabsKey,
    }));
    localStorage.setItem('ai-companion-ai-enabled', JSON.stringify(aiEnabled));
    setShowSettings(false);
  };

  // Toggle AI features
  const toggleAI = () => {
    const newState = !aiEnabled;
    setAiEnabled(newState);
    localStorage.setItem('ai-companion-ai-enabled', JSON.stringify(newState));
    
    if (!newState) {
      setFallbackMode(true);
      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      toast({
        title: "🤖 AI Disabled",
        description: "AI features turned off. App will use static content.",
      });
    } else {
      setFallbackMode(false);
      setLastError(null);
      setRetryCount(0);
      toast({
        title: "🤖 AI Enabled",
        description: "AI features are now active.",
      });
    }
  };

  // Start listening
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = getVoiceLanguage(language);
        recognitionRef.current.start();
        console.log('Started listening...');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('Stopped listening');
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  };

  // Toggle voice mode (Push-to-Talk)
  const toggleVoiceMode = () => {
    const newVoiceMode = !voiceMode;
    setVoiceMode(newVoiceMode);
    
    if (newVoiceMode) {
      // Enable auto-speak when entering voice mode
      setAutoSpeak(true);
      
      toast({
        title: "Push-to-Talk Mode Active 🎙️",
        description: "Hold SPACEBAR to speak, release to send. I'll respond with voice automatically!",
      });
    } else {
      // Stop listening when exiting voice mode
      stopListening();
      setIsPushingToTalk(false);
      
      toast({
        title: "Voice Mode Off",
        description: "Switched back to text mode",
      });
    }
  };

  // Handle spacebar push-to-talk
  useEffect(() => {
    if (!voiceMode || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar in voice mode, not when typing in input
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        
        // If AI is speaking or generating, interrupt it first
        if (isGenerating || isSpeaking) {
          console.log('User pressed spacebar - interrupting AI');
          interruptGeneration();
          // Set flag so we know user is holding spacebar
          setIsPushingToTalk(true);
          // Start listening after brief delay to let interrupt complete
          setTimeout(() => {
            if (!isGenerating && !isSpeaking) {
              setInputMessage('');
              startListening();
            }
          }, 100);
          return;
        }
        
        if (!isPushingToTalk) {
          setIsPushingToTalk(true);
          setInputMessage(''); // Clear previous message
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPushingToTalk) {
        e.preventDefault();
        setIsPushingToTalk(false);
        stopListening(); // This will trigger auto-send in recognition.onend
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [voiceMode, isPushingToTalk, isGenerating, isSpeaking, isOpen]);

  // Interrupt generation
  const interruptGeneration = () => {
    console.log('Interrupting AI...');
    setIsInterrupting(true);
    
    // Abort API call
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop speech immediately
    stopSpeaking();
    
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsGenerating(false);
    setIsSpeaking(false);
    
    // Reset interrupting flag after a brief delay
    setTimeout(() => {
      setIsInterrupting(false);
    }, 500);
  };

  // Extract page content from DOM
  const extractPageContent = (): string => {
    try {
      let content = '';
      
      // Get page title
      const pageTitle = document.title;
      content += `Page Title: ${pageTitle}\n`;
      
      // Get current URL
      const currentUrl = window.location.pathname;
      content += `Current URL: ${currentUrl}\n`;
      
      // Extract all headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent?.trim())
        .filter(Boolean)
        .slice(0, 10); // Limit to first 10 headings
      
      if (headings.length > 0) {
        content += `\nPage Headings:\n${headings.map(h => `- ${h}`).join('\n')}\n`;
      }
      
      // Extract all clickable links (navigation)
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => {
          const href = a.getAttribute('href');
          const text = a.textContent?.trim();
          return { href, text };
        })
        .filter(link => link.href && link.text && link.href.startsWith('/'))
        .slice(0, 30); // Limit to first 30 links
      
      if (links.length > 0) {
        content += `\nAvailable Links on Page:\n${links.map(l => `- ${l.text} → ${l.href}`).join('\n')}\n`;
      }
      
      // Extract all buttons
      const buttons = Array.from(document.querySelectorAll('button'))
        .map(b => b.textContent?.trim())
        .filter(Boolean)
        .slice(0, 20); // Limit to first 20 buttons
      
      if (buttons.length > 0) {
        content += `\nAvailable Buttons:\n${buttons.map(b => `- ${b}`).join('\n')}\n`;
      }
      
      // Extract main content text (first few paragraphs)
      const paragraphs = Array.from(document.querySelectorAll('p, li'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 20 && text.length < 200)
        .slice(0, 5); // First 5 relevant paragraphs
      
      if (paragraphs.length > 0) {
        content += `\nPage Content Preview:\n${paragraphs.join('\n')}\n`;
      }
      
      return content;
    } catch (error) {
      console.error('Error extracting page content:', error);
      return '';
    }
  };

  // Build context from page content
  const buildPageContext = (): string => {
    let context = '';
    
    // First, extract actual DOM content
    const domContent = extractPageContent();
    if (domContent) {
      context += `\n=== ACTUAL PAGE CONTENT (READ FROM DOM) ===\n${domContent}\n`;
    }
    
    // Then add provided page content if available
    if (pageContent) {
      context += `\n=== PROVIDED PAGE DATA ===\n`;
      
      if (pageContent.type) {
        context += `Current page: ${pageContent.type}\n`;
      }
      
      if (pageContent.title) {
        context += `Title: ${pageContent.title}\n`;
      }
      
      if (pageContent.question) {
        context += `Question: ${pageContent.question}\n`;
      }
      
      if (pageContent.answer) {
        context += `Answer: ${pageContent.answer}\n`;
      }
      
      if (pageContent.explanation) {
        context += `Explanation: ${pageContent.explanation}\n`;
      }
      
      if (pageContent.code) {
        context += `Code:\n${pageContent.code}\n`;
      }
      
      if (pageContent.difficulty) {
        context += `Difficulty: ${pageContent.difficulty}\n`;
      }
      
      if (pageContent.tags && pageContent.tags.length > 0) {
        context += `Topics: ${pageContent.tags.join(', ')}\n`;
      }
      
      if (pageContent.content) {
        context += `Content: ${pageContent.content}\n`;
      }
    }
    
    return context;
  };

  // Auto-scroll and highlight when explaining
  const autoHighlightContent = (response: string) => {
    // Detect if AI is explaining something
    const isExplaining = /explain|this is|let me|here|see|look at|notice|important/i.test(response);
    
    if (!isExplaining) return;
    
    // Auto-highlight key elements on the page when explaining
    setTimeout(() => {
      // Highlight the main question/title
      const mainHeading = document.querySelector('h1, h2.text-2xl, .question-text');
      if (mainHeading) {
        mainHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
        mainHeading.classList.add('ai-agent-highlight');
        setTimeout(() => mainHeading.classList.remove('ai-agent-highlight'), 3000);
      }
      
      // Highlight code blocks if mentioned
      if (/code|function|class|const|let|var/i.test(response)) {
        const codeBlocks = document.querySelectorAll('pre, code, .code-block');
        codeBlocks.forEach((block, index) => {
          setTimeout(() => {
            block.classList.add('ai-agent-highlight');
            if (index === 0) {
              block.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setTimeout(() => block.classList.remove('ai-agent-highlight'), 3000);
          }, index * 500);
        });
      }
      
      // Highlight answer section if mentioned
      if (/answer|solution|explanation/i.test(response)) {
        const answerSection = document.querySelector('.answer-section, .explanation, [class*="answer"]');
        if (answerSection) {
          setTimeout(() => {
            answerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            answerSection.classList.add('ai-agent-highlight');
            setTimeout(() => answerSection.classList.remove('ai-agent-highlight'), 3000);
          }, 1000);
        }
      }
    }, 500);
  };

  // Parse and execute agent actions from AI response
  const executeAgentActions = (response: string) => {
    // Auto-highlight content when explaining
    autoHighlightContent(response);
    
    // Look for action commands in AI response
    const actionPattern = /\[ACTION:(.*?)\]/g;
    const matches: RegExpExecArray[] = [];
    let match;
    while ((match = actionPattern.exec(response)) !== null) {
      matches.push(match);
    }
    
    matches.forEach(match => {
      const actionStr = match[1].trim();
      try {
        const action = JSON.parse(actionStr);
        
        if (action.type === 'navigate' && onNavigate) {
          // Validate channel navigation against subscribed channels when onboarding is complete
          if (onboardingComplete && subscribedChannels.length > 0 && action.path?.startsWith('/channel/')) {
            const channelId = action.path.replace('/channel/', '');
            if (!subscribedChannels.includes(channelId)) {
              toast({
                title: "💡 Explore More",
                description: "Discover more topics in your learning path!",
              });
              if (onNavigate) onNavigate('/channels');
              return response.replace(actionPattern, '').trim();
            }
          }
          console.log('AI navigating to:', action.path);
          onNavigate(action.path);
          toast({
            title: "🧭 Navigating",
            description: `Taking you to ${action.label || action.path}`,
          });
        } else if (action.type === 'action' && onAction) {
          console.log('AI performing action:', action.name);
          onAction(action.name, action.data);
          toast({
            title: "✨ Action Performed",
            description: action.description || `Executed ${action.name}`,
          });
        } else if (action.type === 'scroll') {
          console.log('AI scrolling to:', action.selector);
          executeScrollAction(action.selector, action.description);
        } else if (action.type === 'highlight') {
          console.log('AI highlighting:', action.selector);
          executeHighlightAction(action.selector, action.description);
        } else if (action.type === 'click') {
          console.log('AI clicking button:', action.text);
          executeClickAction(action.text, action.description);
        } else if (action.type === 'suggest') {
          toast({
            title: "💡 Suggestion",
            description: action.message,
          });
        }
      } catch (e) {
        console.warn('Failed to parse action:', actionStr);
      }
    });
    
    // Remove action commands from displayed response
    return response.replace(actionPattern, '').trim();
  };

  // Execute scroll action
  const executeScrollAction = (selector: string, description?: string) => {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add temporary highlight effect
        element.classList.add('ai-agent-focus');
        setTimeout(() => {
          element.classList.remove('ai-agent-focus');
        }, 2000);
        
        if (description) {
          toast({
            title: "👁️ Looking at",
            description: description,
          });
        }
      } else {
        console.warn('Element not found:', selector);
      }
    } catch (error) {
      console.error('Scroll action failed:', error);
    }
  };

  // Execute highlight action
  const executeHighlightAction = (selector: string, description?: string) => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(element => {
          // Add highlight effect
          element.classList.add('ai-agent-highlight');
          
          // Scroll first element into view
          if (element === elements[0]) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          elements.forEach(element => {
            element.classList.remove('ai-agent-highlight');
          });
        }, 3000);
        
        if (description) {
          toast({
            title: "✨ Highlighting",
            description: description,
          });
        }
      } else {
        console.warn('Elements not found:', selector);
      }
    } catch (error) {
      console.error('Highlight action failed:', error);
    }
  };

  // Execute click action
  const executeClickAction = (buttonText: string, description?: string) => {
    try {
      // Find button by text content (case-insensitive, partial match)
      const buttons = Array.from(document.querySelectorAll('button, a[role="button"], [role="button"]'));
      const targetButton = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase().trim() || '';
        const searchText = buttonText.toLowerCase().trim();
        return text.includes(searchText) || searchText.includes(text);
      });
      
      if (targetButton) {
        // Scroll to button first
        targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the button briefly
        targetButton.classList.add('ai-agent-highlight');
        
        // Click after a brief delay to show highlight
        setTimeout(() => {
          (targetButton as HTMLElement).click();
          targetButton.classList.remove('ai-agent-highlight');
          
          toast({
            title: "✅ Clicked!",
            description: description || `Clicked "${buttonText}"`,
          });
        }, 500);
      } else {
        console.warn('Button not found:', buttonText);
        toast({
          title: "⚠️ Button Not Found",
          description: `Couldn't find button: "${buttonText}"`,
        });
      }
    } catch (error) {
      console.error('Click action failed:', error);
      toast({
        title: "❌ Click Failed",
        description: "Failed to click button",
      });
    }
  };

  // Build conversation prompt
  const buildPrompt = (userMessage: string): string => {
    const languageName = LANGUAGES.find(l => l.code === language)?.name || 'English';
    const pageContext = buildPageContext();
    
    // Get current route info
    const currentPath = window.location.pathname;
    const currentRoute = getRouteByPath(currentPath);
    
    // Build sitemap context for navigation
    const sitemapContext = `

AVAILABLE ROUTES (Complete Site Map):
You have access to the entire site structure. Here are the main sections:

📍 MAIN PAGES:
- / (Home) - Main dashboard with daily questions and learning paths
- /learning-paths - Browse and activate curated learning paths (Frontend, Backend, DevOps, etc.)
- /my-path - View your active learning paths and progress
- /channels - Browse all technical topics
- /certifications - Certification exam prep (AWS, K8s, Terraform, GCP, Azure)
- /coding - Coding challenges and practice
- /tests - Timed practice tests
- /voice-interview - Voice interview practice
- /review - Spaced repetition review (SRS)
- /training - Focused training sessions
- /badges - View achievements and badges
- /stats - Learning statistics and progress

🎯 POPULAR CHANNELS (use /channel/[id]):
- /channel/system-design - System architecture and scalability
- /channel/algorithms - Sorting, searching, graph algorithms
- /channel/data-structures - Arrays, trees, graphs, hash tables
- /channel/dynamic-programming - DP patterns and optimization
- /channel/frontend - React, JavaScript, CSS
- /channel/backend - APIs, microservices, server-side
- /channel/database - SQL, NoSQL, database design
- /channel/aws - Amazon Web Services
- /channel/kubernetes - Container orchestration
- /channel/devops - CI/CD, automation, infrastructure
- /channel/machine-learning - ML algorithms and models
- /channel/generative-ai - LLMs, GPT, AI technologies
- /channel/python - Python programming
- /channel/security - Application security and cryptography
- /channel/behavioral - Behavioral interview questions

📜 CERTIFICATIONS (use /certification/[id]):
- /certification/aws-saa - AWS Solutions Architect Associate
- /certification/aws-sap - AWS Solutions Architect Professional
- /certification/cka - Kubernetes Administrator
- /certification/ckad - Kubernetes Developer
- /certification/terraform-associate - Terraform Associate
- /certification/gcp-cloud-engineer - GCP Cloud Engineer
- /certification/azure-fundamentals - Azure Fundamentals

CURRENT LOCATION: ${currentPath}${currentRoute ? ` (${currentRoute.title})` : ''}

NAVIGATION RULES:
- ALWAYS read "Available Links on Page" from the DOM content above
- ONLY navigate to paths that exist in "Available Links on Page"
- If user asks for "DevOps path", navigate to /learning-paths (not /learning-paths/devops)
- If user asks for a topic channel, use /channel/[topic-id]
- If user asks for certification, use /certification/[cert-id]
- NEVER make up paths - only use paths from the sitemap or DOM content
- When in doubt, navigate to the parent page (e.g., /learning-paths instead of /learning-paths/something)`;

    
    // Build agent capabilities description
    let agentCapabilities = '';
    if (agentMode && (onNavigate || onAction)) {
      agentCapabilities = `

AGENT CAPABILITIES:
You are an intelligent agent that can interact with the application. You can:

1. NAVIGATE - Take users to different pages
   Format: [ACTION:{"type":"navigate","path":"/path","label":"Page Name"}]
   Examples:
   - [ACTION:{"type":"navigate","path":"/","label":"Home"}]
   - [ACTION:{"type":"navigate","path":"/channel/system-design","label":"System Design"}]
   - [ACTION:{"type":"navigate","path":"/certification/aws-saa","label":"AWS SAA Cert"}]

2. PERFORM ACTIONS - Trigger page actions
   Format: [ACTION:{"type":"action","name":"actionName","data":{},"description":"What you did"}]
   Available actions: ${availableActions.join(', ') || 'None on this page'}
   Examples:
   - [ACTION:{"type":"action","name":"nextQuestion","description":"Moving to next question"}]
   - [ACTION:{"type":"action","name":"showAnswer","description":"Revealing the answer"}]
   - [ACTION:{"type":"action","name":"bookmark","description":"Bookmarked this question"}]

3. CLICK BUTTON - Click any button on the page
   Format: [ACTION:{"type":"click","text":"Button Text","description":"What you're clicking"}]
   Examples:
   - [ACTION:{"type":"click","text":"next question","description":"Moving to next question"}]
   - [ACTION:{"type":"click","text":"Show Answer","description":"Revealing the answer"}]
   - [ACTION:{"type":"click","text":"Continue Learning","description":"Continuing the path"}]
   
   CRITICAL BUTTON CLICKING RULES:
   - If user says "next" or "next question" and you see a button with "next" → CLICK IT IMMEDIATELY
   - If user says "show answer" and you see "Show Answer" button → CLICK IT
   - If user says "continue" and you see "Continue" button → CLICK IT
   - Match user intent to button text and click without asking
   - Don't explain what the button does - just click it and say "Done!"

4. SCROLL TO ELEMENT - Scroll page to specific element
   Format: [ACTION:{"type":"scroll","selector":"CSS selector","description":"What you're showing"}]
   Examples:
   - [ACTION:{"type":"scroll","selector":"h1","description":"Scrolling to the main heading"}]
   - [ACTION:{"type":"scroll","selector":".answer-section","description":"Showing the answer section"}]

5. HIGHLIGHT TEXT - Highlight specific text on page (like a teacher pointing)
   Format: [ACTION:{"type":"highlight","selector":"CSS selector","description":"What you're highlighting"}]
   Examples:
   - [ACTION:{"type":"highlight","selector":"code","description":"Highlighting the code example"}]
   - [ACTION:{"type":"highlight","selector":".question-text","description":"Focusing on the question"}]

6. SUGGEST - Provide proactive suggestions
   Format: [ACTION:{"type":"suggest","message":"Your suggestion"}]
   Example: [ACTION:{"type":"suggest","message":"Try the practice mode to test your knowledge!"}]

WHEN TO USE AGENT CAPABILITIES:
- User asks "what should I do next?" → Navigate to relevant page or suggest action
- User seems stuck → Suggest next steps or navigate to easier content
- User completes a topic → Navigate to next topic or related content
- User asks to see something → Navigate there directly
- User wants to practice → Trigger practice mode or navigate to exercises
- User mentions a topic (e.g., "kubernetes") → Navigate to /channel/kubernetes
- User mentions certification (e.g., "AWS cert") → Navigate to /certifications or specific cert
- User asks "explain this" → Scroll to relevant section and highlight it
- User asks "where is X?" → Scroll to X and highlight it
- User asks "show me the answer" → Scroll to answer section and highlight it
- When explaining, use scroll and highlight to guide user's attention like a teacher
- Be proactive! Suggest next steps even when not explicitly asked

TEACHING BEHAVIOR (Like a Real Teacher):
- When explaining something, scroll to it first: [ACTION:{"type":"scroll","selector":"..."}]
- Highlight important parts while explaining: [ACTION:{"type":"highlight","selector":"..."}]
- Example explaining a question: "This question is about CI/CD pipelines. [ACTION:scroll to .question-text] It asks how to handle polyglot microservices - that means services in different languages like Node.js, Python, Java. [ACTION:highlight key terms] The key is creating a two-layer pipeline: a common layer for security and deployment, plus language-specific layers for builds and tests."
- Use scroll + highlight together for maximum clarity
- Guide user's eyes to what you're talking about
- Read the actual page content and explain what you see

IMPORTANT:
- Use actions naturally in conversation
- Explain what you're doing before/after the action
- Actions are embedded in your response text
- Multiple actions can be used in one response
- Always provide context for why you're taking an action`;
    }
    
    let prompt = `You are an expert AI learning companion, tutor, and intelligent agent. You help users learn through conversation, explanation, debate, AND by actively guiding them through the application.
${onboardingComplete && subscribedChannels.length > 0 ? `You are helping a ${role} engineer. Only suggest channels, topics, or certifications from this list: ${subscribedChannels.join(', ')}. Do not recommend topics outside this list.` : ''}

Language: Respond in ${languageName}

Current Page Context:
${pageContext || 'No specific page content available'}
${sitemapContext}
${agentCapabilities}

Conversation History:
${messages.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

User: ${userMessage}

CRITICAL ANTI-LOOP RULES:
- Check conversation history above
- If you already asked a question, DON'T ask it again
- If user says "yes", "ok", "sure", "go ahead" → EXECUTE ACTION immediately
- If you see you're repeating yourself → STOP and take action instead
- Maximum 1 question per response, then ACT on next turn

Instructions:
- Detect user intent: navigation vs explanation vs question
- For NAVIGATION requests ("take me to", "show me", "go to"): Be brief (1-2 sentences)
- For EXPLANATION requests ("explain", "what is", "how does", "why"): Be detailed (3-5 sentences)
- For QUESTIONS about content: Read the page and explain what you see
- When user says "yes", "ok", "sure" → TAKE ACTION immediately, don't ask again
- Don't repeat yourself - if you just asked a question, don't ask it again
- Read conversation history to avoid loops
${agentMode ? `
AGENT BEHAVIOR:
- Read "ACTUAL PAGE CONTENT (READ FROM DOM)" to understand current page
- If user asks "explain this" or "what is this": Read the page content and explain it in detail
- Use scroll and highlight when explaining: [ACTION:scroll] then explain, [ACTION:highlight] key parts
- If user confirms (yes/ok/sure), execute the action immediately
- Don't ask permission twice - if user agreed, DO IT
- Example explaining: "This is a CI/CD pipeline question. [ACTION:scroll to question] It asks about polyglot microservices. [ACTION:highlight key terms] The key challenge is handling multiple languages..."
- If content is on current page, point it out briefly: "DevOps path is here! Starting it now."
- Only navigate if content is NOT on current page
- CRITICAL: Only use links from "Available Links on Page"
- CRITICAL: Only click buttons from "Available Buttons"
- CRITICAL: Never navigate to paths that don't exist
- CRITICAL: Check conversation history - if you already asked something, don't ask again` : ''}

RESPONSE LENGTH RULES:
- Navigation/Action: 1-2 sentences (brief)
- Explanation/Teaching: 3-5 sentences (detailed)
- Questions: 2-3 sentences (informative)
- Detect keywords: "explain", "what", "how", "why" → Give detailed response
- Detect keywords: "take me", "show", "go to", "start" → Give brief response

Assistant (in ${languageName}):`;

    return prompt;
  };

  // Send message
  const sendMessage = async () => {
    const messageToSend = inputMessage.trim();
    
    if (!messageToSend || isGenerating) return;

    // Check if AI is disabled by user (Section 9.5: AI disabled → Remove AI UI entirely)
    if (!aiEnabled) {
      const offlineMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "AI features are currently disabled. Enable them in settings to chat.",
        timestamp: Date.now(),
        confidence: 1.0,
        isAIGenerated: false,
      };
      setMessages(prev => [...prev, offlineMsg]);
      return;
    }

    // Check if offline (Section 9.5: AI unavailable offline → Fall back silently)
    if (isOffline) {
      const offlineMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "You're offline. AI features aren't available right now. Here's what I can tell you: This app works best online for AI-powered conversations. Your question is saved below - try again when you're back online!",
        timestamp: Date.now(),
        confidence: 0.6,
        isAIGenerated: false,
      };
      setMessages(prev => [...prev, offlineMsg]);
      setFallbackMode(true);
      return;
    }

    // Check rate limiting
    if (retryAfter && Date.now() < retryAfter) {
      const waitSecs = Math.ceil((retryAfter - Date.now()) / 1000);
      const rateLimitMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Rate limit active. Please wait ${waitSecs} seconds before trying again. Your message is preserved below.`,
        timestamp: Date.now(),
        confidence: 0.9,
        isAIGenerated: false,
      };
      setMessages(prev => [...prev, rateLimitMsg]);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage(''); // Clear immediately for next input
    setIsGenerating(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Add timeout to prevent getting stuck (30 seconds)
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        console.log('Request timeout - aborting');
        abortControllerRef.current.abort();
      }
    }, 30000);

    try {
      const prompt = buildPrompt(messageToSend);
      const apiKey = provider === 'browser' ? '' : 
                     provider === 'gemini' ? geminiKey :
                     provider === 'openai' ? openaiKey :
                     provider === 'groq' ? groqKey :
                     provider === 'cohere' ? cohereKey :
                     huggingfaceKey;
      
      let response = await generateResponse(provider, apiKey, prompt, abortControllerRef.current.signal);
      
      // Execute any agent actions embedded in response
      if (agentMode) {
        const cleanResponse = executeAgentActions(response);
        response = cleanResponse || response;
      }

      // Analyze confidence and add disclaimer if needed
      const { content: analyzedContent, confidence } = analyzeConfidence(response);
      setLastResponseConfidence(confidence);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: analyzedContent,
        timestamp: Date.now(),
        confidence,
        isAIGenerated: true,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Reset retry count on success
      setRetryCount(0);
      setLastError(null);
      setFallbackMode(false);

      // Auto-speak in voice mode OR if auto-speak is enabled
      if ((voiceMode || autoSpeak) && !isInterrupting) {
        console.log('Auto-speaking response in voice mode:', voiceMode, 'autoSpeak:', autoSpeak);
        try {
          await speakMessageWithTTS(response);
        } catch (ttsError) {
          console.error('TTS error (non-fatal):', ttsError);
          // Continue even if TTS fails
        }
      } else {
        console.log('Not auto-speaking. voiceMode:', voiceMode, 'autoSpeak:', autoSpeak, 'isInterrupting:', isInterrupting);
      }
      
      // In PTT mode, user can press spacebar again for next question
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation interrupted by user');
        return;
      }
      
      console.error('AI Companion error:', error);
      setLastError(error.message || 'Unknown error');
      
      // Determine error type and handle accordingly (Section 9.5)
      const status = error.status || error.response?.status;
      const errorBody = error.response?.data || error.body;
      
      // Rate limiting (429)
      if (status === 429) {
        const retryAfterSec = error.response?.headers?.['retry-after'] || 60;
        const retryTime = Date.now() + (retryAfterSec * 1000);
        setRetryAfter(retryTime);
        setRetryCount(prev => prev + 1);
        
        // PRESERVE USER INPUT - don't lose their question
        setInputMessage(messageToSend);
        
        const rateLimitMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Rate limit reached. Please wait ${retryAfterSec} seconds before trying again. Your message is saved below.`,
          timestamp: Date.now(),
          confidence: 0.9,
          isAIGenerated: false,
        };
        setMessages(prev => [...prev, rateLimitMsg]);
        
        // Auto-clear rate limit after time
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          setRetryAfter(null);
          toast({
            title: "✅ Ready",
            description: "You can send messages again.",
          });
        }, retryAfterSec * 1000);
        
      // Network errors → retry with exponential backoff
      } else if (!navigator.onLine || error.code === 'NETWORK_ERROR' || status === 0) {
        setIsOffline(true);
        setRetryCount(prev => prev + 1);
        
        // PRESERVE USER INPUT
        setInputMessage(messageToSend);
        
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
        
        const networkErrMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🌐 Network error. Retrying in ${Math.ceil(backoffMs / 1000)} seconds... (Attempt ${retryCount + 1})`,
          timestamp: Date.now(),
          confidence: 0.5,
          isAIGenerated: false,
        };
        setMessages(prev => [...prev, networkErrMsg]);
        
        // Auto-retry with exponential backoff
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          if (navigator.onLine) {
            setIsOffline(false);
            // Retry the same message
            setInputMessage(messageToSend);
            toast({
              title: "🔄 Retrying...",
              description: "Attempting to send your message.",
            });
          }
        }, backoffMs);
        
      // Server errors (5xx) → fallback to non-AI mode
      } else if (status >= 500 && status < 600) {
        setFallbackMode(true);
        setRetryCount(prev => prev + 1);
        
        // PRESERVE USER INPUT
        setInputMessage(messageToSend);
        
        const serverErrMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "⚠️ AI service is temporarily unavailable. Switching to offline mode with static content. Your message is saved below.",
          timestamp: Date.now(),
          confidence: 0.3,
          isAIGenerated: false,
        };
        setMessages(prev => [...prev, serverErrMsg]);
        
      // Generic error
      } else {
        // PRESERVE USER INPUT
        setInputMessage(messageToSend);
        
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message || 'Please try again'}. Your question is preserved below.`,
          timestamp: Date.now(),
          confidence: 0.4,
          isAIGenerated: false,
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      clearTimeout(timeoutId); // Clear timeout
      setIsGenerating(false);
      setIsSpeaking(false); // Ensure speaking state is also reset
      abortControllerRef.current = null;
      console.log('Message send complete, ready for next input');
    }
  };

  // Generate response using AI
  const generateResponse = async (
    provider: AIProvider,
    apiKey: string,
    prompt: string,
    signal?: AbortSignal
  ): Promise<string> => {
    // If browser provider is selected, use browser LLM directly
    if (provider === 'browser') {
      return await generateWithBrowserLLM(prompt);
    }
    
    // For other providers, try API with fallback to browser
    try {
      let response: string;
      
      if (provider === 'groq') {
        response = await generateWithGroq(apiKey, prompt, signal);
      } else if (provider === 'gemini') {
        response = await generateWithGemini(apiKey, prompt, signal);
      } else if (provider === 'openai') {
        response = await generateWithOpenAI(apiKey, prompt, signal);
      } else if (provider === 'cohere') {
        response = await generateWithCohere(apiKey, prompt, signal);
      } else {
        response = await generateWithHuggingFace(apiKey, prompt, signal);
      }
      
      return response;
    } catch (error) {
      console.error(`${provider} failed, falling back to browser LLM:`, error);
      
      // Fallback to browser-based LLM
      return await generateWithBrowserLLM(prompt);
    }
  };

  // Generate with browser-based LLM (fallback)
  const generateWithBrowserLLM = async (prompt: string): Promise<string> => {
    // Try WebLLM (Phi-3) first
    if (webLLMEngine) {
      try {
        console.log('Using WebLLM (Phi-3)');
        setCurrentModel('Phi-3-mini-4k (3.8B)');
        
        // Extract just the user's question from the complex prompt
        const userMatch = prompt.match(/User: (.+?)(?:\n\n|$)/);
        const userQuestion = userMatch ? userMatch[1].trim() : prompt;
        
        // Simplified system prompt
        const systemPrompt = `You are a helpful AI assistant. Answer questions clearly and concisely in 2-3 sentences. Be direct and helpful.`;
        
        const messages: WebLLMMessage[] = [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userQuestion,
          },
        ];
        
        const response = await webLLMEngine.chat.completions.create({
          messages,
          temperature: 0.7,
          max_tokens: 150,
          top_p: 0.9,
        });
        
        const content = response.choices[0]?.message?.content || '';
        
        // Validate response quality
        if (content.length < 10 || content.includes('�') || /[^\x00-\x7F]{20,}/.test(content)) {
          console.warn('WebLLM generated invalid response, falling back');
          throw new Error('Invalid response');
        }
        
        return content;
      } catch (error) {
        console.error('WebLLM generation failed:', error);
      }
    }
    
    // Try Chrome Built-in AI API (Gemini Nano) as fallback
    if ('ai' in window && 'languageModel' in (window as any).ai) {
      try {
        console.log('Using Chrome Built-in AI (Gemini Nano)');
        setCurrentModel('Chrome AI (Gemini Nano)');
        
        // Extract user question
        const userMatch = prompt.match(/User: (.+?)(?:\n\n|$)/);
        const userQuestion = userMatch ? userMatch[1].trim() : prompt;
        
        const session = await (window as any).ai.languageModel.create({
          systemPrompt: 'You are a helpful assistant. Answer briefly and clearly.',
        });
        
        const response = await session.prompt(userQuestion);
        session.destroy();
        
        return response;
      } catch (error) {
        console.warn('Chrome Built-in AI failed:', error);
      }
    }
    
    // Fallback to rule-based responses
    console.log('Using rule-based fallback');
    setCurrentModel('Browser LLM (Rule-based)');
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Extract user message from prompt
    const userMatch = prompt.match(/User: (.+?)(?:\n|$)/);
    const userMessage = userMatch ? userMatch[1].toLowerCase() : lowerPrompt;
    
    // Navigation requests
    if (userMessage.includes('take me') || userMessage.includes('navigate') || userMessage.includes('go to')) {
      if (userMessage.includes('devops')) {
        return "Taking you to the Learning Paths page where you can find the DevOps Engineer path!";
      }
      if (userMessage.includes('home')) {
        return "Taking you home!";
      }
      if (userMessage.includes('learning path') || userMessage.includes('paths')) {
        return "Taking you to Learning Paths!";
      }
      if (userMessage.includes('certification') || userMessage.includes('cert')) {
        return "Taking you to Certifications!";
      }
      return "Where would you like to go? Try: home, learning paths, certifications, or channels.";
    }
    
    // Explanation requests
    if (userMessage.includes('explain') || userMessage.includes('what is') || userMessage.includes('how does')) {
      return "I'm using basic rule-based responses. The Phi-3 model may not be working correctly. Try using Groq (free API) for better responses!";
    }
    
    // Confirmation
    if (userMessage.includes('yes') || userMessage.includes('ok') || userMessage.includes('sure') || userMessage.includes('go ahead')) {
      return "Great! Let me help you with that.";
    }
    
    // Help requests
    if (userMessage.includes('help') || userMessage.includes('what can')) {
      return "I can help you navigate the site, find learning paths, and guide your learning journey. Try asking me to take you somewhere!";
    }
    
    // Default
    return "I'm having trouble with the browser AI. Try switching to Groq (free) in settings for better responses!";
  };

  // Generate with Groq
  const generateWithGroq = async (apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> => {
    const models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.2-90b-text-preview',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ];
    
    for (const model of models) {
      try {
        setCurrentModel(`Groq: ${model}`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 250, // Flexible: brief for actions, detailed for explanations
          }),
          signal,
        });

        if (!response.ok) continue;
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      } catch {}
    }
    throw new Error('All Groq models failed');
  };

  // Generate with Gemini
  const generateWithGemini = async (apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> => {
    const models = [
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-pro',
    ];
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
            }),
          }
        );

        if (!response.ok) continue;
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch {}
    }
    throw new Error('All Gemini models failed');
  };

  // Generate with OpenAI
  const generateWithOpenAI = async (apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> => {
    const models = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    
    for (const model of models) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 250, // Flexible: brief for actions, detailed for explanations
          }),
        });

        if (!response.ok) continue;
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      } catch {}
    }
    throw new Error('All OpenAI models failed');
  };

  // Generate with Cohere
  const generateWithCohere = async (apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> => {
    const models = ['command-r-plus', 'command-r', 'command'];
    
    for (const model of models) {
      try {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            max_tokens: 250, // Flexible: brief for actions, detailed for explanations
            temperature: 0.7,
          }),
        });

        if (!response.ok) continue;
        const data = await response.json();
        if (data.generations?.[0]?.text) {
          return data.generations[0].text;
        }
      } catch {}
    }
    throw new Error('All Cohere models failed');
  };

  // Generate with HuggingFace
  const generateWithHuggingFace = async (apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> => {
    const models = [
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'mistralai/Mistral-7B-Instruct-v0.2',
    ];
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: { max_new_tokens: 1024, temperature: 0.7 },
            }),
          }
        );

        if (!response.ok) continue;
        const data = await response.json();
        if (data[0]?.generated_text) {
          return data[0].generated_text;
        }
      } catch {}
    }
    throw new Error('All HuggingFace models failed');
  };

  // Speak message with TTS
  const speakMessageWithTTS = async (text: string) => {
    console.log('speakMessageWithTTS called with:', { 
      ttsProvider, 
      hasElevenlabsKey: !!elevenlabsKey,
      hasOpenaiKey: !!openaiKey,
      textLength: text.length 
    });
    
    try {
      if (ttsProvider === 'elevenlabs' && elevenlabsKey) {
        console.log('Using ElevenLabs TTS');
        setCurrentTTSModel('ElevenLabs');
        await speakWithElevenLabs(text);
      } else if (ttsProvider === 'openai' && openaiKey) {
        console.log('Using OpenAI TTS');
        setCurrentTTSModel('OpenAI TTS');
        await speakWithOpenAI(text);
      } else {
        console.log('Using Web Speech API');
        setCurrentTTSModel('Browser TTS');
        speakWithWebSpeech(text); // Not async, don't await
      }
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to Web Speech if other providers fail
      if (ttsProvider !== 'webspeech') {
        console.log('Falling back to Web Speech API');
        setCurrentTTSModel('Browser TTS (Fallback)');
        speakWithWebSpeech(text);
      }
    }
  };

  // Speak with ElevenLabs
  const speakWithElevenLabs = async (text: string) => {
    try {
      const voiceMap: Record<Language, string> = {
        en: 'EXAVITQu4vr4xnSDxMaL',
        es: 'VR6AewLTigWG4xSOukaG',
        fr: 'cgSgspJ2msm6clMCkdW9',
        de: 'iP95p4xoKVk53GoZ742B',
        hi: 'pFZP5JQG7iQjIQuC4Bku',
        zh: 'XB0fDUnXU5powFXDhCwa',
        ja: 'jBpfuIE2acCO8z3wKNLl',
        pt: 'yoZ06aMxZJJ28mfd3POQ',
        ar: 'onwK4e9ZLuTAKqWW03F9',
      };

      const voiceId = voiceMap[language] || voiceMap.en;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenlabsKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.onplay = () => setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onerror = () => setIsSpeaking(false);
          await audioRef.current.play();
        }
        return;
      }
    } catch (error) {
      console.warn('ElevenLabs TTS failed, falling back to Web Speech');
    }
    
    // Fallback to Web Speech
    speakWithWebSpeech(text);
  };

  // Speak with OpenAI
  const speakWithOpenAI = async (text: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: 'nova',
          input: text,
          speed: speechRate,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.onplay = () => setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onerror = () => setIsSpeaking(false);
          await audioRef.current.play();
        }
        return;
      }
    } catch (error) {
      console.warn('OpenAI TTS failed, falling back to Web Speech');
    }
    
    // Fallback to Web Speech
    speakWithWebSpeech(text);
  };

  // Speak with Web Speech API
  const speakWithWebSpeech = (text: string) => {
    console.log('speakWithWebSpeech called');
    
    if ('speechSynthesis' in window) {
      console.log('Speech synthesis available, speaking...');
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getVoiceLanguage(language);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      
      // Use selected voice if available
      if (selectedVoice) {
        const voice = availableVoices.find(v => v.name === selectedVoice);
        if (voice) {
          utterance.voice = voice;
          console.log('Using selected voice:', voice.name);
        }
      }
      
      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
      };
      utterance.onerror = (e) => {
        console.error('Speech error:', e);
        setIsSpeaking(false);
      };
      
      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      console.log('Speech queued');
    } else {
      console.error('Speech synthesis not available');
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    console.log('Stopping speech...');
    
    // Cancel Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Force cancel again after a tiny delay (some browsers need this)
      setTimeout(() => {
        window.speechSynthesis.cancel();
      }, 10);
    }
    
    // Stop audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ''; // Clear source
    }
    
    setIsSpeaking(false);
    console.log('Speech stopped');
  };

  // Get voice language
  const getVoiceLanguage = (lang: Language): string => {
    const map: Record<Language, string> = {
      en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
      hi: 'hi-IN', zh: 'zh-CN', ja: 'ja-JP', pt: 'pt-BR', ar: 'ar-SA',
    };
    return map[lang] || 'en-US';
  };

  // Analyze response confidence and add disclaimer if needed
  const analyzeConfidence = (response: string): { content: string; confidence: number } => {
    const lowerResponse = response.toLowerCase();
    let confidence = 0.9;
    let disclaimer = '';

    const uncertainPhrases = [
      'i\'m not sure', 'i don\'t know', 'uncertain', 'might be', 'could be',
      'possibly', 'probably', 'likely', 'i think', 'i believe',
      'not certain', 'unclear', 'depends', 'it varies', 'may differ',
      'i\'m not 100% sure', 'i\'m not completely certain', 'hard to say',
    ];

    const confidentPhrases = [
      'definitely', 'absolutely', 'certainly', 'always', 'never',
      'required', 'must', 'guaranteed', 'exactly', 'precisely',
    ];

    for (const phrase of uncertainPhrases) {
      if (lowerResponse.includes(phrase)) {
        confidence = Math.min(confidence, 0.5 + Math.random() * 0.2);
        break;
      }
    }

    for (const phrase of confidentPhrases) {
      if (lowerResponse.includes(phrase)) {
        confidence = Math.max(confidence, 0.85);
        break;
      }
    }

    if (response.length < 20) confidence = Math.min(confidence, 0.6);
    if (response.length > 500) confidence = Math.max(confidence, confidence + 0.1);

    if (confidence < 0.7) {
      disclaimer = '\n\n💡 Note: I\'m not entirely certain about this. Please verify with official documentation.';
    }

    return { content: response + disclaimer, confidence };
  };

  // Get confidence label color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  // Copy message
  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Clear conversation
  const clearConversation = () => {
    // Use custom GoogleDialog instead of native confirm()
    setShowClearDialog(true);
  };

  const confirmClearConversation = () => {
    setMessages([]);
    localStorage.removeItem('ai-companion-messages');
    setShowClearDialog(false);
  };

  const cancelClearConversation = () => {
    setShowClearDialog(false);
  };

  // Quick actions
  return (
    <>
      {/* AI Agent Highlight Styles */}
      <style>{`
        @keyframes ai-agent-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(60,64,67,0.12);
            outline: 3px solid rgba(60,64,67,0.12);
          }
          50% { 
            box-shadow: 0 0 0 15px rgba(60,64,67,0.12);
            outline: 3px solid rgba(60,64,67,0.12);
          }
        }
        
        @keyframes ai-agent-highlight-bg {
          0%, 100% { 
            background-color: rgba(60,64,67,0.12);
          }
          50% { 
            background-color: rgba(60,64,67,0.12);
          }
        }
        
        @keyframes ai-agent-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(60,64,67,0.12);
          }
          50% {
            box-shadow: 0 0 30px rgba(60,64,67,0.12);
          }
        }
        
        .ai-agent-focus {
          animation: ai-agent-pulse 1s ease-in-out 2;
          outline-offset: 4px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .ai-agent-highlight {
          animation: ai-agent-highlight-bg 1s ease-in-out 3, ai-agent-glow 1s ease-in-out 3;
          outline: 3px solid rgba(60,64,67,0.12) !important;
          outline-offset: 4px;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
          z-index: 10;
        }
        
        .ai-agent-highlight::before {
          content: '👁️ AI is looking here';
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #4285F4 0%, #ec4899 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(60,64,67,0.12);
          z-index: 1000;
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Floating Button - Only show when AI is enabled */}
      {!isOpen && aiEnabled && (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-28 right-6 z-40 w-14 h-14 bg-gradient-to-r from-primary to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow lg:bottom-6"
          title="AI Companion"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Companion Window - Only render when AI is enabled */}
      <AnimatePresence>
        {isOpen && aiEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed z-50 bg-card rounded-xl shadow-sm flex flex-col ${
              isMinimized
                ? 'bottom-6 right-6 w-80 h-16'
                : 'bottom-6 right-6 w-96 h-[600px]'
            }`}
          >
            {/* Header */}
             <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="min-w-[48px] w-10 min-h-[48px] h-10 bg-gradient-to-r from-primary to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">AI Companion</h2>
                    <p className="text-xs text-muted-foreground">
                      {LANGUAGES.find(l => l.code === language)?.flag} {LANGUAGES.find(l => l.code === language)?.name}
                      {voiceMode && ' • Voice Mode 🎙️'}
                    </p>
                    {isLoadingModel && modelLoadProgress && (
                      <p className="text-xs text-blue-500 font-mono animate-pulse">
                        ⏳ {modelLoadProgress}
                      </p>
                    )}
                    {currentModel && !isLoadingModel && (
                      <p className="text-xs text-primary font-mono">
                        🤖 {currentModel} | 🔊 {currentTTSModel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(isGenerating || isSpeaking) && (
                    <button
                      onClick={interruptGeneration}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Interrupt"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={toggleVoiceMode}
                    className={`p-2 rounded-lg transition-colors ${
                      voiceMode
                        ? 'bg-gradient-to-r from-primary to-pink-500 text-white'
                        : 'hover:bg-muted'
                    }`}
                    title={voiceMode ? 'Exit Voice Mode' : 'Enter Voice Mode'}
                  >
                    {voiceMode ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Settings Panel */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-b border-border bg-muted/30"
                    >
                      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        {/* AI Provider */}
                        <div>
                          <label className="text-xs font-semibold mb-1 block">AI Provider</label>
                          <div className="grid grid-cols-4 gap-1">
                            {(['browser', 'groq', 'gemini', 'openai'] as AIProvider[]).map(p => (
                              <button
                                key={p}
                                onClick={() => setProvider(p)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  provider === p
                                    ? 'bg-gradient-to-r from-primary to-pink-500 text-white'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {p === 'browser' ? '🌐 Browser' : p.charAt(0).toUpperCase() + p.slice(1)}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {provider === 'browser' && '✅ Free, works offline, no API key needed'}
                            {provider === 'groq' && '⚡ Free, fast, recommended'}
                            {provider === 'gemini' && '🤖 Google AI'}
                            {provider === 'openai' && '🔥 Best quality, paid'}
                          </p>
                        </div>

                        {/* API Key (only if not browser) */}
                        {provider !== 'browser' && (
                          <div>
                            <label className="text-xs font-semibold mb-1 block">
                              API Key {touchedFields[`${provider}Key`] && getProviderKeyError() ? '(Required)' : ''}
                            </label>
                            <input
                              type="password"
                              value={getProviderKeyValue()}
                              onChange={(e) => handleProviderKeyChange(e.target.value)}
                              onBlur={() => handleSettingsBlur(`${provider}Key`)}
                              placeholder="Enter API key"
                              aria-invalid={!!getProviderKeyError()}
                              aria-describedby={getProviderKeyError() ? `${provider}-key-error` : undefined}
                              className={`w-full px-3 py-1.5 text-sm bg-background border rounded-lg focus:outline-none focus:border-primary ${
                                getProviderKeyError() ? 'border-red-500' : 'border-border'
                              }`}
                            />
                            {getProviderKeyError() && (
                              <p id={`${provider}-key-error`} role="alert" className="mt-1 text-xs text-red-500">
                                {getProviderKeyError()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Language */}
                        <div>
                          <label className="text-xs font-semibold mb-1 block">Language</label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                          >
                            {LANGUAGES.map((lang) => (
                              <option key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* TTS Provider */}
                        <div>
                          <label className="text-xs font-semibold mb-1 block">Voice Provider (TTS)</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['webspeech', 'elevenlabs', 'openai'] as TTSProvider[]).map(p => (
                              <button
                                key={p}
                                onClick={() => setTTSProvider(p)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  ttsProvider === p
                                    ? 'bg-gradient-to-r from-blue-500 to-primary text-white'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {p === 'webspeech' ? 'Browser' : p.charAt(0).toUpperCase() + p.slice(1)}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ttsProvider === 'webspeech' && '✅ Free, works without API key'}
                            {ttsProvider === 'elevenlabs' && '🎙️ Best quality, free 10k/mo (API key needed)'}
                            {ttsProvider === 'openai' && '🔊 High quality, paid (API key needed)'}
                          </p>
                        </div>

                        {/* TTS API Key (if needed) */}
                        {(ttsProvider === 'elevenlabs' || ttsProvider === 'openai') && (
                          <div>
                            <label className="text-xs font-semibold mb-1 block">
                              {ttsProvider === 'elevenlabs' ? 'ElevenLabs' : 'OpenAI'} TTS API Key
                              {touchedFields[`${ttsProvider}TTSKey`] && getTTSError() ? ' (Required)' : ''}
                            </label>
                            <input
                              type="password"
                              value={getTTSValue()}
                              onChange={(e) => handleTTSKeyChange(e.target.value)}
                              onBlur={() => handleSettingsBlur(`${ttsProvider}TTSKey`)}
                              placeholder="Enter TTS API key"
                              aria-invalid={!!getTTSError()}
                              aria-describedby={getTTSError() ? `${ttsProvider}-tts-error` : undefined}
                              className={`w-full px-3 py-1.5 text-sm bg-background border rounded-lg focus:outline-none focus:border-primary ${
                                getTTSError() ? 'border-red-500' : 'border-border'
                              }`}
                            />
                            {getTTSError() && (
                              <p id={`${ttsProvider}-tts-error`} role="alert" className="mt-1 text-xs text-red-500">
                                {getTTSError()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Voice Selection (for Browser TTS) */}
                        {ttsProvider === 'webspeech' && availableVoices.length > 0 && (
                          <div>
                            <label className="text-xs font-semibold mb-1 block">Voice Selection</label>
                            <select
                              value={selectedVoice}
                              onChange={(e) => setSelectedVoice(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                            >
                              <option value="">Default Voice</option>
                              {availableVoices
                                .filter(voice => voice.lang.startsWith(getVoiceLanguage(language).split('-')[0]))
                                .map((voice) => (
                                  <option key={voice.name} value={voice.name}>
                                    {voice.name} ({voice.lang})
                                  </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                              {availableVoices.filter(v => v.lang.startsWith(getVoiceLanguage(language).split('-')[0])).length} voices available for {LANGUAGES.find(l => l.code === language)?.name}
                            </p>
                          </div>
                        )}

                        {/* Speech Rate */}
                        {ttsProvider === 'webspeech' && (
                          <div>
                            <label className="text-xs font-semibold mb-1 block">
                              Speech Rate: {speechRate.toFixed(2)}x
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.05"
                              value={speechRate}
                              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Slower</span>
                              <span>Faster</span>
                            </div>
                          </div>
                        )}

                        {/* Auto-speak */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="auto-speak"
                            checked={autoSpeak}
                            onChange={(e) => setAutoSpeak(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="auto-speak" className="text-xs">
                            Auto-speak responses (always on in voice mode)
                          </label>
                        </div>

                        {/* AI Enable/Disable Toggle */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="ai-enabled"
                            checked={aiEnabled}
                            onChange={toggleAI}
                            className="rounded"
                          />
                          <label htmlFor="ai-enabled" className="text-xs">
                            Enable AI features
                          </label>
                        </div>

                        <button
                          onClick={saveSettings}
                          className="w-full px-3 py-1.5 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                          disabled={Object.keys(settingsErrors).length > 0}
                          aria-describedby={Object.keys(settingsErrors).length > 0 ? 'settings-error-summary' : undefined}
                        >
                          Save Settings
                        </button>
                        {Object.keys(settingsErrors).length > 0 && (
                          <p id="settings-error-summary" role="alert" className="mt-1 text-xs text-red-500">
                            Please fix the errors above before saving
                          </p>
                        )}
                        <div aria-live="polite" className="sr-only" id="settings-status" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages */}
                <AICompanionMessages
                  messages={messages}
                  isGenerating={isGenerating}
                  copied={copied}
                  onNavigate={onNavigate}
                  availableActions={availableActions}
                  agentMode={agentMode}
                  recognitionAvailable={!!recognitionRef.current}
                  onSpeak={speakMessageWithTTS}
                  onCopy={copyMessage}
                  onQuickAction={(prompt) => { setInputMessage(prompt); inputRef.current?.focus(); }}
                  messagesEndRef={messagesEndRef}
                />

                {/* Input */}
                <AICompanionInput
                  inputMessage={inputMessage}
                  isGenerating={isGenerating}
                  voiceMode={voiceMode}
                  isPushingToTalk={isPushingToTalk}
                  isSpeaking={isSpeaking}
                  hasMessages={messages.length > 0}
                  inputRef={inputRef}
                  onChange={setInputMessage}
                  onSend={sendMessage}
                  onClear={clearConversation}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Clear Conversation Dialog */}
      {showClearDialog && (
        <GoogleDialog
          title="Clear Conversation"
          description="This will permanently delete all messages in this conversation. This action cannot be undone."
          open={showClearDialog}
          onClose={cancelClearConversation}
          actions={
            <>
              <button
                onClick={cancelClearConversation}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearConversation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Clear
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to clear all conversation history?
          </p>
        </GoogleDialog>
      )}
    </>
  );
}
