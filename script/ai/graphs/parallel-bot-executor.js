/**
 * Parallel Bot Executor
 * 
 * Executes bot tasks in parallel using worker pools for 4-5x speedup.
 * Manages concurrency, rate limiting, and error handling.
 */

import { EventEmitter } from 'events';

// Configuration
const DEFAULT_CONFIG = {
  maxConcurrency: 4,        // Max parallel tasks
  taskTimeout: 60000,       // 60 seconds per task
  retryAttempts: 2,         // Retry failed tasks
  retryDelay: 1000,         // 1 second between retries
  rateLimitDelay: 500,      // 500ms between AI calls
  batchSize: 10             // Process in batches
};

/**
 * Task status enum
 */
const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying'
};

/**
 * Worker Pool for parallel task execution
 */
export class WorkerPool extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.activeWorkers = 0;
    this.taskQueue = [];
    this.results = [];
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      retried: 0,
      startTime: null,
      endTime: null
    };
  }
  
  /**
   * Add tasks to the queue
   */
  addTasks(tasks) {
    const wrappedTasks = tasks.map((task, index) => ({
      id: task.id || `task-${index}`,
      fn: task.fn || task,
      args: task.args || [],
      status: TaskStatus.PENDING,
      attempts: 0,
      result: null,
      error: null
    }));
    
    this.taskQueue.push(...wrappedTasks);
    this.stats.total += wrappedTasks.length;
    
    return this;
  }
  
  /**
   * Execute all tasks in parallel with concurrency limit
   */
  async execute() {
    this.stats.startTime = Date.now();
    
    console.log('\n' + '═'.repeat(60));
    console.log('⚡ PARALLEL BOT EXECUTOR');
    console.log('═'.repeat(60));
    console.log(`Tasks: ${this.stats.total}`);
    console.log(`Concurrency: ${this.config.maxConcurrency}`);
    console.log(`Batch Size: ${this.config.batchSize}`);
    
    // Process in batches
    const batches = this.createBatches();
    
    for (let i = 0; i < batches.length; i++) {
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batches[i].length} tasks)`);
      await this.processBatch(batches[i]);
    }
    
    this.stats.endTime = Date.now();
    
    return this.getResults();
  }
  
  /**
   * Create batches from task queue
   */
  createBatches() {
    const batches = [];
    for (let i = 0; i < this.taskQueue.length; i += this.config.batchSize) {
      batches.push(this.taskQueue.slice(i, i + this.config.batchSize));
    }
    return batches;
  }
  
  /**
   * Process a batch of tasks with concurrency limit
   */
  async processBatch(batch) {
    const executing = new Set();
    const results = [];
    
    for (const task of batch) {
      // Wait if at concurrency limit
      while (executing.size >= this.config.maxConcurrency) {
        await Promise.race(executing);
      }
      
      // Start task execution
      const promise = this.executeTask(task)
        .then(result => {
          executing.delete(promise);
          results.push(result);
          return result;
        })
        .catch(error => {
          executing.delete(promise);
          results.push({ task, error });
          return { task, error };
        });
      
      executing.add(promise);
      
      // Rate limiting delay
      await this.delay(this.config.rateLimitDelay);
    }
    
    // Wait for remaining tasks
    await Promise.all(executing);
    
    return results;
  }
  
  /**
   * Execute a single task with retry logic
   */
  async executeTask(task) {
    task.status = TaskStatus.RUNNING;
    task.attempts++;
    
    const startTime = Date.now();
    
    try {
      // Execute with timeout
      const result = await this.withTimeout(
        task.fn(...task.args),
        this.config.taskTimeout
      );
      
      task.status = TaskStatus.COMPLETED;
      task.result = result;
      task.duration = Date.now() - startTime;
      
      this.stats.completed++;
      this.emit('taskComplete', task);
      
      console.log(`   ✅ ${task.id} completed (${task.duration}ms)`);
      
      return task;
      
    } catch (error) {
      task.error = error.message;
      
      // Don't retry AI refusals — mark as skipped
      if (error.isRefusal) {
        task.status = TaskStatus.FAILED;
        task.duration = Date.now() - startTime;
        this.stats.failed++;
        console.log(`   ⏭️ ${task.id} skipped (AI refusal)`);
        return task;
      }
      
      // Retry if attempts remaining
      if (task.attempts < this.config.retryAttempts) {
        task.status = TaskStatus.RETRYING;
        this.stats.retried++;
        
        console.log(`   🔄 ${task.id} retrying (attempt ${task.attempts + 1})`);
        
        await this.delay(this.config.retryDelay * task.attempts);
        return this.executeTask(task);
      }
      
      task.status = TaskStatus.FAILED;
      task.duration = Date.now() - startTime;
      
      this.stats.failed++;
      this.emit('taskFailed', task);
      
      console.log(`   ❌ ${task.id} failed: ${error.message}`);
      
      return task;
    }
  }
  
  /**
   * Wrap promise with timeout
   */
  withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Task timeout')), ms)
      )
    ]);
  }
  
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get execution results
   */
  getResults() {
    const duration = this.stats.endTime - this.stats.startTime;
    const tasksPerSecond = this.stats.total / (duration / 1000);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 EXECUTION RESULTS');
    console.log('═'.repeat(60));
    console.log(`Total: ${this.stats.total}`);
    console.log(`Completed: ${this.stats.completed}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Retried: ${this.stats.retried}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Throughput: ${tasksPerSecond.toFixed(2)} tasks/sec`);
    console.log('═'.repeat(60) + '\n');
    
    return {
      tasks: this.taskQueue,
      stats: {
        ...this.stats,
        duration,
        tasksPerSecond: Math.round(tasksPerSecond * 100) / 100
      },
      completed: this.taskQueue.filter(t => t.status === TaskStatus.COMPLETED),
      failed: this.taskQueue.filter(t => t.status === TaskStatus.FAILED)
    };
  }
}

/**
 * Parallel question generator
 */
export async function generateQuestionsParallel(channels, options = {}) {
  const { generateQuestion } = await import('./question-graph.js');
  
  const pool = new WorkerPool({
    maxConcurrency: options.concurrency || 4,
    batchSize: options.batchSize || 5
  });
  
  // Create tasks for each channel
  const tasks = channels.map(channel => ({
    id: `question-${channel.channel}-${channel.difficulty}`,
    fn: generateQuestion,
    args: [{
      channel: channel.channel,
      subChannel: channel.subChannel || 'general',
      difficulty: channel.difficulty || 'intermediate',
      tags: channel.tags || [],
      targetCompanies: channel.companies || []
    }]
  }));
  
  pool.addTasks(tasks);
  
  return pool.execute();
}

/**
 * Parallel blog generator
 */
export async function generateBlogsParallel(topics, options = {}) {
  const { generateBlogPost } = await import('./blog-graph.js');
  
  const pool = new WorkerPool({
    maxConcurrency: options.concurrency || 2, // Lower for blog generation (heavier)
    batchSize: options.batchSize || 3
  });
  
  const tasks = topics.map(topic => ({
    id: `blog-${topic.id || topic.question?.substring(0, 20)}`,
    fn: generateBlogPost,
    args: [topic]
  }));
  
  pool.addTasks(tasks);
  
  return pool.execute();
}

/**
 * Parallel LinkedIn post generator
 */
export async function generateLinkedInPostsParallel(posts, options = {}) {
  const { generateLinkedInPost } = await import('./linkedin-graph.js');
  
  const pool = new WorkerPool({
    maxConcurrency: options.concurrency || 4,
    batchSize: options.batchSize || 10
  });
  
  const tasks = posts.map(post => ({
    id: `linkedin-${post.postId || post.title?.substring(0, 20)}`,
    fn: generateLinkedInPost,
    args: [post]
  }));
  
  pool.addTasks(tasks);
  
  return pool.execute();
}

/**
 * Parallel coding challenge generator
 */
export async function generateChallengesParallel(challenges, options = {}) {
  const { generateCodingChallenge } = await import('./coding-challenge-graph.js');
  
  const pool = new WorkerPool({
    maxConcurrency: options.concurrency || 2, // Lower due to Python execution
    batchSize: options.batchSize || 3
  });
  
  const tasks = challenges.map(challenge => ({
    id: `challenge-${challenge.category}-${challenge.difficulty}`,
    fn: generateCodingChallenge,
    args: [challenge]
  }));
  
  pool.addTasks(tasks);
  
  return pool.execute();
}

/**
 * Parallel flashcard generator
 */
export async function generateFlashcardsParallel(questions, options = {}) {
  const { generateFlashcardsParallel: run } = await import('./flashcard-graph.js');
  return run(questions, options);
}

export default {
  WorkerPool,
  generateQuestionsParallel,
  generateBlogsParallel,
  generateLinkedInPostsParallel,
  generateChallengesParallel,
  generateFlashcardsParallel
};
