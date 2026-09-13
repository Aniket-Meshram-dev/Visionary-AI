import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../configs/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESUMES_FILE = path.join(__dirname, '../data/resumes.json');

const ensureResumeDataDir = () => {
  const dir = path.dirname(RESUMES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(RESUMES_FILE)) {
    fs.writeFileSync(RESUMES_FILE, '[]', 'utf8');
  }
};

export const readLocalResumes = () => {
  try {
    ensureResumeDataDir();
    const data = fs.readFileSync(RESUMES_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading local resumes:', err.message);
    return [];
  }
};

export const writeLocalResumes = (resumes) => {
  try {
    ensureResumeDataDir();
    fs.writeFileSync(RESUMES_FILE, JSON.stringify(resumes, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing local resumes:', err.message);
    return false;
  }
};

export const saveResumeRecord = async (resumeData) => {
  const id = resumeData.id || crypto.randomUUID();
  const newResume = {
    id,
    user_id: String(resumeData.user_id),
    title: resumeData.title || 'Untitled Resume',
    target_role: resumeData.target_role || '',
    target_company: resumeData.target_company || '',
    job_description: resumeData.job_description || '',
    jd_analysis: resumeData.jd_analysis || {},
    resume_data: resumeData.resume_data || {},
    ats_score: typeof resumeData.ats_score === 'number' ? resumeData.ats_score : 85,
    ats_breakdown: resumeData.ats_breakdown || {},
    template_id: resumeData.template_id || 'tech_modern',
    is_one_page: resumeData.is_one_page !== false,
    created_at: resumeData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const localResumes = readLocalResumes();
  const existingIdx = localResumes.findIndex((r) => r.id === id);

  if (existingIdx >= 0) {
    localResumes[existingIdx] = { ...localResumes[existingIdx], ...newResume, updated_at: new Date().toISOString() };
  } else {
    localResumes.unshift(newResume);
  }

  writeLocalResumes(localResumes);

  // Sync to Supabase if table exists
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('resumes').upsert([newResume]);
    } catch (e) {
      // Graceful fallback to local storage
    }
  }

  return newResume;
};

export const getUserResumesList = async (userId) => {
  const local = readLocalResumes();
  return local.filter((r) => String(r.user_id) === String(userId));
};

export const getResumeById = async (id, userId) => {
  const local = readLocalResumes();
  return local.find((r) => r.id === id && (!userId || String(r.user_id) === String(userId)));
};

export const deleteResumeById = async (id, userId) => {
  const local = readLocalResumes();
  const filtered = local.filter((r) => !(r.id === id && String(r.user_id) === String(userId)));
  writeLocalResumes(filtered);
  return true;
};
