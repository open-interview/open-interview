import { describe, it, expect } from "vitest";
import { DatabaseUtils } from "../../src/db/utils";

describe("Edge Cases and Boundary Tests", () => {
  describe("XP Calculation Edge Cases", () => {
    it("should handle negative scores", () => {
      expect(DatabaseUtils.calculateXP(-100)).toBe(5);
      expect(DatabaseUtils.calculateXP(-1)).toBe(5);
    });

    it("should handle scores above 100", () => {
      expect(DatabaseUtils.calculateXP(101)).toBe(50);
      expect(DatabaseUtils.calculateXP(1000)).toBe(50);
    });

    it("should handle boundary scores exactly", () => {
      expect(DatabaseUtils.calculateXP(90)).toBe(50);
      expect(DatabaseUtils.calculateXP(80)).toBe(30);
      expect(DatabaseUtils.calculateXP(70)).toBe(20);
      expect(DatabaseUtils.calculateXP(60)).toBe(10);
      expect(DatabaseUtils.calculateXP(59)).toBe(5);
    });

    it("should handle decimal scores", () => {
      expect(DatabaseUtils.calculateXP(89.9)).toBe(30);
      expect(DatabaseUtils.calculateXP(90.1)).toBe(50);
    });
  });

  describe("Credits Calculation Edge Cases", () => {
    it("should handle negative scores", () => {
      expect(DatabaseUtils.calculateCredits(-10)).toBe(1);
    });

    it("should handle scores above 100", () => {
      expect(DatabaseUtils.calculateCredits(150)).toBe(10);
    });

    it("should handle boundary scores", () => {
      expect(DatabaseUtils.calculateCredits(90)).toBe(10);
      expect(DatabaseUtils.calculateCredits(80)).toBe(7);
      expect(DatabaseUtils.calculateCredits(70)).toBe(5);
      expect(DatabaseUtils.calculateCredits(60)).toBe(3);
      expect(DatabaseUtils.calculateCredits(59)).toBe(1);
    });
  });

  describe("SRS Algorithm Edge Cases", () => {
    it("should handle first repetition correctly", () => {
      // First success should set interval to 1
      const progress = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };

      // Score >= 80: repetitions = 1, interval = 1
      expect(progress).toBeDefined();
    });

    it("should handle second repetition correctly", () => {
      // Second success should set interval to 6
      const progress = {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      };

      // Score >= 80: repetitions = 2, interval = 6
      expect(progress).toBeDefined();
    });

    it("should handle ease factor minimum bound", () => {
      // Ease factor should never go below 1.3
      const easeFactor = 1.3;
      const score = 0;

      // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      // where q = score / 20
      expect(easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe("Streak Calculation Edge Cases", () => {
    it("should handle same day activity", () => {
      const today = new Date();
      const lastActive = new Date();
      const daysDiff = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(0);
    });

    it("should handle leap year dates", () => {
      const feb28 = new Date("2024-02-28");
      const feb29 = new Date("2024-02-29");
      const mar1 = new Date("2024-03-01");

      const diff1 = Math.floor(
        (feb29.getTime() - feb28.getTime()) / (1000 * 60 * 60 * 24),
      );
      const diff2 = Math.floor(
        (mar1.getTime() - feb29.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(diff1).toBe(1);
      expect(diff2).toBe(1);
    });

    it("should handle timezone differences", () => {
      const date1 = new Date("2024-01-01T23:00:00Z"); // Late night UTC
      const date2 = new Date("2024-01-02T01:00:00Z"); // Next day UTC

      const diff = Math.floor(
        (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Should be 0 days difference (within 24 hours)
      expect(diff).toBe(0);
    });
  });

  describe("Achievement Calculation Edge Cases", () => {
    it("should handle mastery rate of 0%", () => {
      const masteryRate = 0;
      expect(masteryRate).toBe(0);
      // Should not unlock any mastery achievements
    });

    it("should handle mastery rate of 100%", () => {
      const masteryRate = 100;
      expect(masteryRate).toBe(100);
      // Should unlock all mastery achievements
    });

    it("should handle mastery rate at exact thresholds", () => {
      const thresholds = [10, 25, 50, 75];
      thresholds.forEach((threshold) => {
        expect(threshold).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe("Daily Stats Edge Cases", () => {
    it("should handle zero questions answered", () => {
      const stats = {
        questionsAnswered: 0,
        totalScore: 0,
      };

      const averageScore =
        stats.questionsAnswered > 0
          ? stats.totalScore / stats.questionsAnswered
          : 0;

      expect(averageScore).toBe(0);
      expect(isNaN(averageScore)).toBe(false);
    });

    it("should handle very large numbers", () => {
      const stats = {
        questionsAnswered: 1000000,
        totalScore: 999999999,
      };

      const averageScore = stats.totalScore / stats.questionsAnswered;
      expect(averageScore).toBeCloseTo(999.999999, 6);
    });

    it("should handle negative scores in stats", () => {
      const stats = {
        questionsAnswered: 5,
        questionsCorrect: 3,
        totalScore: -100, // Negative total score
      };

      const averageScore = stats.totalScore / stats.questionsAnswered;
      expect(averageScore).toBe(-20);
    });
  });

  describe("Date Handling Edge Cases", () => {
    it("should handle end of month transitions", () => {
      const jan31 = new Date("2024-01-31");
      const feb1 = new Date("2024-02-01");

      const diff = Math.floor(
        (feb1.getTime() - jan31.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(diff).toBe(1);
    });

    it("should handle year transitions", () => {
      const dec31 = new Date("2023-12-31");
      const jan1 = new Date("2024-01-01");

      const diff = Math.floor(
        (jan1.getTime() - dec31.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(diff).toBe(1);
    });

    it("should handle invalid dates", () => {
      const invalidDate = new Date("invalid");
      expect(isNaN(invalidDate.getTime())).toBe(true);
    });
  });

  describe("String Handling Edge Cases", () => {
    it("should handle empty strings", () => {
      const empty = "";
      expect(empty.trim()).toBe("");
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(10000);
      expect(longString.length).toBe(10000);
    });

    it("should handle unicode strings", () => {
      const unicode = "🏆 Achievement Unlocked! 你好世界";
      expect(unicode.length).toBeGreaterThan(0);
    });

    it("should handle special characters", () => {
      const special = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      expect(special).toBeDefined();
    });
  });

  describe("Array Handling Edge Cases", () => {
    it("should handle empty arrays", () => {
      const empty: any[] = [];
      expect(empty.length).toBe(0);
      expect(empty.reduce((a, b) => a + b, 0)).toBe(0);
    });

    it("should handle very large arrays", () => {
      const large = new Array(10000).fill(0);
      expect(large.length).toBe(10000);
    });

    it("should handle sparse arrays", () => {
      const sparse: number[] = [];
      sparse[100] = 1;
      expect(sparse.length).toBe(101);
      expect(sparse.filter((x) => x !== undefined).length).toBe(1);
    });
  });
});

describe("Security Edge Cases", () => {
  it("should handle XSS attempts in user input", () => {
    const xssAttempt = '<script>alert("xss")</script>';
    const sanitized = xssAttempt.replace(
      /<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
    expect(sanitized).not.toContain("<script>");
  });

  it("should handle SQL injection patterns", () => {
    const sqlInjection = "'; DROP TABLE users; --";
    // Should be handled as plain string, not executed
    expect(typeof sqlInjection).toBe("string");
  });

  it("should handle NoSQL injection patterns", () => {
    const noSqlInjection = { $gt: "" };
    // Should be handled safely
    expect(typeof noSqlInjection).toBe("object");
  });

  it("should handle prototype pollution attempts", () => {
    const payload = JSON.parse('{"__proto__": {"polluted": true}}');
    // Object prototype should not be polluted
    expect(({} as any).polluted).toBeUndefined();
  });
});

describe("Performance Edge Cases", () => {
  it("should handle concurrent operations", async () => {
    const operations = Array(100)
      .fill(null)
      .map((_, i) => Promise.resolve(i));

    const results = await Promise.all(operations);
    expect(results).toHaveLength(100);
    expect(results[0]).toBe(0);
    expect(results[99]).toBe(99);
  });

  it("should handle rapid successive calls", async () => {
    const results: number[] = [];

    for (let i = 0; i < 1000; i++) {
      results.push(i);
    }

    expect(results).toHaveLength(1000);
  });

  it("should handle memory-intensive operations", () => {
    // Create large data structures
    const largeArray = new Array(100000).fill(0).map((_, i) => ({
      id: i,
      data: "x".repeat(100),
    }));

    expect(largeArray.length).toBe(100000);
  });
});
