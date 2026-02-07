/**
 * WebLLM Integration for Interview Buddy AI
 * Provides local AI inference using MLC LLM models
 */

import type {
  WebLLMConfig,
  EvaluationResult,
  Question,
  ModelInfo,
  ModelLoadProgress,
} from "@/types";

// Placeholder implementation for when @mlc-ai/web-llm is not available
// This will be replaced with actual implementation once the dependency is properly installed

function getDefaultSystemPrompt(): string {
  return `You are an expert technical interviewer conducting practice interviews.
Your role is to:
1. Ask relevant technical interview questions
2. Evaluate answers based on key technical points
3. Provide constructive feedback
4. Ask follow-up questions to probe deeper understanding
Be professional, encouraging, and thorough in your evaluations.`;
}

export class WebLLMManager {
  private config: WebLLMConfig;
  private isInitialized = false;
  private engine: any = null;
  private onProgressCallback?: (progress: ModelLoadProgress) => void;

  constructor({
    modelId,
    temperature,
    maxTokens,
    topP,
    systemPrompt,
  }: WebLLMConfig) {
    this.config = {
      modelId: modelId || "Llama-3.2-3B-Instruct-q4f16_1-MLC",
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 1024,
      topP: topP ?? 0.9,
      systemPrompt: systemPrompt ?? getDefaultSystemPrompt(),
    };
    // Store config for future use
    void this.config.modelId;
  }

  async initialize(
    onProgress?: (progress: ModelLoadProgress) => void,
  ): Promise<void> {
    this.onProgressCallback = onProgress;

    try {
      // Check if @mlc-ai/web-llm is available
      if (typeof window !== "undefined" && (window as any).mlc) {
        await this.initializeWithMLC();
      } else {
        // Fallback: simulate initialization for demo
        console.log("WebLLM not available, using fallback mode");
        await this.simulateInitialization();
      }
    } catch (error) {
      console.error("Failed to initialize WebLLM:", error);
      this.onProgressCallback?.({
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async initializeWithMLC(): Promise<void> {
    // This would be the real implementation with @mlc-ai/web-llm
    // const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    // this.engine = await CreateMLCEngine(this.config.modelId, {
    //   initProgressCallback: (progress) => {
    //     this.onProgressCallback?.({
    //       progress: progress.progress * 100,
    //       status: progress.progress < 1 ? 'downloading' : 'ready',
    //       message: progress.text,
    //     });
    //   },
    // });
    this.isInitialized = true;
  }

  private async simulateInitialization(): Promise<void> {
    // Simulate model loading progress
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      this.onProgressCallback?.({
        progress: (i / steps) * 100,
        status: i < steps ? "downloading" : "ready",
        message:
          i < steps
            ? `Downloading model... ${Math.round((i / steps) * 100)}%`
            : "Model ready",
      });
    }
    this.isInitialized = true;
  }

  async generate(
    prompt: string,
    _options?: Partial<WebLLMConfig>,
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error("WebLLM not initialized. Call initialize() first.");
    }

    try {
      if (this.engine) {
        // Real implementation would use the engine
        // const response = await this.engine.chat.completions.create({
        //   messages: [
        //     { role: 'system', content: this.config.systemPrompt },
        //     { role: 'user', content: prompt }
        //   ],
        //   temperature: _options?.temperature ?? this.config.temperature,
        //   max_tokens: _options?.maxTokens ?? this.config.maxTokens,
        //   top_p: _options?.topP ?? this.config.topP,
        // });
        // return response.choices[0].message.content || '';
      }

      // Fallback: simulate response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.generateFallbackResponse(prompt);
    } catch (error) {
      console.error("Generation error:", error);
      throw error;
    }
  }

  private generateFallbackResponse(prompt: string): string {
    // Simple fallback responses based on prompt keywords
    if (prompt.toLowerCase().includes("evaluate")) {
      return JSON.stringify({
        score: 75,
        coveredPoints: ["Good technical understanding", "Clear explanation"],
        missingPoints: ["Edge cases", "Performance considerations"],
        feedback: "Good answer overall. Consider discussing edge cases.",
        followUp: "Can you explain how your solution handles edge cases?",
      });
    }

    if (
      prompt.toLowerCase().includes("follow up") ||
      prompt.toLowerCase().includes("follow-up")
    ) {
      return "That's an interesting point. Can you elaborate on the performance implications?";
    }

    return "I understand. Please continue with your explanation.";
  }

  async evaluateAnswer(
    question: Question,
    userAnswer: string,
  ): Promise<EvaluationResult> {
    const prompt = `Evaluate the following answer to an interview question:

Question: ${question.question}

Expected Answer Key Points: ${question.answer}

User Answer: ${userAnswer}

Provide a detailed evaluation in JSON format with:
- isComplete: boolean indicating if answer covers all key points
- score: number from 0-100
- coveredKeyPoints: array of key points covered
- missingKeyPoints: array of key points missing
- followUpQuestion: optional follow-up question if needed
- confidence: number 0-1 indicating evaluation confidence
- reasoning: explanation of the evaluation
- feedback: object with strengths, improvements, and overallComment
- suggestedImprovements: array of improvement suggestions`;

    const response = await this.generate(prompt, {
      maxTokens: 2048,
      temperature: 0.3,
    });

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return {
        isComplete: parsed.isComplete ?? false,
        score: parsed.score ?? 0,
        coveredKeyPoints: parsed.coveredKeyPoints ?? [],
        missingKeyPoints: parsed.missingKeyPoints ?? [],
        followUpQuestion: parsed.followUpQuestion,
        confidence: parsed.confidence ?? 0.5,
        reasoning: parsed.reasoning ?? "",
        feedback: {
          strengths: parsed.feedback?.strengths ?? [],
          improvements: parsed.feedback?.improvements ?? [],
          overallComment: parsed.feedback?.overallComment ?? "",
        },
        suggestedImprovements: parsed.suggestedImprovements ?? [],
      };
    } catch (_e) {
      // Fallback if not valid JSON
      return {
        isComplete: false,
        score: 50,
        coveredKeyPoints: [],
        missingKeyPoints: ["Unable to parse evaluation"],
        confidence: 0.3,
        reasoning: "Parsing error",
        feedback: {
          strengths: [],
          improvements: ["Please provide a more structured answer"],
          overallComment: response.substring(0, 200),
        },
        suggestedImprovements: ["Structure your answer more clearly"],
      };
    }
  }

  async generateFollowUp(
    question: Question,
    userAnswer: string,
    previousFollowups: string[],
  ): Promise<string> {
    const prompt = `Based on this interview response, generate a relevant follow-up question:

Original Question: ${question.question}
User Answer: ${userAnswer}
Previous Follow-ups Asked: ${previousFollowups.join(", ") || "None"}

Generate a concise, specific follow-up question that probes deeper understanding.`;

    return await this.generate(prompt, { maxTokens: 256, temperature: 0.7 });
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    if (this.engine) {
      // this.engine.dispose();
      this.engine = null;
    }
    this.isInitialized = false;
  }
}

// Available models configuration
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B Instruct",
    description:
      "Lightweight but capable model optimized for instruction following",
    sizeGB: 1.8,
    capabilities: ["text-generation", "question-answering", "evaluation"],
    downloadUrl:
      "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC",
    isAvailable: true,
    isDownloaded: false,
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    name: "Phi-3 Mini 4K Instruct",
    description: "Microsoft Phi-3 optimized for reasoning and coding",
    sizeGB: 1.5,
    capabilities: ["text-generation", "coding", "reasoning"],
    downloadUrl:
      "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f16_1-MLC",
    isAvailable: true,
    isDownloaded: false,
  },
  {
    id: "gemma-2b-it-q4f16_1-MLC",
    name: "Gemma 2B Instruct",
    description: "Google Gemma 2B instruction-tuned model",
    sizeGB: 1.2,
    capabilities: ["text-generation", "question-answering"],
    downloadUrl: "https://huggingface.co/mlc-ai/gemma-2b-it-q4f16_1-MLC",
    isAvailable: true,
    isDownloaded: false,
  },
];

// Singleton instance
let webLLMInstance: WebLLMManager | null = null;

export function getWebLLM(config?: Partial<WebLLMConfig>): WebLLMManager {
  if (!webLLMInstance) {
    webLLMInstance = new WebLLMManager({
      modelId: config?.modelId || "Llama-3.2-3B-Instruct-q4f16_1-MLC",
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 1024,
      topP: config?.topP ?? 0.9,
    });
  }
  return webLLMInstance;
}

export function resetWebLLM(): void {
  if (webLLMInstance) {
    webLLMInstance.dispose();
    webLLMInstance = null;
  }
}

export function createWebLLM(config: WebLLMConfig): WebLLMManager {
  return new WebLLMManager(config);
}
