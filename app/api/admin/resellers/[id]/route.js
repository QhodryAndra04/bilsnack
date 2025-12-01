import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireAdmin } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = await params;
    const { data: reseller, error } = await supabase
      .from('users')
      .select(`
        *,
        reseller_profiles (*)
      `)
      .eq('id', id)
      .eq('role', 'reseller')
      .single();

    if (error) {
      console.error('Error fetching reseller:', error);
      return NextResponse.json(
        { error: 'Reseller tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(reseller);
  } catch (error) {
    console.error('Error in GET /api/admin/resellers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { data: user, error: userError } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .eq('role', 'reseller')
      .select()
      .single();

    if (userError) {
      console.error('Error updating user:', userError);
      return NextResponse.json(
        { error: 'Gagal mengupdate reseller' },
        { status: 500 }
      );
    }

    // Update or create reseller profile
    const profileData = {
      user_id: id,
      store_name: body.store_name,
    };

    const { error: profileError } = await supabase
      .from('reseller_profiles')
      .upsert(profileData, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail the request if profile update fails
    }

    return NextResponse.json({
      ...user,
      reseller_profiles: [{ store_name: body.store_name }]
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/resellers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}