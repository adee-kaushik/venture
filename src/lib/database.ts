import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { VentureStore, storeContext } from './store';
import type { NextRequest } from 'next/server';
import { sessionScope, ADMIN_COOKIE } from './admin-auth';

let pool: Pool | undefined;
function connection() {
  if (!process.env.DATABASE_URL) throw new Error('Database is not configured');
  if (!pool) { pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 }); attachDatabasePool(pool); }
  return pool;
}
export async function withStore<T>(fn: () => Promise<T>, readonly = false): Promise<T> {
  const client = await connection().connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '20s'");
    const { rows } = await client.query('SELECT state FROM venturelab_state WHERE id = 1' + (readonly ? '' : ' FOR UPDATE'));
    if (!rows[0]) throw new Error('Database migration required');
    const scoped = new VentureStore(); scoped.importState(rows[0].state);
    const result = await storeContext.run(scoped, fn);
    if (!readonly && scoped.dirty) await client.query('UPDATE venturelab_state SET state = $1::jsonb, updated_at = now() WHERE id = 1', [JSON.stringify(scoped.exportState())]);
    await client.query('COMMIT'); return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export function persistent(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      const scope = sessionScope(req.cookies.get(ADMIN_COOKIE)?.value);
      if (scope && scope !== '*') {
        const body = req.method === 'GET' || req.method === 'DELETE' ? null : await req.clone().json().catch(() => null);
        const businessId = req.nextUrl.searchParams.get('businessId') || body?.businessId;
        const privatePaths = ['/api/bookings','/api/conversations','/api/leads','/api/knowledge','/api/stats','/api/unanswered','/api/followups'];
        if(req.nextUrl.pathname === '/api/business' && req.method === 'PATCH' && !businessId)return Response.json({error:'businessId required'},{status:400});
        if(privatePaths.includes(req.nextUrl.pathname) && !businessId) return Response.json({error:'businessId required'},{status:400});
        if (businessId && businessId !== scope) return Response.json({error:'This business is not in your workspace'}, {status:403});
        if (req.nextUrl.pathname === '/api/business' && req.method === 'POST') return Response.json({error:'Contact the administrator to add another business'}, {status:403});
      }
      if (!['GET', 'HEAD'].includes(req.method)) {
        const origin = req.headers.get('origin');
        if (origin && origin !== req.nextUrl.origin) return Response.json({error:'Invalid origin'}, {status:403});
      }
      return await withStore(() => handler(req), req.method === 'GET');
    } catch (error) {
      console.error('Workspace request failed', error instanceof Error ? error.message : 'Unknown error');
      return Response.json({error:'Workspace temporarily unavailable. Please retry.'}, {status:503});
    }
  };
}
