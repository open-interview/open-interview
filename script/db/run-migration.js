#!/usr/bin/env node
/**
 * Database Migration Runner (PostgreSQL)
 *
 * Runs SQL migrations against the PostgreSQL database.
 * Usage: node script/db/run-migration.js [migration-file]
 */

import 'dotenv/config';
import { getPool } from './pg-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration(migrationFile) {
  const pool = getPool();

  console.log('\n' + '═'.repeat(60));
  console.log('🗄️  DATABASE MIGRATION RUNNER (PostgreSQL)');
  console.log('═'.repeat(60));
  console.log(`Migration: ${migrationFile}`);
  console.log(`Database: ${(process.env.DATABASE_URL || process.env.PGDATABASE || 'postgres').substring(0, 40)}`);

  const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`\n📝 Found ${statements.length} SQL statements\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const statement of statements) {
    const shortStmt = statement.substring(0, 60).replace(/\n/g, ' ');

    try {
      await pool.query(statement);
      console.log(`   ✅ ${shortStmt}...`);
      success++;
    } catch (error) {
      if (
        error.message?.includes('already exists') ||
        error.message?.includes('does not exist') ||
        error.code === '42P07' ||
        error.code === '42703'
      ) {
        console.log(`   ⏭️  ${shortStmt}... (skipped: ${error.message.split('\n')[0]})`);
        skipped++;
      } else {
        console.log(`   ❌ ${shortStmt}...`);
        console.log(`      Error: ${error.message}`);
        failed++;
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 MIGRATION RESULTS');
  console.log('═'.repeat(60));
  console.log(`   Success: ${success}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed:  ${failed}`);
  console.log('═'.repeat(60) + '\n');

  await pool.end();

  if (failed > 0) {
    process.exit(1);
  }
}

const migrationFile = process.argv[2] || '001_add_indexes.sql';
runMigration(migrationFile).catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
