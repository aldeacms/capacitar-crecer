import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://qablhrycgplkgmzurtke.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    const migrationSql = fs.readFileSync('./supabase/migrations/20260319000000_add_certificate_fields.sql', 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = migrationSql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec', { 
          statement: statement.trim() 
        }).catch(e => ({ error: e.message }));
        
        if (error && !error.includes('does not exist')) {
          console.error('Error:', error);
        }
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runMigration();
