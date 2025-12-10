/**
 * Health Check API
 * Returns server status and environment info
 */
import { NextResponse } from 'next/server';
import { SOLANA_NETWORK } from '@/lib/solana';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    solanaNetwork: SOLANA_NETWORK,
  });
}
