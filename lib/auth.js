/* eslint-env node */
const supabase = require('./supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billsnack.id';
const MAX_PROFILE_IMAGE_LEN = 2_000_000;

async function register({ email, password, firstName, lastName, username, phone, gender, profileImage, profileImageUrl }) {
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

async function login({ email, password, admin }) {
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
  const isAdminLogin = admin;
  if (isAdminLogin) {
    const emailLower = (userRow.email || '').toLowerCase();
    const configuredLower = ADMIN_EMAIL.toLowerCase();
    const isAdminRole = userRow.role === 'admin';
    const emailMatches = emailLower === configuredLower;

    if (!isAdminRole && !emailMatches) {
      throw new Error('Admin login rejected - role or email mismatch');
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
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, username, phone, gender, address, postal_code, city, province, profile_image, profile_image_url, role')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    username: data.username,
    phone: data.phone,
    gender: data.gender,
    address: data.address,
    postalCode: data.postal_code,
    city: data.city,
    province: data.province,
    profileImage: data.profile_image || data.profile_image_url || null,
    role: data.role,
  };
}

function verifyToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
}

async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update({
      first_name: updates.firstName,
      last_name: updates.lastName,
      username: updates.username,
      phone: updates.phone,
      gender: updates.gender,
      address: updates.address,
      postal_code: updates.postalCode,
      city: updates.city,
      province: updates.province,
      profile_image: updates.profileImage,
      profile_image_url: updates.profileImageUrl,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    username: data.username,
    phone: data.phone,
    gender: data.gender,
    address: data.address,
    postalCode: data.postal_code,
    city: data.city,
    province: data.province,
    profileImage: data.profile_image || data.profile_image_url || null,
  };
}

module.exports = { register, login, getProfile, verifyToken, updateProfile };