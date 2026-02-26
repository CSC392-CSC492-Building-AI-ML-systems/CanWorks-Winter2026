import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromSessionToken } from '@/app/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await getUserFromSessionToken(token);

    if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Delete user using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}