import { NextRequest, NextResponse } from 'next/server';
import { requireUserIdFromRequest } from '@/lib/request-user';
import { isUnauthorizedError } from '@/lib/route-errors';
import { getSettings } from '@/lib/store';
import { getCSMHealth } from '@/lib/csm';

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserIdFromRequest(request);
    const settings = await getSettings(userId);
    const provider = settings.ttsProvider === 'csm' ? 'csm' : 'elevenlabs';

    if (provider !== 'csm') {
      return NextResponse.json({
        provider,
        status: 'ready',
        detail: 'ElevenLabs provider selected.',
      });
    }

    if (!settings.csmEnabled) {
      return NextResponse.json({
        provider,
        status: 'disabled',
        detail: 'CSM provider selected but disabled in workspace settings.',
      });
    }

    const health = await getCSMHealth();
    if (!health.ok) {
      return NextResponse.json({
        provider,
        status: 'unreachable',
        detail: health.detail || 'Unable to reach CSM service.',
      });
    }

    if (!health.gpuAvailable) {
      return NextResponse.json({
        provider,
        status: 'gpu_missing',
        detail: 'GPU is not available for CSM.',
        modelId: health.modelId || undefined,
      });
    }

    if (!health.ready) {
      return NextResponse.json({
        provider,
        status: 'loading',
        detail: health.detail || 'CSM model is loading.',
        modelId: health.modelId || undefined,
      });
    }

    return NextResponse.json({
      provider,
      status: 'ready',
      detail: 'CSM service is healthy.',
      modelId: health.modelId || undefined,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to check TTS health' }, { status: 500 });
  }
}
