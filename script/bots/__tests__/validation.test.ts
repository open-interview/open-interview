/**
 * Unit tests for script/bots/shared/validation.js
 */
import { describe, it, expect } from 'vitest';
import { validateBeforeInsert, sanitizeQuestion, VALIDATION_RULES } from '../shared/validation.js';

const validQuestion = {
  question: 'What is the difference between TCP and UDP protocols in networking?',
  answer: 'TCP (Transmission Control Protocol) is connection-oriented and guarantees delivery. UDP (User Datagram Protocol) is connectionless and faster but does not guarantee delivery.',
  explanation: 'TCP establishes a connection via a three-way handshake before data transfer. It ensures reliable, ordered delivery with error checking and retransmission. UDP skips the handshake and sends packets without confirmation, making it suitable for real-time applications like video streaming where speed matters more than reliability.',
  channel: 'networking',
  subChannel: 'protocols',
  difficulty: 'intermediate',
  tags: ['tcp', 'udp', 'networking', 'protocols'],
};

describe('validateBeforeInsert', () => {
  it('accepts a valid question', () => {
    expect(() => validateBeforeInsert(validQuestion, 'test')).not.toThrow();
  });

  it('rejects questions with JSON in answer field', () => {
    const q = { ...validQuestion, answer: '[{"id":1,"text":"option","isCorrect":true}]' };
    expect(() => validateBeforeInsert(q, 'test')).toThrow();
  });

  it('rejects questions with forbidden placeholder content', () => {
    const q = { ...validQuestion, answer: 'TODO: fill this in later with actual content about the topic' };
    expect(() => validateBeforeInsert(q, 'test')).toThrow();
  });

  it('rejects questions with answer that is too short', () => {
    const q = { ...validQuestion, answer: 'Short.' };
    expect(() => validateBeforeInsert(q, 'test')).toThrow();
  });

  it('rejects questions with question text that is too short', () => {
    const q = { ...validQuestion, question: 'What?' };
    expect(() => validateBeforeInsert(q, 'test')).toThrow();
  });
});

describe('sanitizeQuestion', () => {
  it('returns a copy of the question object', () => {
    const result = sanitizeQuestion(validQuestion);
    expect(result).toBeDefined();
    expect(result.question).toBe(validQuestion.question);
  });

  it('extracts plain text from JSON multiple-choice answer', () => {
    const q = { ...validQuestion, answer: '[{"id":1,"text":"TCP is reliable","isCorrect":true},{"id":2,"text":"UDP is reliable","isCorrect":false}]' };
    const result = sanitizeQuestion(q);
    expect(result.answer).toBe('TCP is reliable');
    expect(result._sanitized).toBe(true);
  });
});

describe('VALIDATION_RULES', () => {
  it('exports VALIDATION_RULES with expected shape', () => {
    expect(VALIDATION_RULES).toBeDefined();
    expect(VALIDATION_RULES.question.minLength).toBeGreaterThan(0);
    expect(VALIDATION_RULES.answer.minLength).toBeGreaterThan(0);
  });
});
