import { NextRequest, NextResponse } from 'next/server';
import { deleteTeamMember, listTeamMembers, saveTeamMember } from '@/lib/team-store';

export async function GET() {
  try {
    const members = await listTeamMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Failed to list team members:', error);
    return NextResponse.json({ error: 'Failed to load team members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.name || !body?.email || !body?.role) {
      return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 });
    }

    const member = await saveTeamMember({
      id: body.id,
      name: body.name,
      email: body.email,
      role: body.role,
      active: typeof body.active === 'boolean' ? body.active : true,
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Failed to save team member:', error);
    return NextResponse.json({ error: 'Failed to save team member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await deleteTeamMember(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete team member:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}
