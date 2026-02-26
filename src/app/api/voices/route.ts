import { NextRequest, NextResponse } from 'next/server';
import { getVoices } from '@/lib/elevenlabs';

export async function GET() {
  try {
    const voices = await getVoices();
    
    return NextResponse.json({ 
      voices: voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
        previewUrl: v.preview_url,
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to get voices' 
    }, { status: 500 });
  }
}
