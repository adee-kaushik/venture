import { Pool } from 'pg';
import { readFileSync } from 'node:fs';
import { VentureStore } from '../src/lib/store';
async function main(){
const pool = new Pool({connectionString: process.env.DATABASE_URL});
await pool.query(readFileSync('migrations/001_workspace.sql','utf8'));
await pool.query('INSERT INTO venturelab_state (id, state) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING', [JSON.stringify({businesses:[],knowledge:{},conversations:[],messages:{},leads:{},bookings:{},unanswered:{},extra:{}})]);
await pool.end();
console.log('Workspace migration complete');

}
main().catch(e=>{console.error(e.message);process.exit(1)});
