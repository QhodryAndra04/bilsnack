/* eslint-env node */
import supabase from './supabase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billsnack.id';
const MAX_PROFILE_IMAGE_LEN = 2_000_000;

function verifyToken(request) {
  const auth = request.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    console.error('Token verify error', err);
    throw new Error('Invalid token');
  }
}

function requireAdmin(user) {
  if (user.role && user.role === 'admin') return;
  throw new Error('Admin privileges required');
}

function requireReseller(user) {
  if (user.role && user.role === 'reseller') return;
  throw new Error('Reseller privileges required');
}

async function register(body) {
  const { email, password, firstName, lastName, username, phone, gender, profileImage, profileImageUrl } = body;
  if (!email || !password) throw new Error('Email and password are required');

  // Check if exists
  const { data: exists } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (exists) throw new Error('Email already registered');

  // Validate profile image size
  if (profileImage && profileImage.length > MAX_PROFILE_IMAGE_LEN) {
    throw new Error('Profile image too large. Use a smaller image or provide a profileImageUrl instead.');
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: hash,
      first_name: firstName || null,
      last_name: lastName || null,
      username: username || null,
      phone: phone || null,
      gender: gender || null,
      profile_image: profileImage || null,
      profile_image_url: profileImageUrl || null
    })
    .select()
    .single();

  if (error) throw error;

  const user = {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    username: data.username,
    phone: data.phone,
    gender: data.gender,
    profileImage: data.profile_image || data.profile_image_url || null,
  };
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
}

async function login(body) {
  const { email, password, admin: isAdminLogin } = body;
  if (!email || !password) throw new Error('Email and password are required');

  const { data: userRow, error } = await supabase
    .from('users')
    .select('id, email, password_hash, first_name, last_name, username, phone, gender, address, postal_code, city, province, profile_image, profile_image_url, role')
    .eq('email', email)
    .single();

  if (error || !userRow) throw new Error('Invalid credentials');

  const ok = await bcrypt.compare(password, userRow.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  // Admin login check
  if (isAdminLogin) {
    const emailLower = (userRow.email || '').toLowerCase();
    const configuredLower = ADMIN_EMAIL.toLowerCase();
    const isAdminRole = userRow.role === 'admin';
    const emailMatches = emailLower === configuredLower;
    
    if (!isAdminRole && !emailMatches) {
      console.error('Admin login rejected - role or email mismatch', {
        userEmail: userRow.email,
        userRole: userRow.role,
        expectedAdminEmail: ADMIN_EMAIL,
      });
      throw new Error('Invalid credentials');
    }
  }

  const user = {
    id: userRow.id,
    email: userRow.email,
    firstName: userRow.first_name,
    lastName: userRow.last_name,
    username: userRow.username,
    phone: userRow.phone,
    gender: userRow.gender,
    address: userRow.address,
    postalCode: userRow.postal_code,
    city: userRow.city,
    province: userRow.province,
    profileImage: userRow.profile_image || userRow.profile_image_url || null,
    role: userRow.role,
  };
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
}

async function updateProfile(userId, body) {
  const allowedMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    username: 'username',
    phone: 'phone',
    gender: 'gender',
    address: 'address',
    postalCode: 'postal_code',
    city: 'city',
    province: 'province',
    profileImage: 'profile_image',
    profileImageUrl: 'profile_image_url',
  };

  if (body && body.profileImage && body.profileImage.length > MAX_PROFILE_IMAGE_LEN) {
    throw new Error('Profile image too large. Use a smaller image or provide a profileImageUrl instead.');
  }

  const updates = {};
  for (const key of Object.keys(body || {})) {
    if (allowedMap[key]) {
      updates[allowedMap[key]] = body[key];
    }
  }
  
  if (Object.keys(updates).length === 0) throw new Error('No valid fields to update');

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (updateError) throw updateError;

  const { data: updated, error: fetchError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, username, phone, gender, address, postal_code, city, province, profile_image, profile_image_url, role')
    .eq('id', userId)
    .single();

  if (fetchError || !updated) throw new Error('User not found');

  const user = {
    id: updated.id,
    email: updated.email,
    firstName: updated.first_name,
    lastName: updated.last_name,
    username: updated.username,
    phone: updated.phone,
    gender: updated.gender,
    address: updated.address,
    postalCode: updated.postal_code,
    city: updated.city,
    province: updated.province,
    profileImage: updated.profile_image || updated.profile_image_url || null,
    role: updated.role,
  };
  return { user };
}

export {
  verifyToken,
  requireAdmin,
  requireReseller,
  register,
  login,
  updateProfile,
};