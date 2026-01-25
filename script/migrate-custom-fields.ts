#!/usr/bin/env node
/**
 * Run Custom Fields Migration
 * Safely adds customFieldsConfig to buckets and customFields to tasks
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { Client } from "pg";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log("🔌 Connecting to database...");
        await client.connect();
        console.log("✅ Connected!");

        console.log("\n📂 Reading migration file...");
        const migrationSQL = readFileSync(
            join(__dirname, "..", "migrations", "add_custom_fields.sql"),
            "utf-8"
        );
        console.log("✅ Migration file loaded!");

        console.log("\n🚀 Running migration...");
        await client.query(migrationSQL);
        console.log("✅ Migration completed successfully!");

        console.log("\n📊 Verifying columns...");
        const result = await client.query(`
      SELECT 
        column_name, 
        data_type,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'buckets' 
        AND column_name = 'custom_fields_config'
      UNION ALL
      SELECT 
        column_name, 
        data_type,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
        AND column_name = 'custom_fields'
    `);

        if (result.rows.length === 2) {
            console.log("✅ Both columns verified:");
            result.rows.forEach(row => {
                console.log(`   - ${row.column_name} (${row.data_type})`);
            });
        } else {
            console.log("⚠️  Warning: Expected 2 columns, found", result.rows.length);
        }

    } catch (error) {
        console.error("\n❌ Migration failed:");
        console.error(error);
        process.exit(1);
    } finally {
        await client.end();
        console.log("\n🔌 Database connection closed");
    }
}

runMigration();