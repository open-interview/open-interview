import type { Express } from "express";
import { type Server } from "http";
import * as QRepo from './repositories/questions';
import * as CRepo from './repositories/certifications';
import * as SRepo from './repositories/sessions';
import { db } from './db';
import { learningPaths, userSessions, flashcards, voiceSessions, tests } from '@shared/schema';
import { eq, sql, desc, asc, and, ne, like } from 'drizzle-orm';

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

  // Increment popularity when user starts a path
  app.post("/api/learning-paths/:pathId/start", async (req, res) => {
    try {
      const { pathId } = req.params;
      await db.update(learningPaths).set({ popularity: sql`popularity + 1` }).where(eq(learningPaths.id, pathId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating path popularity:", error);
      res.status(500).json({ error: "Failed to update popularity" });
    }
  });

  // ============================================
  // USER SESSION ENDPOINTS (for resume feature)
  // ============================================

  // Get all active sessions for a user
  app.get("/api/user/sessions", async (_req, res) => {
    try {
      const rows = await db.select().from(userSessions).where(eq(userSessions.status, 'active')).orderBy(desc(userSessions.lastAccessedAt));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Get a specific session
  app.get("/api/user/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const rows = await db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Create or update a session
  app.post("/api/user/sessions", async (req, res) => {
    try {
      const {
        sessionKey,
        sessionType,
        title,
        subtitle,
        channelId,
        certificationId,
        progress,
        totalItems,
        completedItems,
        sessionData
      } = req.body;

      // Check if session already exists
      const existing = await db.select({ id: userSessions.id }).from(userSessions).where(and(eq(userSessions.sessionKey, sessionKey), eq(userSessions.status, 'active'))).limit(1);

      if (existing.length > 0) {
        // Update existing session
        const sessionId = existing[0].id;
        await db.update(userSessions).set({ title, subtitle, progress, completedItems, sessionData: JSON.stringify(sessionData), lastAccessedAt: new Date().toISOString() }).where(eq(userSessions.id, sessionId));
        res.json({ id: sessionId, updated: true });
      } else {
        // Create new session
        const sessionId = crypto.randomUUID();
        await db.insert(userSessions).values({
          id: sessionId,
          sessionKey,
          sessionType,
          title,
          subtitle: subtitle || null,
          channelId: channelId || null,
          certificationId: certificationId || null,
          progress,
          totalItems,
          completedItems,
          sessionData: JSON.stringify(sessionData),
          startedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          status: 'active',
        });
        res.json({ id: sessionId, created: true });
      }
    } catch (error) {
      console.error("Error saving session:", error);
      res.status(500).json({ error: "Failed to save session" });
    }
  });

  // Update session progress
  app.put("/api/user/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { progress, completedItems, sessionData } = req.body;

      await db.update(userSessions).set({ progress, completedItems, sessionData: JSON.stringify(sessionData), lastAccessedAt: new Date().toISOString() }).where(eq(userSessions.id, sessionId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Delete/abandon a session
  app.delete("/api/user/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await db.update(userSessions).set({ status: 'abandoned' }).where(eq(userSessions.id, sessionId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Complete a session
  app.post("/api/user/sessions/:sessionId/complete", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await db.update(userSessions).set({ status: 'completed', completedAt: new Date().toISOString() }).where(eq(userSessions.id, sessionId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ error: "Failed to complete session" });
    }
  });

  // ============================================================
  // FLASHCARDS API
  // ============================================================

  app.get("/api/flashcards", async (req, res) => {
    try {
      const { channel, limit = "50", offset = "0" } = req.query as Record<string, string>;
      const query = db.select().from(flashcards);
      const rows = await (channel
        ? query.where(eq(flashcards.channel, channel))
        : query
      ).orderBy(desc(flashcards.createdAt)).limit(parseInt(limit)).offset(parseInt(offset));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.get("/api/flashcards/:id", async (req, res) => {
    try {
      const rows = await db.select().from(flashcards).where(eq(flashcards.id, req.params.id)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Flashcard not found" });
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcard" });
    }
  });

  app.get("/api/flashcards/question/:questionId", async (req, res) => {
    try {
      const rows = await db.select().from(flashcards).where(eq(flashcards.questionId, req.params.questionId)).limit(1);
      res.json(rows[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcard" });
    }
  });

  // ============================================================
  // VOICE SESSIONS API
  // ============================================================

  app.get("/api/voice-sessions", async (req, res) => {
    try {
      const { channel, difficulty } = req.query as Record<string, string>;
      const conditions = [];
      if (channel) conditions.push(eq(voiceSessions.channel, channel));
      if (difficulty) conditions.push(eq(voiceSessions.difficulty, difficulty));
      const rows = await (conditions.length
        ? db.select().from(voiceSessions).where(and(...conditions))
        : db.select().from(voiceSessions)
      ).orderBy(desc(voiceSessions.lastUpdated));
      res.json(rows.map(r => ({ ...r, questionIds: r.questionIds ? JSON.parse(r.questionIds as string) : [] })));
    } catch (error) {
      console.error("Error fetching voice sessions:", error);
      res.status(500).json({ error: "Failed to fetch voice sessions" });
    }
  });

  app.get("/api/voice-sessions/:id", async (req, res) => {
    try {
      const rows = await db.select().from(voiceSessions).where(eq(voiceSessions.id, req.params.id)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Voice session not found" });
      const row = rows[0];
      res.json({ ...row, questionIds: row.questionIds ? JSON.parse(row.questionIds as string) : [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice session" });
    }
  });

  // ============================================================
  // TESTS API
  // ============================================================

  app.get("/api/tests", async (req, res) => {
    try {
      const { channelId } = req.query as Record<string, string>;
      const query = db.select({ id: tests.id, channelId: tests.channelId, channelName: tests.channelName, title: tests.title, description: tests.description, passingScore: tests.passingScore, version: tests.version, createdAt: tests.createdAt, lastUpdated: tests.lastUpdated }).from(tests);
      const rows = await (channelId
        ? query.where(eq(tests.channelId, channelId))
        : query
      ).orderBy(asc(tests.channelName));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", async (req, res) => {
    try {
      const rows = await db.select().from(tests).where(eq(tests.id, req.params.id)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Test not found" });
      const row = rows[0];
      res.json({ ...row, questions: row.questions ? JSON.parse(row.questions as string) : [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  // ── Blog API Routes ────────────────────────────────────────────────────────
  const { blogStorage } = await import("./blog-storage");

  app.get("/api/blog/posts", (req, res) => {
    try {
      const { category, tag, limit, offset, page } = req.query as Record<string, string>;
      const pageSize = limit ? parseInt(limit) : 12;
      const pageNum = page ? parseInt(page) : 1;
      const off = offset ? parseInt(offset) : (pageNum - 1) * pageSize;
      const all = blogStorage.getAllPosts({ category, tag });
      const data = all.slice(off, off + pageSize);
      res.json({ data, meta: { total: all.length, page: pageNum, pageSize, totalPages: Math.ceil(all.length / pageSize) } });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/blog/posts/featured", (_req, res) => {
    try {
      res.json({ data: blogStorage.getFeaturedPosts(3) });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured posts" });
    }
  });

  app.get("/api/blog/posts/:slug", (req, res) => {
    try {
      const post = blogStorage.getPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post not found" });
      const related = blogStorage.getRelatedPosts(post.id, 3);
      res.json({ data: post, related });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.get("/api/blog/categories", (_req, res) => {
    try {
      res.json({ data: blogStorage.getAllCategories() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/blog/tags", (_req, res) => {
    try {
      res.json({ data: blogStorage.getAllTags() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.get("/api/blog/search", (req, res) => {
    try {
      const { q } = req.query as { q?: string };
      if (!q || q.trim().length < 2) return res.json({ data: [] });
      res.json({ data: blogStorage.searchPosts(q.trim()) });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  return httpServer;
}
