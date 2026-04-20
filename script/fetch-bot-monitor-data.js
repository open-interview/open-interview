#!/usr/bin/env node
/**
 * Fetch Bot Monitor Data
 * Generates bot-monitor.json for the frontend
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { dbClient as db } from './db/pg-client.js';


main().catch(console.error);
