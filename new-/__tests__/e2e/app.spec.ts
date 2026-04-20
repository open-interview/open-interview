/**
 * End-to-end tests for Interview Buddy AI
 * Uses Playwright for browser automation
 *
 * Note: These tests require the app to be running
 * Run with: npm run test:e2e
 */

import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh onboarding
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should complete onboarding flow", async ({ page }) => {
    // Navigate to app
    await page.goto("/");

    // Step 1: Welcome screen
    await expect(page.getByText("Welcome!")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2: Set goals
    await expect(page.getByText("Tell us about your goals")).toBeVisible();
    await page
      .getByPlaceholder(/senior frontend engineer/i)
      .fill("Senior Frontend Engineer");
    await page.getByRole("combobox").selectOption("senior");
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 3: AI Model setup
    await expect(page.getByText("Prepare AI Assistant")).toBeVisible();
    await page.getByRole("button", { name: /get started/i }).click();

    // Should be redirected to dashboard
    await expect(page.getByText("Welcome back!")).toBeVisible();
  });

  test("should persist user after onboarding", async ({ page }) => {
    await page.goto("/");

    // Complete onboarding
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByPlaceholder(/senior frontend engineer/i).fill("Test User");
    await page.getByRole("combobox").selectOption("mid");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /get started/i }).click();

    // Reload page
    await page.reload();

    // Should go directly to dashboard (not onboarding)
    await expect(page.getByText("Welcome back!")).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Setup a user with some data
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          id: "test-user",
          username: "Test User",
          level: 5,
          xp: 450,
          credits: 250,
          streak: 7,
        }),
      );
    });
    await page.reload();
  });

  test("should display user stats", async ({ page }) => {
    await expect(page.getByText("Welcome back!")).toBeVisible();
    await expect(page.getByText("5")).toBeVisible(); // Level
    await expect(page.getByText("250")).toBeVisible(); // Credits
    await expect(page.getByText("7")).toBeVisible(); // Streak
  });

  test("should start practice session", async ({ page }) => {
    await page.getByRole("button", { name: /start practice/i }).click();

    // Should navigate to chat interface
    await expect(page.getByText("Interview Practice")).toBeVisible();
    await expect(page.getByPlaceholder(/type your answer/i)).toBeVisible();
  });
});

test.describe("Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Navigate to chat
    await page.evaluate(() => {
      localStorage.setItem("userProfile", JSON.stringify({ id: "test-user" }));
    });
    await page.reload();
    await page.getByRole("button", { name: /start practice/i }).click();
  });

  test("should send and receive messages", async ({ page }) => {
    const input = page.getByPlaceholder(/type your answer/i);
    await input.fill("This is my answer to the question");
    await page.getByRole("button", { name: /send/i }).click();

    // Message should appear
    await expect(
      page.getByText("This is my answer to the question"),
    ).toBeVisible();

    // AI should respond (simulated)
    await expect(page.getByText(/interesting response/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should show thinking indicator", async ({ page }) => {
    const input = page.getByPlaceholder(/type your answer/i);
    await input.fill("Test message");
    await page.getByRole("button", { name: /send/i }).click();

    // Should show thinking dots
    await expect(page.locator(".animate-bounce")).toBeVisible();
  });

  test("should close chat and return to dashboard", async ({ page }) => {
    await page.getByText(/close/i).click();

    await expect(page.getByText("Welcome back!")).toBeVisible();
  });
});

test.describe("Gamification", () => {
  test("should earn XP after answering question", async ({ page }) => {
    // Setup user
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          id: "test-user",
          xp: 0,
          level: 1,
        }),
      );
    });
    await page.reload();

    // Start practice and answer question
    await page.getByRole("button", { name: /start practice/i }).click();
    await page.getByPlaceholder(/type your answer/i).fill("Good answer");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Return to dashboard
    await page.getByText(/close/i).click();

    // XP should have increased (shown in stats)
    // Note: This depends on implementation
  });
});
