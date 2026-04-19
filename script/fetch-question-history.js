#!/usr/bin/env node
/**
 * Fetch Question History for Static Build
 * 
 * Retrieves history from the database and generates static JSON files.
 * For questions without history, creates a default "created" entry using
 * the question's created_at date.
 * 
 * Output:
 * - public/data/history/index.json - Summary of all questions with history
 * - public/data/history/{questionId}.json - Individual question history
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { dbClient as db } from './db/pg-client.js';
fetchQuestionHistory();
