import { NextRequest, NextResponse } from 'next/server';
import { deleteCallerIdentity, listCallerIdentities, saveCallerIdentity } from '@/lib/caller-identity-store';
import { getSettings } from '@/lib/store';

function buildDefaultIdentityTargetBlueprint(input: {
  name: string;
  position: string;
  companyName: string;
  industry: string;
  campaignGoal: string;
  mentionAi: boolean;
  sayThisRules?: string;
  avoidThisRules?: string;
}): string {
  const company = input.companyName || 'our company';
  const role = input.position || 'specialist';
  const industry = input.industry || 'general';
  const goal = input.campaignGoal || 'qualify lead and hand over to human agent';
  const audience = `${industry} prospects who may benefit from our offer`;
  const offer = `brief update about ${company} and how we can help`;
  const qualify = 'Need + budget + timeline + decision maker';
  const cta = 'connect now with our human team';
  const disclosure = input.mentionAi ? 'yes' : 'no';
  const mustSay = input.sayThisRules?.trim() || 'none';
  const avoid = input.avoidThisRules?.trim() || 'none';

  return [
    `Identity: ${input.name}, ${role}`,
    `AI Disclosure: ${disclosure}`,
    `Goal: ${goal}`,
    `Audience: ${audience}`,
    `Offer: ${offer}`,
    `Qualification: ${qualify}`,
    `CTA: ${cta}`,
    `Must Say: ${mustSay}`,
    `Avoid Saying: ${avoid}`,
  ].join('\n');
}

export async function GET() {
  try {
    const identities = await listCallerIdentities();
    return NextResponse.json({ identities });
  } catch (error) {
    console.error('Failed to list caller identities:', error);
    return NextResponse.json({ error: 'Failed to load caller identities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await getSettings();

    const name = String(body?.name || '').trim();
    const position = String(body?.position || '').trim();
    const requestedGender = String(body?.gender || 'any').trim().toLowerCase();
    const gender = ['male', 'female', 'any'].includes(requestedGender) ? requestedGender : 'any';
    const language = String(body?.language || 'en-US').trim();
    const voiceId = String(body?.voiceId || '21m00Tcm4TlvDq8ikWAM').trim();
    const industry = String(body?.industry || settings.industry || '').trim();
    const mentionAi = Boolean(body?.mentionAi);
    const sayThisRules = String(body?.sayThisRules || settings.sayThisRules || '').trim();
    const avoidThisRules = String(body?.avoidThisRules || settings.avoidThisRules || '').trim();
    const campaignGoal = String(body?.campaignGoal || '').trim();

    if (!name || !position) {
      return NextResponse.json({ error: 'name and position are required' }, { status: 400 });
    }

    const script = String(body?.script || '').trim() || buildDefaultIdentityTargetBlueprint({
      name,
      position,
      companyName: settings.businessName || '',
      industry,
      campaignGoal,
      mentionAi,
      sayThisRules,
      avoidThisRules,
    });

    const identity = await saveCallerIdentity({
      id: body?.id,
      name,
      position,
      gender,
      language,
      voiceId,
      industry,
      mentionAi,
      script,
      sayThisRules,
      avoidThisRules,
    });

    return NextResponse.json({ success: true, identity });
  } catch (error) {
    console.error('Failed to save caller identity:', error);
    return NextResponse.json({ error: 'Failed to save caller identity' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await deleteCallerIdentity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete caller identity:', error);
    return NextResponse.json({ error: 'Failed to delete caller identity' }, { status: 500 });
  }
}
