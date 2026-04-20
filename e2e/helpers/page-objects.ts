/**
 * Page Object Models
 * Encapsulate page interactions for better test maintainability
 */

import { Page, Locator } from '@playwright/test';

// ============================================
// BASE PAGE OBJECT
// ============================================

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Don't wait for networkidle as it can be unreliable
    await this.page.waitForTimeout(1000); // Give page time to render
  }

  async waitForAnimation(duration: number = 300) {
    await this.page.waitForTimeout(duration);
  }
}

// ============================================
// UNIFIED QUESTION VIEW PAGE OBJECT
// ============================================

export class UnifiedQuestionViewPage extends BasePage {
  // Locators
  get metadataBar() {
    return this.page.locator('[class*="metadata"]').first();
  }

  get progressBar() {
    return this.page.locator('[class*="progress"]').first();
  }

  get questionPanel() {
    return this.page.locator('[class*="question"]').first();
  }

  get answerPanel() {
    return this.page.locator('[class*="answer"]').first();
  }

  get actionBar() {
    return this.page.locator('[class*="action"]').first();
  }

  get previousButton() {
    return this.page.getByRole('button', { name: /previous|prev/i });
  }

  get nextButton() {
    return this.page.getByRole('button', { name: /next/i });
  }

  get revealButton() {
    return this.page.getByRole('button', { name: /reveal|show answer/i });
  }

  get hideButton() {
    return this.page.getByRole('button', { name: /hide/i });
  }

  get bookmarkButton() {
    return this.page.locator('button[aria-label*="bookmark" i]');
  }

  get difficultyBadge() {
    return this.page.locator('text=/beginner|intermediate|advanced/i').first();
  }

  get questionCounter() {
    return this.page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first();
  }

  get timer() {
    return this.page.locator('text=/\\d+:\\d+/').first();
  }

  // Actions
  async clickNext() {
    await this.nextButton.click();
    await this.waitForAnimation();
  }

  async clickPrevious() {
    await this.previousButton.click();
    await this.waitForAnimation();
  }

  async revealAnswer() {
    await this.revealButton.click();
    await this.waitForAnimation();
  }

  async hideAnswer() {
    await this.hideButton.click();
    await this.waitForAnimation();
  }

  async toggleBookmark() {
    await this.bookmarkButton.click();
    await this.waitForAnimation(200);
  }

  async getCurrentQuestionNumber(): Promise<number> {
    const text = await this.questionCounter.textContent();
    const match = text?.match(/(\d+)\s*\//);
    return match ? parseInt(match[1]) : 0;
  }

  async getTotalQuestions(): Promise<number> {
    const text = await this.questionCounter.textContent();
    const match = text?.match(/\/\s*(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async getDifficulty(): Promise<string> {
    const text = await this.difficultyBadge.textContent();
    return text?.toLowerCase().trim() || '';
  }

  async getTimeRemaining(): Promise<string> {
    const text = await this.timer.textContent();
    return text?.trim() || '';
  }
}

// ============================================
// HOME PAGE OBJECT
// ============================================

export class HomePage extends BasePage {
  async goto() {
    await super.goto('/');
  }

  get quickQuizButton() {
    return this.page.getByRole('button', { name: /quick quiz|start quiz/i });
  }

  get channelsSection() {
    return this.page.locator('[class*="channels"]');
  }

  get activityFeed() {
    return this.page.locator('[class*="activity"]');
  }

  get statsCards() {
    return this.page.locator('[class*="stat"]');
  }

  async startQuickQuiz() {
    await this.quickQuizButton.click();
    await this.waitForAnimation();
  }

  async navigateToChannel(channelName: string) {
    await this.page.getByRole('link', { name: new RegExp(channelName, 'i') }).click();
    await this.waitForAnimation();
  }
}

// ============================================
// TEST SESSION PAGE OBJECT
// ============================================

export class TestSessionPage extends UnifiedQuestionViewPage {
  async goto(channelId: string) {
    await super.goto(`/test/${channelId}`);
    // Wait for either the start button or a question to appear
    try {
      await this.page.waitForSelector('button:has-text("Start Test"), h2, h3', { timeout: 10000 });
    } catch (e) {
      console.log('Test page may not have loaded properly');
    }
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /submit/i });
  }

  get startTestButton() {
    return this.page.getByRole('button', { name: /start test/i });
  }

  get resultsSection() {
    return this.page.locator('[class*="results"], text=/score|passed|failed/i').first();
  }

  get scoreDisplay() {
    return this.page.locator('text=/score|\\d+%/i').first();
  }

  async startTest() {
    const startButton = this.startTestButton;
    if (await startButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startButton.click();
      await this.waitForAnimation();
    }
  }

  async submitAnswer() {
    await this.submitButton.click();
    await this.waitForAnimation();
  }

  async completeTest() {
    // Start test if needed
    await this.startTest();
    
    const total = await this.getTotalQuestions();
    for (let i = 0; i < total; i++) {
      // Select first option
      const option = this.page.locator('button[role="radio"], input[type="radio"]').first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await this.waitForAnimation(300);
      }
      
      if (i < total - 1) {
        await this.clickNext();
      }
    }
    
    // Submit final answer
    const finishButton = this.page.getByRole('button', { name: /finish|submit/i });
    if (await finishButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await finishButton.click();
      await this.waitForAnimation();
    }
  }

  async getScore(): Promise<number> {
    const text = await this.scoreDisplay.textContent();
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }
}

// ============================================
// VOICE INTERVIEW PAGE OBJECT
// ============================================

export class VoiceInterviewPage extends UnifiedQuestionViewPage {
  async goto() {
    await super.goto('/voice-interview');
  }

  get recordButton() {
    return this.page.getByRole('button', { name: /record|start recording/i });
  }

  get stopButton() {
    return this.page.getByRole('button', { name: /stop/i });
  }

  get evaluationSection() {
    return this.page.locator('[class*="evaluation"]');
  }

  get creditsDisplay() {
    return this.page.locator('text=/credits|\\d+ credits/i');
  }

  async startRecording() {
    await this.recordButton.click();
    await this.waitForAnimation();
  }

  async stopRecording() {
    await this.stopButton.click();
    await this.waitForAnimation();
  }

  async skipQuestion() {
    await this.clickNext();
  }
}

// ============================================
// CERTIFICATION PAGE OBJECT
// ============================================

export class CertificationPage extends UnifiedQuestionViewPage {
  async goto(certId: string) {
    await super.goto(`/certification/${certId}`);
  }

  get startExamButton() {
    return this.page.getByRole('button', { name: /start exam/i });
  }

  get flagButton() {
    return this.page.getByRole('button', { name: /flag/i });
  }

  get reviewButton() {
    return this.page.getByRole('button', { name: /review/i });
  }

  get domainTracker() {
    return this.page.locator('[class*="domain"]');
  }

  async startExam() {
    await this.startExamButton.click();
    await this.waitForAnimation();
  }

  async flagQuestion() {
    await this.flagButton.click();
    await this.waitForAnimation(200);
  }

  async reviewFlaggedQuestions() {
    await this.reviewButton.click();
    await this.waitForAnimation();
  }
}

// ============================================
// REVIEW SESSION PAGE OBJECT
// ============================================

export class ReviewSessionPage extends UnifiedQuestionViewPage {
  async goto() {
    await super.goto('/review');
  }

  get confidenceButtons() {
    return this.page.locator('button[class*="confidence"]');
  }

  get masteryDisplay() {
    return this.page.locator('text=/mastery|level/i');
  }

  get xpDisplay() {
    return this.page.locator('text=/xp|experience/i');
  }

  async rateConfidence(rating: 'easy' | 'good' | 'hard' | 'again') {
    await this.page.getByRole('button', { name: new RegExp(rating, 'i') }).click();
    await this.waitForAnimation();
  }

  async getMasteryLevel(): Promise<string> {
    const text = await this.masteryDisplay.textContent();
    return text?.trim() || '';
  }
}

// ============================================
// CHANNELS PAGE OBJECT
// ============================================

export class ChannelsPage extends BasePage {
  async goto() {
    await super.goto('/channels');
  }

  get channelCards() {
    return this.page.locator('[class*="channel-card"]');
  }

  get searchInput() {
    return this.page.getByPlaceholder(/search/i);
  }

  get filterButtons() {
    return this.page.locator('button[class*="filter"]');
  }

  async searchChannels(query: string) {
    await this.searchInput.fill(query);
    await this.waitForAnimation(300);
  }

  async selectChannel(channelName: string) {
    await this.page.getByRole('link', { name: new RegExp(channelName, 'i') }).click();
    await this.waitForAnimation();
  }

  async filterByCategory(category: string) {
    await this.page.getByRole('button', { name: new RegExp(category, 'i') }).click();
    await this.waitForAnimation();
  }
}

// ============================================
// MOBILE NAVIGATION PAGE OBJECT
// ============================================

export class MobileNavigation extends BasePage {
  get bottomNav() {
    return this.page.locator('[class*="bottom-nav"]');
  }

  get homeTab() {
    return this.page.getByRole('button', { name: /home/i });
  }

  get learnTab() {
    return this.page.getByRole('button', { name: /learn/i });
  }

  get practiceTab() {
    return this.page.getByRole('button', { name: /practice/i });
  }

  get progressTab() {
    return this.page.getByRole('button', { name: /progress/i });
  }

  async navigateToHome() {
    await this.homeTab.click();
    await this.waitForAnimation();
  }

  async navigateToLearn() {
    await this.learnTab.click();
    await this.waitForAnimation();
  }

  async navigateToPractice() {
    await this.practiceTab.click();
    await this.waitForAnimation();
  }

  async navigateToProgress() {
    await this.progressTab.click();
    await this.waitForAnimation();
  }
}
