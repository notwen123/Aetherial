import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/agents/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST() {
  console.log('[API/Agents] Manual cycle trigger received');

  try {
    const orchestrator = new AgentOrchestrator();
    const result = await orchestrator.runCycle();

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[API/Agents] Cycle failed:', err);
    return NextResponse.json(
      { 
        success: false, 
        error: (err as Error).message,
        logs: [`[Fatal] ${(err as Error).message}`]
      },
      { status: 500 }
    );
  }
}
