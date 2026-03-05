import { csmSpeakerVoiceId } from '@/lib/csm';
import { isTwilioNativeVoice } from '@/lib/twilio';

interface VoiceSelectionSettings {
  ttsProvider?: 'elevenlabs' | 'csm' | string;
  csmSpeaker?: number;
}

function defaultHumanVoiceId(): string {
  return (
    String(process.env.ELEVENLABS_HUMAN_VOICE_ID || '').trim() ||
    String(process.env.ELEVENLABS_DEFAULT_VOICE_ID || '').trim() ||
    '21m00Tcm4TlvDq8ikWAM'
  );
}

function isCsmVoiceId(voiceId: string): boolean {
  return /^csm_speaker_\d+$/i.test(voiceId);
}

function normalizeProvider(value: unknown): 'elevenlabs' | 'csm' {
  return String(value || '').trim().toLowerCase() === 'csm' ? 'csm' : 'elevenlabs';
}

export function resolvePreferredVoiceId(
  requestedVoiceId: string | undefined,
  settings: VoiceSelectionSettings
): string {
  const provider = normalizeProvider(settings.ttsProvider);
  const voiceId = String(requestedVoiceId || '').trim();
  const strictHuman = true;

  if (provider === 'csm') {
    if (isCsmVoiceId(voiceId)) return voiceId;
    if (!strictHuman && voiceId) return voiceId;
    return csmSpeakerVoiceId(Number(settings.csmSpeaker) || 0);
  }

  // elevenlabs provider
  if (voiceId && !isTwilioNativeVoice(voiceId) && !isCsmVoiceId(voiceId)) {
    return voiceId;
  }
  if (!strictHuman && voiceId) return voiceId;
  return defaultHumanVoiceId();
}
