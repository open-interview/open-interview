import type { Express } from "express";
import { type Server } from "http";
import * as QRepo from './repositories/questions';
import * as CRepo from './repositories/certifications';
import * as SRepo from './repositories/sessions';
import fs from 'fs';
import path from 'path';
import { localBlogStorage as blogStorage } from "./blog-storage-local";

const DATA_DIR = path.join(process.cwd(), 'data');

// Helper to parse JSON fields from DB
function parseQuestion(row: any) {
  // Sanitize answer field - ensure no JSON/MCQ format
  let answer = row.answer;
  
  // Check if answer contains MCQ JSON format
  if (answer && typeof answer === 'string' && answer.trim().startsWith('[{')) {
    try {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Extract correct answer text
        const correctOption = parsed.find((opt: any) => opt.isCorrect === true);
        if (correctOption && correctOption.text) {
          answer = correctOption.text;
          console.warn(`⚠️  Question ${row.id} had MCQ format in answer - sanitized on-the-fly`);
        }
      }
    } catch (e) {
      // If parsing fails, leave as is but log warning
      console.warn(`⚠️  Question ${row.id} has malformed answer field`);
    }
  }
  
  return {
    id: row.id,
    question: row.question,
    answer: answer,
    explanation: row.explanation,
    diagram: row.diagram,
    difficulty: row.difficulty,
    tags: row.tags ? JSON.parse(row.tags) : [],
    channel: row.channel,
    subChannel: row.sub_channel,
    sourceUrl: row.source_url,
    videos: row.videos ? JSON.parse(row.videos) : null,
    companies: row.companies ? JSON.parse(row.companies) : null,
    eli5: row.eli5,
    lastUpdated: row.last_updated,
  };
}



export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all channels with question counts
  app.get("/api/channels", async (_req, res) => {
    try {
      const rows = await QRepo.getChannels();
      res.json(rows.map(r => ({ id: r.channel, questionCount: r.count })));
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });

  // Get question IDs for a channel with filters
  app.get("/api/questions/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const { subChannel, difficulty } = req.query;
      const rows = await QRepo.getQuestionsByChannel(channelId, subChannel as string, difficulty as string);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Get a random question (must be before :questionId to avoid route conflict)
  app.get("/api/question/random", async (req, res) => {
    try {
      const { channel, difficulty } = req.query;
      const row = await QRepo.getRandomQuestion(channel as string, difficulty as string);
      if (!row) {
        return res.status(404).json({ error: "No questions found" });
      }
      res.json(parseQuestion(row));
    } catch (error) {
      console.error("Error fetching random question:", error);
      res.status(500).json({ error: "Failed to fetch random question" });
    }
  });

  // Get a single question by ID
  app.get("/api/question/:questionId", async (req, res) => {
    try {
      const { questionId } = req.params;
      const row = await QRepo.getQuestionById(questionId);
      if (!row) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(parseQuestion(row));
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  // Get channel stats
  app.get("/api/stats", async (_req, res) => {
    try {
      const rows = await QRepo.getStats();

      // Aggregate by channel
      const statsMap = new Map<string, { total: number; beginner: number; intermediate: number; advanced: number }>();
      
      for (const row of rows) {
        const channel = row.channel as string;
        const difficulty = row.difficulty as string;
        const count = Number(row.count);
        
        if (!statsMap.has(channel)) {
          statsMap.set(channel, { total: 0, beginner: 0, intermediate: 0, advanced: 0 });
        }
        const stat = statsMap.get(channel)!;
        stat.total += count;
        if (difficulty === 'beginner') stat.beginner = count;
        if (difficulty === 'intermediate') stat.intermediate = count;
        if (difficulty === 'advanced') stat.advanced = count;
      }

      const stats = Array.from(statsMap.entries()).map(([id, stat]) => ({
        id,
        ...stat
      }));

      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get subchannels for a channel
  app.get("/api/subchannels/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const rows = await QRepo.getSubchannels(channelId);
      res.json(rows.map(r => r.sub_channel));
    } catch (error) {
      console.error("Error fetching subchannels:", error);
      res.status(500).json({ error: "Failed to fetch subchannels" });
    }
  });

  // Get companies for a channel
  app.get("/api/companies/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const rows = await QRepo.getCompaniesByChannel(channelId);
      const companiesSet = new Set<string>();
      for (const row of rows) {
        if (row.companies) {
          const parsed = JSON.parse(row.companies as string);
          parsed.forEach((c: string) => companiesSet.add(c));
        }
      }
      res.json(Array.from(companiesSet).sort());
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Note: Bot activity is served from static JSON file at /data/bot-activity.json
  // Generated during build by fetch-questions-for-build.js

  // ============================================
  // CODING CHALLENGES API
  // ============================================

  // Helper to parse coding challenge from DB row
  function parseCodingChallenge(row: any) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],
      companies: row.companies ? JSON.parse(row.companies) : [],
      starterCode: {
        javascript: row.starter_code_js || '',
        python: row.starter_code_py || '',
      },
      testCases: row.test_cases ? JSON.parse(row.test_cases) : [],
      hints: row.hints ? JSON.parse(row.hints) : [],
      sampleSolution: {
        javascript: row.solution_js || '',
        python: row.solution_py || '',
      },
      complexity: {
        time: row.complexity_time || 'O(n)',
        space: row.complexity_space || 'O(1)',
        explanation: row.complexity_explanation || '',
      },
      timeLimit: row.time_limit || 15,
    };
  }

  // Get all coding challenges
  app.get("/api/coding/challenges", async (req, res) => {
    try {
      const { difficulty, category } = req.query;
      const rows = await CRepo.getCodingChallenges({ difficulty: difficulty as string, category: category as string });
      res.json(rows.map(parseCodingChallenge));
    } catch (error) {
      console.error("Error fetching coding challenges:", error);
      // Return empty array if table doesn't exist yet
      res.json([]);
    }
  });

  // Get a single coding challenge by ID
  app.get("/api/coding/challenge/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const row = await CRepo.getCodingChallengeById(id);
      if (!row) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      res.json(parseCodingChallenge(row));
    } catch (error) {
      console.error("Error fetching coding challenge:", error);
      res.status(500).json({ error: "Failed to fetch challenge" });
    }
  });

  // Get a random coding challenge
  app.get("/api/coding/random", async (req, res) => {
    try {
      const { difficulty } = req.query;
      const row = await CRepo.getRandomCodingChallenge(difficulty as string);
      if (!row) {
        return res.status(404).json({ error: "No challenges found" });
      }
      res.json(parseCodingChallenge(row));
    } catch (error) {
      console.error("Error fetching random challenge:", error);
      res.status(500).json({ error: "Failed to fetch random challenge" });
    }
  });

  // Get coding challenge stats
  app.get("/api/coding/stats", async (_req, res) => {
    try {
      const rows = await CRepo.getCodingStats();

      const stats = {
        total: 0,
        byDifficulty: { easy: 0, medium: 0 },
        byCategory: {} as Record<string, number>,
      };

      for (const row of rows) {
        const count = Number(row.count);
        stats.total += count;
        
        const diff = row.difficulty as string;
        if (diff === 'easy' || diff === 'medium') {
          stats.byDifficulty[diff] += count;
        }
        
        const cat = row.category as string;
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + count;
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching coding stats:", error);
      res.json({ total: 0, byDifficulty: { easy: 0, medium: 0 }, byCategory: {} });
    }
  });

  // ============================================
  // QUESTION HISTORY API
  // ============================================

  // Helper to parse history record from DB row
  function parseHistoryRecord(row: any) {
    return {
      id: row.id,
      questionId: row.question_id,
      questionType: row.question_type,
      eventType: row.event_type,
      eventSource: row.event_source,
      sourceName: row.source_name,
      changesSummary: row.changes_summary,
      changedFields: row.changed_fields ? JSON.parse(row.changed_fields) : [],
      beforeSnapshot: row.before_snapshot ? JSON.parse(row.before_snapshot) : null,
      afterSnapshot: row.after_snapshot ? JSON.parse(row.after_snapshot) : null,
      reason: row.reason,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
    };
  }

  // Get history for a specific question
  app.get("/api/history/:questionId", async (req, res) => {
    try {
      const { questionId } = req.params;
      const { type = 'question', limit = '50' } = req.query;
      const rows = await SRepo.getQuestionHistory(questionId, type as string, parseInt(limit as string));
      res.json(rows.map(parseHistoryRecord));
    } catch (error) {
      console.error("Error fetching question history:", error);
      res.json([]);
    }
  });

  // Get history summary (count of events) for a question
  app.get("/api/history/:questionId/summary", async (req, res) => {
    try {
      const { questionId } = req.params;
      const { type = 'question' } = req.query;
      const { counts, latest } = await SRepo.getHistoryById(questionId, type as string);
      const byType: Record<string, number> = {};
      let total = 0;
      for (const row of counts) {
        const count = Number(row.count);
        byType[row.event_type as string] = count;
        total += count;
      }
      res.json({ total, byType, latest: latest ? parseHistoryRecord(latest) : null });
    } catch (error) {
      console.error("Error fetching history summary:", error);
      res.json({ total: 0, byType: {}, latest: null });
    }
  });

  // Add a history record (for bots and system use)
  app.post("/api/history", async (req, res) => {
    try {
      const {
        questionId,
        questionType = 'question',
        eventType,
        eventSource,
        sourceName,
        changesSummary,
        changedFields,
        beforeSnapshot,
        afterSnapshot,
        reason,
        metadata
      } = req.body;

      if (!questionId || !eventType || !eventSource) {
        return res.status(400).json({ 
          error: "Missing required fields: questionId, eventType, eventSource" 
        });
      }

      const row = await SRepo.addHistoryRecord({
        questionId,
        questionType,
        eventType,
        eventSource,
        sourceName,
        changesSummary,
        changedFields: JSON.stringify(changedFields),
        beforeSnapshot: JSON.stringify(beforeSnapshot),
        afterSnapshot: JSON.stringify(afterSnapshot),
        reason,
        metadata: JSON.stringify(metadata),
        createdAt: new Date().toISOString(),
      });

      res.json({ success: true, id: row.id });
    } catch (error) {
      console.error("Error adding history record:", error);
      res.status(500).json({ error: "Failed to add history record" });
    }
  });

  // Get recent history across all questions (for admin/dashboard)
  app.get("/api/history", async (req, res) => {
    try {
      const { limit = '100', type, eventType, source } = req.query;
      const rows = await SRepo.getRecentHistory({ type, eventType, source, limit: parseInt(limit as string) });
      res.json(rows.map(parseHistoryRecord));
    } catch (error) {
      console.error("Error fetching history:", error);
      res.json([]);
    }
  });

  // ============================================
  // CERTIFICATIONS API
  // ============================================

  // Helper to parse certification from DB row
  function parseCertification(row: any) {
    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      description: row.description,
      icon: row.icon || 'award',
      color: row.color || 'text-primary',
      difficulty: row.difficulty,
      category: row.category,
      estimatedHours: row.estimated_hours || 40,
      examCode: row.exam_code,
      officialUrl: row.official_url,
      domains: row.domains ? JSON.parse(row.domains) : [],
      channelMappings: row.channel_mappings ? JSON.parse(row.channel_mappings) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites) : [],
      status: row.status || 'active',
      questionCount: row.question_count || 0,
      passingScore: row.passing_score || 70,
      examDuration: row.exam_duration || 90,
      createdAt: row.created_at,
      lastUpdated: row.last_updated,
    };
  }

  // Get all certifications
  app.get("/api/certifications", async (req, res) => {
    try {
      const { category, difficulty, provider, status } = req.query;
      const rows = await CRepo.getCertifications({ category: category as string, difficulty: difficulty as string, provider: provider as string, status: status as string });
      res.json(rows.map(parseCertification));
    } catch (error) {
      console.error("Error fetching certifications:", error);
      // Return empty array if table doesn't exist yet
      res.json([]);
    }
  });

  // Get a single certification by ID
  app.get("/api/certification/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const row = await CRepo.getCertificationById(id);
      if (!row) {
        return res.status(404).json({ error: "Certification not found" });
      }
      res.json(parseCertification(row));
    } catch (error) {
      console.error("Error fetching certification:", error);
      res.status(500).json({ error: "Failed to fetch certification" });
    }
  });

  // Get certification stats
  app.get("/api/certifications/stats", async (_req, res) => {
    try {
      const rows = await CRepo.getCertificationStats();

      const stats = {
        total: 0,
        totalQuestions: 0,
        byCategory: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
      };

      for (const row of rows) {
        const count = Number(row.count);
        const questions = Number(row.questions) || 0;
        stats.total += count;
        stats.totalQuestions += questions;
        
        const cat = row.category as string;
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + count;
        
        const diff = row.difficulty as string;
        stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + count;
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching certification stats:", error);
      res.json({ total: 0, totalQuestions: 0, byCategory: {}, byDifficulty: {} });
    }
  });

  // Get questions for a certification (by channel)
  app.get("/api/certification/:id/questions", async (req, res) => {
    try {
      const { id } = req.params;
      const { domain, difficulty, limit = '50' } = req.query;
      const rows = await CRepo.getCertificationQuestions(id, domain as string, difficulty as string, parseInt(limit as string));
      res.json(rows.map(parseQuestion));
    } catch (error) {
      console.error("Error fetching certification questions:", error);
      res.json([]);
    }
  });

  // Update certification question count (called after generating questions)
  app.post("/api/certification/:id/update-count", async (req, res) => {
    try {
      const { id } = req.params;
      const { questionCount } = await CRepo.updateCertificationQuestionCount(id);
      res.json({ success: true, questionCount });
    } catch (error) {
      console.error("Error updating certification count:", error);
      res.status(500).json({ error: "Failed to update count" });
    }
  });

  // ============================================
  // LEARNING PATHS API
  // ============================================

  // Helper to parse learning path from DB row
  function parseLearningPath(row: any) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      pathType: row.path_type,
      targetCompany: row.target_company,
      targetJobTitle: row.target_job_title,
      difficulty: row.difficulty,
      estimatedHours: row.estimated_hours,
      questionIds: row.question_ids ? JSON.parse(row.question_ids) : [],
      channels: row.channels ? JSON.parse(row.channels) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites) : [],
      learningObjectives: row.learning_objectives ? JSON.parse(row.learning_objectives) : [],
      milestones: row.milestones ? JSON.parse(row.milestones) : [],
      popularity: row.popularity || 0,
      completionRate: row.completion_rate || 0,
      averageRating: row.average_rating || 0,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      status: row.status,
      createdAt: row.created_at,
      lastUpdated: row.last_updated,
      lastGenerated: row.last_generated,
    };
  }

  // Get all learning paths with filters
  app.get("/api/learning-paths", async (req, res) => {
    try {
      const { pathType, difficulty, company, jobTitle, search, limit = '50', offset = '0' } = req.query;
      const rows = await SRepo.getLearningPaths({
        pathType, difficulty, company, jobTitle, search,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(rows.map(parseLearningPath));
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      res.json([]);
    }
  });

  // Get a single learning path by ID
  app.get("/api/learning-paths/:pathId", async (req, res) => {
    try {
      const { pathId } = req.params;
      const row = await SRepo.getLearningPathById(pathId);
      if (!row) {
        return res.status(404).json({ error: "Learning path not found" });
      }
      res.json(parseLearningPath(row));
    } catch (error) {
      console.error("Error fetching learning path:", error);
      res.status(500).json({ error: "Failed to fetch learning path" });
    }
  });

  // Get available companies (for filtering)
  app.get("/api/learning-paths/filters/companies", async (_req, res) => {
    try {
      const rows = await SRepo.getLearningPathCompanies();
      res.json(rows.map(r => r.target_company));
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.json([]);
    }
  });

  // Get available job titles (for filtering)
  app.get("/api/learning-paths/filters/job-titles", async (_req, res) => {
    try {
      const rows = await SRepo.getLearningPathJobTitles();
      res.json(rows.map(r => r.target_job_title));
    } catch (error) {
      console.error("Error fetching job titles:", error);
      res.json([]);
    }
  });

  // Get learning path stats
  app.get("/api/learning-paths/stats", async (_req, res) => {
    try {
      const rows = await SRepo.getLearningPathStats();

      const stats = {
        total: 0,
        byType: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
      };

      for (const row of rows) {
        const count = Number(row.count);
        stats.total += count;
        const type = row.path_type as string;
        stats.byType[type] = (stats.byType[type] || 0) + count;
        const diff = row.difficulty as string;
        stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + count;
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching learning path stats:", error);
      res.json({ total: 0, byType: {}, byDifficulty: {} });
    }
  });

  app.post("/api/learning-paths/:pathId/start", async (req, res) => {
    res.json({ success: true }); // popularity tracking removed with DB layer
  });

  // ============================================
  // USER SESSION ENDPOINTS (for resume feature)
  // ============================================

  // Get all active sessions for a user
  app.get("/api/user/sessions", async (_req, res) => {
    try {
      const rows = await SRepo.getUserSessions('');
      res.json(rows);
    } catch { res.status(500).json({ error: "Failed to fetch sessions" }); }
  });

  app.get("/api/user/sessions/:sessionId", async (req, res) => {
    try {
      const rows = await SRepo.getUserSessions(req.params.sessionId);
      if (!rows.length) return res.status(404).json({ error: "Session not found" });
      res.json(rows[0]);
    } catch { res.status(500).json({ error: "Failed to fetch session" }); }
  });

  app.post("/api/user/sessions", async (req, res) => {
    try {
      const result = await SRepo.upsertUserSession(req.body);
      res.json(result[0]);
    } catch { res.status(500).json({ error: "Failed to save session" }); }
  });

  app.put("/api/user/sessions/:sessionId", async (req, res) => {
    try {
      await SRepo.upsertUserSession({ ...req.body, id: req.params.sessionId });
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to update session" }); }
  });

  app.delete("/api/user/sessions/:sessionId", async (req, res) => {
    try {
      await SRepo.deleteUserSession(req.params.sessionId);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete session" }); }
  });

  app.post("/api/user/sessions/:sessionId/complete", async (req, res) => {
    try {
      await SRepo.upsertUserSession({ id: req.params.sessionId, status: 'completed', completedAt: new Date().toISOString() });
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to complete session" }); }
  });

  // ============================================================
  // FLASHCARDS API
  // ============================================================

  app.get("/api/flashcards", async (req, res) => {
    try {
      const { channel, limit = "50", offset = "0" } = req.query as Record<string, string>;
      let cards: any[] = [];
      try { cards = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'flashcards', 'all.json'), 'utf8')); } catch {}
      if (channel) cards = cards.filter((c: any) => c.channel === channel);
      res.json(cards.slice(parseInt(offset), parseInt(offset) + parseInt(limit)));
    } catch { res.status(500).json({ error: "Failed to fetch flashcards" }); }
  });

  app.get("/api/flashcards/:id", async (req, res) => {
    try {
      let cards: any[] = [];
      try { cards = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'flashcards', 'all.json'), 'utf8')); } catch {}
      const card = cards.find((c: any) => c.id === req.params.id);
      if (!card) return res.status(404).json({ error: "Flashcard not found" });
      res.json(card);
    } catch { res.status(500).json({ error: "Failed to fetch flashcard" }); }
  });

  app.get("/api/flashcards/question/:questionId", async (req, res) => {
    try {
      let cards: any[] = [];
      try { cards = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'flashcards', 'all.json'), 'utf8')); } catch {}
      res.json(cards.find((c: any) => c.questionId === req.params.questionId) || null);
    } catch { res.status(500).json({ error: "Failed to fetch flashcard" }); }
  });

  // ============================================================
  // VOICE SESSIONS API
  // ============================================================

  app.get("/api/voice-sessions", async (req, res) => {
    try {
      const { channel, difficulty } = req.query as Record<string, string>;
      let sessions = SRepo.getVoiceSessions();
      if (channel) sessions = sessions.filter((s: any) => s.channel === channel);
      if (difficulty) sessions = sessions.filter((s: any) => s.difficulty === difficulty);
      res.json(sessions.map((s: any) => ({ ...s, questionIds: typeof s.questionIds === 'string' ? JSON.parse(s.questionIds) : s.questionIds })));
    } catch { res.status(500).json({ error: "Failed to fetch voice sessions" }); }
  });

  app.get("/api/voice-sessions/:id", async (req, res) => {
    try {
      const sessions = SRepo.getVoiceSessions();
      const s = sessions.find((s: any) => s.id === req.params.id);
      if (!s) return res.status(404).json({ error: "Voice session not found" });
      res.json({ ...s, questionIds: typeof s.questionIds === 'string' ? JSON.parse(s.questionIds) : s.questionIds });
    } catch { res.status(500).json({ error: "Failed to fetch voice session" }); }
  });

  // ============================================================
  // TESTS API
  // ============================================================

  app.get("/api/tests", async (req, res) => {
    try {
      const { channelId } = req.query as Record<string, string>;
      const testsDir = path.join(DATA_DIR, 'tests');
      let allTests: any[] = [];
      if (fs.existsSync(testsDir)) {
        for (const f of fs.readdirSync(testsDir).filter(f => f.endsWith('.json'))) {
          try { allTests = allTests.concat(JSON.parse(fs.readFileSync(path.join(testsDir, f), 'utf8'))); } catch {}
        }
      }
      if (channelId) allTests = allTests.filter((t: any) => t.channelId === channelId);
      res.json(allTests.map((t: any) => ({ id: t.id, channelId: t.channelId, channelName: t.channelName, title: t.title, description: t.description, passingScore: t.passingScore, version: t.version, createdAt: t.createdAt, lastUpdated: t.lastUpdated })));
    } catch { res.status(500).json({ error: "Failed to fetch tests" }); }
  });

  app.get("/api/tests/:id", async (req, res) => {
    try {
      const testsDir = path.join(DATA_DIR, 'tests');
      let found: any = null;
      if (fs.existsSync(testsDir)) {
        for (const f of fs.readdirSync(testsDir).filter(f => f.endsWith('.json'))) {
          try {
            const items = JSON.parse(fs.readFileSync(path.join(testsDir, f), 'utf8'));
            found = items.find((t: any) => t.id === req.params.id);
            if (found) break;
          } catch {}
        }
      }
      if (!found) return res.status(404).json({ error: "Test not found" });
      res.json({ ...found, questions: typeof found.questions === 'string' ? JSON.parse(found.questions) : found.questions });
    } catch { res.status(500).json({ error: "Failed to fetch test" }); }
  });

  // ── Blog API Routes ────────────────────────────────────────────────────────

  // Health check endpoint
  app.get("/api/blog/health", async (_req, res) => {
    try {
      const posts = await blogStorage.getAllPosts();
      res.json({
        status: posts.length > 0 ? "healthy" : "degraded",
        postCount: posts.length,
        source: "json",
      });
    } catch (error) {
      console.error("Blog health check failed:", error);
      res.json({
        status: "degraded",
        postCount: 0,
        source: "json",
        error: "Failed to load blog data",
      });
    }
  });

  app.get("/api/blog/posts", async (req, res) => {
    try {
      const { category, tag, limit, offset, page } = req.query as Record<string, string>;
      const pageSize = parseInt(limit) || 12;
      const pageNum = parseInt(page) || 1;
      const off = parseInt(offset) || (pageNum - 1) * pageSize;
      const all = await blogStorage.getAllPosts({ category, tag });
      const data = all.slice(off, off + pageSize);
      res.json({ data, meta: { total: all.length, page: pageNum, pageSize, totalPages: Math.ceil(all.length / pageSize) } });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/blog/posts/featured", async (_req, res) => {
    try {
      res.json({ data: await blogStorage.getFeaturedPosts(3) });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured posts" });
    }
  });

  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const post = await blogStorage.getPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post not found" });
      const related = blogStorage.getRelatedPosts(post.id, 3);
      const allPosts = blogStorage.getAllPosts();
      const currentIndex = allPosts.findIndex(p => p.slug === req.params.slug);
      const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
      const next = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
      res.json({ data: post, related, prev, next });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.get("/api/blog/categories", async (_req, res) => {
    try {
      res.json({ data: await blogStorage.getAllCategories() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/blog/tags", async (_req, res) => {
    try {
      res.json({ data: await blogStorage.getAllTags() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.get("/api/blog/search", async (req, res) => {
    try {
      const { q } = req.query as { q?: string };
      if (!q || q.trim().length < 2) return res.json({ data: [] });
      res.json({ data: await blogStorage.searchPosts(q.trim()) });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // ── Admin Blog API Routes ─────────────────────────────────────────────────
  // NOTE: These routes are unprotected and should be secured in production
  // with authentication/authorization middleware (e.g., session check, admin role)

  app.get("/api/admin/blog", async (_req, res) => {
    try {
      const posts = await blogStorage.getAdminPosts();
      res.json(posts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        channel: p.category,
        status: p.status || "published",
        linkedinSharedAt: (p as any).linkedinSharedAt || null,
        publishedAt: p.publishedAt,
        createdAt: p.publishedAt,
      })));
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.patch("/api/admin/blog/:id/linkedin", async (req, res) => {
    try {
      const { id } = req.params;
      const { linkedinPostId, sharedAt } = req.body;

      if (!sharedAt) {
        return res.status(400).json({ error: "sharedAt is required" });
      }

      await blogStorage.updateLinkedInInfo(id, linkedinPostId || null, sharedAt);

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating blog post linkedin info:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });

  app.get("/api/admin/linkedin-log", async (_req, res) => {
    res.json([]); // LinkedIn publish log removed with DB layer
  });

  // ── Art Studio: image proxy for cross-origin downloads ───────────────────
  app.get("/api/generate/download", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith("https://image.pollinations.ai/")) {
        return res.status(400).json({ error: "Invalid URL" });
      }
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(502).json({ error: "Upstream fetch failed" });
      }
      const contentType = response.headers.get("content-type") || "image/png";
      res.set("Content-Type", contentType);
      res.set("Content-Disposition", `attachment; filename="artwork.png"`);
      res.set("Cache-Control", "public, max-age=86400");
      const buf = Buffer.from(await response.arrayBuffer());
      res.send(buf);
    } catch (error) {
      console.error("Art Studio proxy error:", error);
      res.status(500).json({ error: "Proxy failed" });
    }
  });

  return httpServer;
}
