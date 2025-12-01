import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireAdmin } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = params;

    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        *,
        reseller_profiles (
          store_name,
          phone,
          address
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform data to include reseller profile fields
    const transformedUser = {
      ...userData,
      store_name: userData.reseller_profiles?.[0]?.store_name || null,
      reseller_phone: userData.reseller_profiles?.[0]?.phone || null,
      reseller_address: userData.reseller_profiles?.[0]?.address || null,
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = params;
    const updateData = await request.json();

    // Handle reseller-specific fields
    const { store_name, phone, address, firstName, lastName, ...userUpdateData } = updateData;

    // Hash password if provided
    if (userUpdateData.password) {
      const saltRounds = 10;
      userUpdateData.password_hash = await bcrypt.hash(userUpdateData.password, saltRounds);
      delete userUpdateData.password;
    }

    // Update user table fields
    if (firstName || lastName) {
      userUpdateData.first_name = firstName || userUpdateData.first_name;
      userUpdateData.last_name = lastName || userUpdateData.last_name;
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ ...userUpdateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, first_name, last_name, phone, address, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update reseller profile if reseller and profile fields provided
    if (updatedUser.role === 'reseller' && (store_name || phone || address)) {
      const profileUpdate = {};
      if (store_name !== undefined) profileUpdate.store_name = store_name;
      if (phone !== undefined) profileUpdate.phone = phone;
      if (address !== undefined) profileUpdate.address = address;

      const { error: profileError } = await supabase
        .from('reseller_profiles')
        .update(profileUpdate)
        .eq('user_id', id);

      if (profileError) {
        console.error('Error updating reseller profile:', profileError);
        // Don't fail the whole operation
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = params;

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}