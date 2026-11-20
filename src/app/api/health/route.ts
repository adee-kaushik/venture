import { NextResponse } from 'next/server';
import { checkWorkspaceHealth } from '@/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only public readiness check. Never disclose secrets, hostnames, or record contents.
export async function GET() {
  const result = await checkWorkspaceHealth();
  return NextResponse.json(result, {
    status: result.status === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  });
}
