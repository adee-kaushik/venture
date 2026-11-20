import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { VentureStore, storeContext } from './store';
import type { NextRequest } from 'next/server';
import { adminConfigured, sessionScope, ADMIN_COOKIE } from './admin-auth';

let pool: Pool | undefined;
function connection() {
  if (!process.env.DATABASE_URL?.trim()) throw new Error('Database is not configured');
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000
    });
    attachDatabasePool(pool);
  }
  return pool;
}

export type WorkspaceErrorCode =
  | 'DATABASE_URL_MISSING'
  | 'DATABASE_AUTH_FAILED'
  | 'DATABASE_CONNECT_FAILED'
  | 'DATABASE_SCHEMA_MISSING'
  | 'DATABASE_STATE_MISSING'
  | 'SESSION_SECRET_MISSING'
  | 'WORKSPACE_OPERATION_FAILED';

// Classify failures without returning connection strings, SQL text, or customer data.
export function workspaceErrorCode(error: unknown): WorkspaceErrorCode {
  if (!process.env.DATABASE_URL?.trim()) return 'DATABASE_URL_MISSING';
  const code = error && typeof error === 'object' && 'code' in error
    ? String(error.code) : '';
  if (code === '28P01' || code === '28000') return 'DATABASE_AUTH_FAILED';
  if (code === '42P01') return 'DATABASE_SCHEMA_MISSING';
  if (['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET',
       'EHOSTUNREACH', 'ENETUNREACH', '57P03', '53300', '08006', '08001'].includes(code)) {
    return 'DATABASE_CONNECT_FAILED';
  }
  if (error instanceof Error && error.message === 'Database migration required') {
    return 'DATABASE_STATE_MISSING';
  }
  return 'WORKSPACE_OPERATION_FAILED';
}

export async function checkWorkspaceHealth() {
  const checks = { database: false, workspace: false, session: adminConfigured() };
  let code: WorkspaceErrorCode | 'READY' = 'READY';
  if (!process.env.DATABASE_URL?.trim()) {
    code = 'DATABASE_URL_MISSING';
  } else {
    let client;
    try {
      client = await connection().connect();
      checks.database = true;
      const { rows } = await client.query('SELECT id FROM venturelab_state WHERE id = 1 LIMIT 1');
      checks.workspace = rows.length > 0;
      if (!checks.workspace) code = 'DATABASE_STATE_MISSING';
    } catch (error) {
      code = workspaceErrorCode(error);
    } finally {
      client?.release();
    }
  }
  if (code === 'READY' && !checks.session) code = 'SESSION_SECRET_MISSING';
  return {
    status: code === 'READY' ? 'ok' as const : 'degraded' as const,
    code,
    checks
  };
}

export async function withStore<T>(fn: () => Promise<T>, readonly = false): Promise<T> {
  const client = await connection().connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '20s'");
    const { rows } = await client.query(
      'SELECT state FROM venturelab_state WHERE id = 1' + (readonly ? '' : ' FOR UPDATE')
    );
    if (!rows[0]) throw new Error('Database migration required');
    const scoped = new VentureStore();
    scoped.importState(rows[0].state);
    const result = await storeContext.run(scoped, fn);
    if (!readonly && scoped.dirty) {
      await client.query(
        'UPDATE venturelab_state SET state = $1::jsonb, updated_at = now() WHERE id = 1',
        [JSON.stringify(scoped.exportState())]
      );
    }
    await client.query('COMMIT');
    return result;
  } catch (error) {
    // Never replace the original database error with a failed rollback.
    try { await client.query('ROLLBACK'); } catch { /* preserve original failure */ }
    throw error;
  } finally {
    client.release();
  }
}

export function persistent(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      const scope = sessionScope(req.cookies.get(ADMIN_COOKIE)?.value);
      if (scope && scope !== '*') {
        const body = req.method === 'GET' || req.method === 'DELETE'
          ? null : await req.clone().json().catch(() => null);
        const businessId = req.nextUrl.searchParams.get('businessId') || body?.businessId;
        const privatePaths = [
          '/api/bookings', '/api/conversations', '/api/leads', '/api/knowledge',
          '/api/stats', '/api/unanswered', '/api/followups'
        ];
        if (req.nextUrl.pathname === '/api/business' && req.method === 'PATCH' && !businessId) {
          return Response.json({ error: 'businessId required' }, { status: 400 });
        }
        if (privatePaths.includes(req.nextUrl.pathname) && !businessId) {
          return Response.json({ error: 'businessId required' }, { status: 400 });
        }
        if (businessId && businessId !== scope) {
          return Response.json({ error: 'This business is not in your workspace' }, { status: 403 });
        }
        if (req.nextUrl.pathname === '/api/business' && req.method === 'POST') {
          return Response.json({ error: 'Contact the administrator to add another business' }, { status: 403 });
        }
      }
      if (!['GET', 'HEAD'].includes(req.method)) {
        const origin = req.headers.get('origin');
        if (origin && origin !== req.nextUrl.origin) {
          return Response.json({ error: 'Invalid origin' }, { status: 403 });
        }
      }
      return await withStore(() => handler(req), req.method === 'GET');
    } catch (error) {
      const code = workspaceErrorCode(error);
      // Safe error code for runtime logs; never log DATABASE_URL or credentials.
      console.error('VentureLab workspace failure', { code, path: req.nextUrl.pathname });
      return Response.json(
        { error: 'Workspace temporarily unavailable. Please retry.', code },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  };
}
