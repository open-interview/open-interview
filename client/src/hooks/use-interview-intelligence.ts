/**
 * Interview Intelligence Hook
 * 
 * Client-side intelligence system that:
 * - Analyzes cognitive patterns (HOW you think, not just what you know)
 * - Predicts company-specific interview readiness
 * - Generates personalized mock interview paths
 * - Creates a portable "Knowledge DNA" profile
 * 
 * Uses pre-computed JSON data (static site compatible) + localStorage for user state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '../services/storage.service';
import { useAdaptiveLearning } from './use-adaptive-learning';

// ============================================
// TYPES
// ============================================

export interface CognitivePattern {
  name: string;
  description: string;
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
}

export interface CompanyReadiness {
  companyId: string;
  companyName: string;
  readinessScore: number; // 0-100
  strengths: string[];
  gaps: string[];
  recommendedFocus: string[];
  interviewStyle: string;
}


export interface KnowledgeDNA {
  userId: string;
  generated: string;
  cognitiveProfile: Record<string, number>;
  primaryPattern: string;
  channelMastery: Record<string, number>;
  topSkills: string[];
  companyFit: Record<string, number>;
  totalQuestionsAnswered: number;
  uniqueTopics: number;
}

export interface MockInterviewRound {
  name: string;
  questionIds: string[];
  difficulty: string;
  duration: string;
}

export interface MockInterview {
  companyId: string;
  companyName: string;
  rounds: MockInterviewRound[];
  estimatedDuration: string;
  tips: string[];
}

interface IntelligenceData {
  cognitiveMap: Record<string, { patterns: Record<string, number>; primaryPattern: string }>;
  companyWeights: Record<string, Record<string, number>>;
  companyProfiles: Record<string, {
    name: string;
    values: string[];
    cognitiveEmphasis: string[];
    interviewStyle: string;
    weight: Record<string, number>;
  }>;
  knowledgeDNA: {
    channels: Record<string, { total: number; skills: string[] }>;
    topSkills: { skill: string; count: number }[];
  };
  mockInterviews: Record<string, {
    company: string;
    style: string;
    rounds: Record<string, string[]>;
  }>;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'interview-intelligence-state';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache for JSON data


// ============================================
// DATA FETCHING
// ============================================

let intelligenceCache: IntelligenceData | null = null;
let cacheTimestamp = 0;

async function fetchIntelligenceData(): Promise<IntelligenceData | null> {
  // Return cached data if fresh
  if (intelligenceCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return intelligenceCache;
  }
  
  try {
    const [cognitiveRes, weightsRes, profilesRes, dnaRes, interviewsRes] = await Promise.all([
      fetch('/data/intelligence/cognitive-map.json'),
      fetch('/data/intelligence/company-weights.json'),
      fetch('/data/intelligence/company-profiles.json'),
      fetch('/data/intelligence/knowledge-dna.json'),
      fetch('/data/intelligence/mock-interviews.json')
    ]);
    
    if (!cognitiveRes.ok || !weightsRes.ok || !profilesRes.ok) {
      console.warn('Intelligence data not available yet');
      return null;
    }
    
    const [cognitive, weights, profiles, dna, interviews] = await Promise.all([
      cognitiveRes.json(),
      weightsRes.json(),
      profilesRes.json(),
      dnaRes.json(),
      interviewsRes.json()
    ]);
    
    intelligenceCache = {
      cognitiveMap: cognitive.data,
      companyWeights: weights.data,
      companyProfiles: profiles.data,
      knowledgeDNA: dna.data,
      mockInterviews: interviews.data
    };
    cacheTimestamp = Date.now();
    
    return intelligenceCache;
  } catch {
    console.warn('Failed to fetch intelligence data');
    return null;
  }
}


// ============================================
// MAIN HOOK
// ============================================

export function useInterviewIntelligence() {
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { answerHistory, topicMastery, stats } = useAdaptiveLearning();
  
  // Load intelligence data on mount
  useEffect(() => {
    fetchIntelligenceData().then(data => {
      setIntelligenceData(data);
      setLoading(false);
    });
  }, []);
  
  // Calculate user's cognitive profile based on answered questions
  const cognitiveProfile = useMemo((): Record<string, CognitivePattern> => {
    if (!intelligenceData || answerHistory.length === 0) {
      return getDefaultCognitiveProfile();
    }
    
    const patternScores: Record<string, { correct: number; total: number }> = {
      analytical: { correct: 0, total: 0 },
      intuitive: { correct: 0, total: 0 },
      systematic: { correct: 0, total: 0 },
      pragmatic: { correct: 0, total: 0 }
    };
    
    // Aggregate cognitive patterns from answered questions
    for (const answer of answerHistory) {
      const questionCognitive = intelligenceData.cognitiveMap[answer.questionId];
      if (!questionCognitive) continue;
      
      for (const [pattern, weight] of Object.entries(questionCognitive.patterns)) {
        if (patternScores[pattern]) {
          patternScores[pattern].total += weight;
          if (answer.correct) {
            patternScores[pattern].correct += weight;
          }
        }
      }
    }
    
    // Convert to profile with scores
    const profiles: Record<string, CognitivePattern> = {};
    const patternMeta: Record<string, { name: string; desc: string; strengths: string[]; weaknesses: string[] }> = {
      analytical: {
        name: 'Analytical Thinker',
        desc: 'You excel at breaking down problems systematically',
        strengths: ['Algorithm optimization', 'Edge case handling', 'Complexity analysis'],
        weaknesses: ['May over-analyze simple problems', 'Speed under pressure']
      },
      intuitive: {
        name: 'Intuitive Problem Solver',
        desc: 'You quickly recognize patterns and jump to solutions',
        strengths: ['Pattern recognition', 'Quick solutions', 'Creative approaches'],
        weaknesses: ['May miss edge cases', 'Formal proofs']
      },
      systematic: {
        name: 'Systematic Builder',
        desc: 'You build comprehensive, well-thought-out solutions',
        strengths: ['System design', 'Reliability', 'Documentation'],
        weaknesses: ['May over-engineer', 'Speed']
      },
      pragmatic: {
        name: 'Pragmatic Engineer',
        desc: 'You focus on working solutions with good trade-offs',
        strengths: ['Delivery', 'Real-world solutions', 'Communication'],
        weaknesses: ['Deep optimization', 'Theoretical problems']
      }
    };
    
    for (const [pattern, scores] of Object.entries(patternScores)) {
      const meta = patternMeta[pattern];
      const score = scores.total > 0 
        ? Math.round((scores.correct / scores.total) * 100)
        : 50;
      
      profiles[pattern] = {
        name: meta.name,
        description: meta.desc,
        score,
        strengths: meta.strengths,
        weaknesses: meta.weaknesses
      };
    }
    
    return profiles;
  }, [intelligenceData, answerHistory]);


  // Calculate company readiness scores
  const companyReadiness = useMemo((): CompanyReadiness[] => {
    if (!intelligenceData || answerHistory.length === 0) {
      return getDefaultCompanyReadiness(intelligenceData);
    }
    
    const readiness: CompanyReadiness[] = [];
    
    for (const [companyId, profile] of Object.entries(intelligenceData.companyProfiles)) {
      let totalWeight = 0;
      let earnedWeight = 0;
      const strengths: string[] = [];
      const gaps: string[] = [];
      
      // Calculate weighted score based on answered questions
      for (const answer of answerHistory) {
        const weight = intelligenceData.companyWeights[answer.questionId]?.[companyId] || 1;
        totalWeight += weight;
        if (answer.correct) {
          earnedWeight += weight;
        }
      }
      
      const score = totalWeight > 0 
        ? Math.round((earnedWeight / totalWeight) * 100)
        : 0;
      
      // Identify strengths and gaps from topic mastery
      for (const [topic, mastery] of Object.entries(topicMastery)) {
        const topicWeight = profile.weight[topic] || 1;
        if (topicWeight > 1 && mastery.mastery >= 70) {
          strengths.push(topic);
        } else if (topicWeight > 1 && mastery.mastery < 50) {
          gaps.push(topic);
        }
      }
      
      // Recommend focus areas
      const recommendedFocus = profile.values
        .filter(v => !strengths.includes(v))
        .slice(0, 3);
      
      readiness.push({
        companyId,
        companyName: profile.name,
        readinessScore: score,
        strengths,
        gaps,
        recommendedFocus,
        interviewStyle: profile.interviewStyle
      });
    }
    
    return readiness.sort((a, b) => b.readinessScore - a.readinessScore);
  }, [intelligenceData, answerHistory, topicMastery]);


  // Generate Knowledge DNA
  const knowledgeDNA = useMemo((): KnowledgeDNA | null => {
    if (answerHistory.length < 5) return null;
    
    // Find primary cognitive pattern
    const patternScores = Object.entries(cognitiveProfile)
      .map(([id, p]) => ({ id, score: p.score }))
      .sort((a, b) => b.score - a.score);
    
    const primaryPattern = patternScores[0]?.id || 'analytical';
    
    // Channel mastery
    const channelMastery: Record<string, number> = {};
    for (const [topic, mastery] of Object.entries(topicMastery)) {
      channelMastery[topic] = mastery.mastery;
    }
    
    // Top skills (from tags in answer history)
    const skillCounts: Record<string, number> = {};
    for (const answer of answerHistory) {
      if (answer.correct) {
        for (const tag of answer.tags) {
          skillCounts[tag] = (skillCounts[tag] || 0) + 1;
        }
      }
    }
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);
    
    // Company fit scores
    const companyFit: Record<string, number> = {};
    for (const company of companyReadiness) {
      companyFit[company.companyId] = company.readinessScore;
    }
    
    return {
      userId: 'local-user',
      generated: new Date().toISOString(),
      cognitiveProfile: Object.fromEntries(
        Object.entries(cognitiveProfile).map(([k, v]) => [k, v.score])
      ),
      primaryPattern,
      channelMastery,
      topSkills,
      companyFit,
      totalQuestionsAnswered: answerHistory.length,
      uniqueTopics: Object.keys(topicMastery).length
    };
  }, [answerHistory, cognitiveProfile, topicMastery, companyReadiness]);


  // Get mock interview for a company
  const getMockInterview = useCallback((companyId: string): MockInterview | null => {
    if (!intelligenceData) return null;
    
    const interview = intelligenceData.mockInterviews[companyId];
    const profile = intelligenceData.companyProfiles[companyId];
    if (!interview || !profile) return null;
    
    const rounds: MockInterviewRound[] = [
      {
        name: 'Phone Screen',
        questionIds: interview.rounds.phone || [],
        difficulty: 'Easy-Medium',
        duration: '45 min'
      },
      {
        name: 'Technical Round 1',
        questionIds: interview.rounds.onsite1 || [],
        difficulty: 'Medium',
        duration: '60 min'
      },
      {
        name: 'Technical Round 2',
        questionIds: interview.rounds.onsite2 || [],
        difficulty: 'Medium-Hard',
        duration: '60 min'
      },
      {
        name: 'System Design',
        questionIds: interview.rounds.systemDesign || [],
        difficulty: 'Hard',
        duration: '45 min'
      }
    ].filter(r => r.questionIds.length > 0);
    
    const tips = getTipsForCompany(companyId, profile);
    
    return {
      companyId,
      companyName: profile.name,
      rounds,
      estimatedDuration: `${rounds.length * 45}-${rounds.length * 60} min`,
      tips
    };
  }, [intelligenceData]);
  
  // Export Knowledge DNA as JSON
  const exportKnowledgeDNA = useCallback(() => {
    if (!knowledgeDNA) return null;
    
    const blob = new Blob([JSON.stringify(knowledgeDNA, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-dna-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return knowledgeDNA;
  }, [knowledgeDNA]);

  return {
    loading,
    cognitiveProfile,
    companyReadiness,
    knowledgeDNA,
    getMockInterview,
    exportKnowledgeDNA,
    stats,
    hasEnoughData: answerHistory.length >= 5
  };
}


// ============================================
// HELPER FUNCTIONS
// ============================================

function getDefaultCognitiveProfile(): Record<string, CognitivePattern> {
  return {
    analytical: {
      name: 'Analytical Thinker',
      description: 'Practice more to discover your analytical thinking style',
      score: 50,
      strengths: ['Algorithm optimization', 'Edge case handling'],
      weaknesses: ['Speed under pressure']
    },
    intuitive: {
      name: 'Intuitive Problem Solver',
      description: 'Practice more to discover your intuitive problem-solving style',
      score: 50,
      strengths: ['Pattern recognition', 'Quick solutions'],
      weaknesses: ['May miss edge cases']
    },
    systematic: {
      name: 'Systematic Builder',
      description: 'Practice more to discover your systematic building style',
      score: 50,
      strengths: ['System design', 'Reliability'],
      weaknesses: ['May over-engineer']
    },
    pragmatic: {
      name: 'Pragmatic Engineer',
      description: 'Practice more to discover your pragmatic engineering style',
      score: 50,
      strengths: ['Delivery', 'Real-world solutions'],
      weaknesses: ['Deep optimization']
    }
  };
}

function getDefaultCompanyReadiness(data: IntelligenceData | null): CompanyReadiness[] {
  const companies = data?.companyProfiles || {
    google: { name: 'Google', interviewStyle: 'whiteboard-heavy', values: [] },
    meta: { name: 'Meta', interviewStyle: 'balanced', values: [] },
    amazon: { name: 'Amazon', interviewStyle: 'behavioral-heavy', values: [] },
    microsoft: { name: 'Microsoft', interviewStyle: 'conversational', values: [] },
    apple: { name: 'Apple', interviewStyle: 'detail-oriented', values: [] },
    startup: { name: 'Startups', interviewStyle: 'practical', values: [] }
  };
  
  return Object.entries(companies).map(([id, profile]) => ({
    companyId: id,
    companyName: profile.name,
    readinessScore: 0,
    strengths: [],
    gaps: [],
    recommendedFocus: profile.values?.slice(0, 3) || [],
    interviewStyle: profile.interviewStyle
  }));
}

function getTipsForCompany(companyId: string, profile: { cognitiveEmphasis: string[]; interviewStyle: string }): string[] {
  const tips: string[] = [];
  
  if (profile.interviewStyle === 'whiteboard-heavy') {
    tips.push('Practice coding on a whiteboard or without IDE autocomplete');
    tips.push('Think out loud and explain your reasoning');
  }
  if (profile.interviewStyle === 'behavioral-heavy') {
    tips.push('Prepare STAR format stories for leadership principles');
    tips.push('Have specific examples ready for each principle');
  }
  if (profile.cognitiveEmphasis.includes('optimization')) {
    tips.push('Always discuss time and space complexity');
    tips.push('Be ready to optimize your initial solution');
  }
  if (profile.cognitiveEmphasis.includes('trade-offs')) {
    tips.push('Discuss trade-offs proactively');
    tips.push('Consider scalability and maintainability');
  }
  
  return tips.slice(0, 4);
}

export default useInterviewIntelligence;
