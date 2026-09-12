import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../configs/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/creations.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
};

// Read local creations safely
export const readLocalCreations = () => {
  try {
    ensureDataDir();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading local creations:', err.message);
    return [];
  }
};

// Write local creations safely
export const writeLocalCreations = (creations) => {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(creations, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing local creations:', err.message);
    return false;
  }
};

/**
 * Save Creation (Always saves locally and syncs to Supabase when schema is ready)
 */
export const saveCreation = async (creationData) => {
  const newCreation = {
    id: creationData.id || crypto.randomUUID(),
    user_id: String(creationData.user_id),
    prompt: creationData.prompt || '',
    content: creationData.content || '',
    type: creationData.type || 'article',
    publish: Boolean(creationData.publish),
    likes: Array.isArray(creationData.likes) ? creationData.likes : [],
    created_at: creationData.created_at || new Date().toISOString(),
  };

  // 1. Always persist to local file store
  const localList = readLocalCreations();
  const existingIndex = localList.findIndex((c) => c.id === newCreation.id);
  if (existingIndex >= 0) {
    localList[existingIndex] = newCreation;
  } else {
    localList.unshift(newCreation);
  }
  writeLocalCreations(localList);

  // 2. Try inserting to Supabase table
  try {
    const { error } = await supabaseAdmin.from('creations').insert([newCreation]);
    if (error) {
      console.warn("Notice: creations table insert skipped (schema not ready):", error.message);
    }
  } catch (err) {
    console.warn("Notice: could not save to creations table:", err.message);
  }

  return newCreation;
};

/**
 * Get User Creations
 */
export const getUserCreations = async (userId) => {
  const userIdStr = String(userId);

  // 1. Try fetching from Supabase first
  try {
    const { data, error } = await supabaseAdmin
      .from('creations')
      .select('*')
      .eq('user_id', userIdStr)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase fetch notice:', err.message);
  }

  // 2. Fallback to persistent local storage
  const localList = readLocalCreations();
  return localList.filter((item) => String(item.user_id) === userIdStr);
};

/**
 * Get Published Creations (Community Feed)
 */
export const getPublishedCreations = async () => {
  // 1. Try Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('creations')
      .select('*')
      .eq('publish', true)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase feed fetch notice:', err.message);
  }

  // 2. Fallback to persistent local storage
  const localList = readLocalCreations();
  return localList.filter((item) => item.publish === true);
};

/**
 * Get Single Creation by ID (Public Share / Deep Link)
 */
export const getCreationById = async (id) => {
  if (!id) return null;
  // 1. Try Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('creations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase single creation fetch notice:', err.message);
  }

  // 2. Fallback to local
  const localList = readLocalCreations();
  return localList.find((item) => item.id === id) || null;
};

/**
 * Get All Creations (Admin moderation)
 */
export const getAllCreationsAdmin = async () => {
  // 1. Try Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('creations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase admin fetch notice:', err.message);
  }

  // 2. Fallback to persistent local storage
  return readLocalCreations();
};

/**
 * Toggle Like Creation
 */
export const toggleLikeCreation = async (creationId, userId) => {
  const userIdStr = String(userId);
  const localList = readLocalCreations();
  const itemIndex = localList.findIndex((c) => String(c.id) === String(creationId));

  let updatedLikes = [];
  let isLiked = false;

  if (itemIndex >= 0) {
    const item = localList[itemIndex];
    const currentLikes = Array.isArray(item.likes) ? item.likes : [];
    if (currentLikes.includes(userIdStr)) {
      updatedLikes = currentLikes.filter((u) => u !== userIdStr);
      isLiked = false;
    } else {
      updatedLikes = [...currentLikes, userIdStr];
      isLiked = true;
    }
    localList[itemIndex].likes = updatedLikes;
    writeLocalCreations(localList);
  }

  // Also try updating Supabase
  try {
    await supabaseAdmin
      .from('creations')
      .update({ likes: updatedLikes })
      .eq('id', creationId);
  } catch (err) {
    // Ignore error if table not ready
  }

  return { success: true, message: isLiked ? 'Creation Liked' : 'Creation Unliked', likes: updatedLikes };
};

/**
 * Toggle Publish Creation
 */
export const togglePublishCreation = async (creationId, userId) => {
  const localList = readLocalCreations();
  const itemIndex = localList.findIndex((c) => String(c.id) === String(creationId));

  let newPublishState = false;

  if (itemIndex >= 0) {
    newPublishState = !localList[itemIndex].publish;
    localList[itemIndex].publish = newPublishState;
    writeLocalCreations(localList);
  }

  // Also try Supabase
  try {
    await supabaseAdmin
      .from('creations')
      .update({ publish: newPublishState })
      .eq('id', creationId);
  } catch (err) {
    // Ignore if table not ready
  }

  return { success: true, publish: newPublishState, message: newPublishState ? 'Published to Community' : 'Unpublished from Community' };
};

/**
 * Delete Creation (Strict Ownership Check)
 */
export const deleteCreation = async (creationId, userId, isAdmin = false) => {
  const userIdStr = String(userId);
  const localList = readLocalCreations();
  
  const targetIndex = localList.findIndex((c) => String(c.id) === String(creationId));
  if (targetIndex === -1) {
    return { success: false, message: 'Creation not found', status: 404 };
  }

  const item = localList[targetIndex];
  // Strict Authorization: Caller must own the creation or be an authorized administrator
  if (!isAdmin && String(item.user_id) !== userIdStr) {
    return {
      success: false,
      message: 'Access Denied: You do not have permission to delete this creation.',
      status: 403
    };
  }

  localList.splice(targetIndex, 1);
  writeLocalCreations(localList);

  // Also delete in Supabase with user_id filter if not admin
  try {
    let query = supabaseAdmin.from('creations').delete().eq('id', creationId);
    if (!isAdmin) {
      query = query.eq('user_id', userIdStr);
    }
    await query;
  } catch (err) {
    console.warn("Notice: could not delete from creations table:", err.message);
  }

  return { success: true, message: 'Creation deleted successfully' };
};
