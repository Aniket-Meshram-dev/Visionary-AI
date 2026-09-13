import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Layers,
  Wand2,
  Edit3,
  Save,
  FileDown,
  Printer,
  Eye,
  RefreshCw,
  Sliders,
  Search,
  FolderOpen,
  Trash2,
  Plus,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Award,
  Briefcase,
  Code,
  GraduationCap,
  Loader2,
  Check,
  X,
  Copy,
  ExternalLink,
  HelpCircle,
  Maximize2,
  Info,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResumeLiveCanvas from '../components/ResumeLiveCanvas';
import {
  generateResumePrintableHtml,
  printResumeToPdf,
  exportResumeToDocx,
} from '../utils/resumePdfFormatter';

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const initialResumeData = {
  personal: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    title: '',
  },
  summary: '',
  skills: {
    languages: [],
    frameworks: [],
    cloud_devops: [],
    databases: [],
    tools: [],
  },
  experience: [
    {
      id: 'exp_1',
      role: 'Full Stack Developer',
      company: 'Tech Solutions Inc',
      location: 'Remote',
      startDate: 'Jan 2023',
      endDate: 'Present',
      bullets: [
        'Engineered responsive web applications utilizing React and Node.js for client portals.',
        'Integrated RESTful APIs and PostgreSQL databases for performant data retrieval.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'E-Commerce Platform',
      techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
      liveUrl: 'https://demo.example.com',
      githubUrl: 'https://github.com/example/shop',
      bullets: [
        'Built full-stack e-commerce system supporting product catalog, cart, and payment processing.',
      ],
    },
  ],
  education: [
    {
      id: 'edu_1',
      degree: 'B.S. in Computer Science',
      institution: 'University of Technology',
      year: '2019 – 2023',
      grade: '3.8 GPA',
      highlights: [],
    },
  ],
  certifications: [],
  achievements: [],
};

const ResumeBuilder = () => {
  const { getToken, user } = useAuth();
  const location = useLocation();

  // Primary Mode: 'wizard' (Step-by-Step Interview) vs 'studio' (Live Canvas Editor)
  const [viewMode, setViewMode] = useState('wizard'); // 'wizard' | 'studio'
  const [currentStep, setCurrentStep] = useState(1); // 1: Role & JD, 2: Personal, 3: Experience, 4: Projects, 5: Skills, 6: Education

  // Target Job Information
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Developer');
  const [targetCompany, setTargetCompany] = useState('');
  const [seniority, setSeniority] = useState('Mid-Level');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzingJd, setAnalyzingJd] = useState(false);
  const [jdAnalysis, setJdAnalysis] = useState(null);

  // Resume Document State
  const [resumeData, setResumeData] = useState(initialResumeData);

  // ATS Evaluation Metrics
  const [atsScoreData, setAtsScoreData] = useState({
    atsCompatibilityScore: 88,
    resumeQualityScore: 85,
    jobMatchScore: 82,
    breakdown: {
      keywordMatchScore: 80,
      quantifiableImpactScore: 75,
      actionVerbScore: 92,
      formattingScore: 98,
    },
    matchedKeywords: ['React', 'Node.js', 'PostgreSQL', 'RESTful APIs', 'Git'],
    missingVerifiedSkills: ['Docker', 'AWS', 'Redis', 'CI/CD Pipelines'],
    recruiterVerdict:
      'Strong foundational resume with clean ATS structure. Add verified metrics to 2 bullet points to maximize recruiter shortlisting.',
    strengths: [
      'Clean single-column chronological layout passes all ATS parsers',
      'Solid technical competency section without parsing barriers',
    ],
    improvements: [
      'Quantify the project scale (e.g. number of daily users or database size)',
      'Include Docker or CI/CD experience if verified to match job requirements',
    ],
  });

  // Canvas View Controls
  const [selectedTemplate, setSelectedTemplate] = useState('tech_modern'); // 'tech_modern' | 'harvard' | 'executive'
  const [isOnePage, setIsOnePage] = useState(true);
  const [canvasScale, setCanvasScale] = useState(1.0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResumesList, setSavedResumesList] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Smart Follow-Up Dialog State (Uncovering Honest Metrics)
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [smartTarget, setSmartTarget] = useState(null); // { type: 'experience'|'project', index: 0, title: '' }
  const [smartQuestions, setSmartQuestions] = useState([]);
  const [smartAnswers, setSmartAnswers] = useState({});
  const [smartLoading, setSmartLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);

  // File Upload State (Import Existing Resume)
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  // 1. Analyze Job Description
  const handleAnalyzeJd = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description first.');
      return;
    }
    setAnalyzingJd(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        '/api/ai/resume-builder/analyze-jd',
        { jobDescription, targetRole },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (data.success) {
        setJdAnalysis(data.analysis);
        if (data.analysis.roleTitle && !targetRole) {
          setTargetRole(data.analysis.roleTitle);
        }
        toast.success('Job description analyzed! Key requirements extracted.');
      } else {
        toast.error(data.message || 'Failed to analyze JD');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error analyzing job description');
    } finally {
      setAnalyzingJd(false);
    }
  };

  // 2. Import Existing Resume (PDF, DOCX, TXT)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setUploadedFileName(file.name);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const token = await getToken();
      const { data } = await axios.post('/api/ai/resume-builder/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (data.success && data.parsedResume) {
        setResumeData(data.parsedResume);
        toast.success(`Successfully imported ${file.name}! Review & optimize your information.`);
        setCurrentStep(2); // Jump to Personal info review
      } else {
        toast.error(data.message || 'Failed to parse uploaded document');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not parse resume');
    } finally {
      setUploadingResume(false);
    }
  };

  // 3. Trigger Smart AI Follow-Up Questions (Anti-Hallucination Interrogation)
  const openSmartFollowUp = async (type, index) => {
    const item =
      type === 'experience' ? resumeData.experience[index] : resumeData.projects[index];
    if (!item) return;

    setSmartTarget({
      type,
      index,
      title: type === 'experience' ? `${item.role} at ${item.company}` : item.title,
    });
    setSmartQuestions([]);
    setSmartAnswers({});
    setSmartModalOpen(true);
    setSmartLoading(true);

    try {
      const token = await getToken();
      const { data } = await axios.post(
        '/api/ai/resume-builder/smart-followup',
        {
          sectionType: type,
          itemDetails: item,
          targetRole,
          jobDescription,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (data.success && Array.isArray(data.questions)) {
        setSmartQuestions(data.questions);
      } else {
        toast.error('Could not generate questions.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating questions');
    } finally {
      setSmartLoading(false);
    }
  };

  // 4. Apply Smart Follow-Up Answers to Enrich Section
  const applySmartFollowUpAnswers = async () => {
    if (!smartTarget) return;
    const { type, index } = smartTarget;
    setSmartLoading(true);

    try {
      const token = await getToken();
      const item =
        type === 'experience' ? resumeData.experience[index] : resumeData.projects[index];

      // Format Q&A into prompt instruction
      const qaContext = smartQuestions
        .map((q, i) => `Q: ${q.question}\nA: ${smartAnswers[q.id || i] || 'Not specified'}`)
        .join('\n\n');

      const { data } = await axios.post(
        '/api/ai/resume-builder/improve-section',
        {
          sectionType: type === 'experience' ? 'experience' : 'project',
          content: JSON.stringify(item),
          instruction: `Enhance the bullet points using the Google XYZ formula based strictly on the user's answers below. Do NOT invent numbers that were not provided. If a metric is missing, write the outcome honestly without fake numbers.\n\nUser Answers:\n${qaContext}`,
          targetRole,
          jobDescription,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (data.success && data.improvedContent) {
        // Parse returned improved content or update bullets
        try {
          const parsed = JSON.parse(data.improvedContent);
          setResumeData((prev) => {
            const clone = JSON.parse(JSON.stringify(prev));
            if (type === 'experience') {
              clone.experience[index] = { ...clone.experience[index], ...parsed };
            } else {
              clone.projects[index] = { ...clone.projects[index], ...parsed };
            }
            return clone;
          });
        } catch {
          // If returned as raw text, split into bullets
          const lines = data.improvedContent
            .split('\n')
            .map((l) => l.replace(/^[-*•]\s*/, '').trim())
            .filter(Boolean);
          setResumeData((prev) => {
            const clone = JSON.parse(JSON.stringify(prev));
            if (type === 'experience') {
              clone.experience[index].bullets = lines;
            } else {
              clone.projects[index].bullets = lines;
            }
            return clone;
          });
        }
        toast.success('Section successfully enriched with your real achievements!');
        setSmartModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update section');
    } finally {
      setSmartLoading(false);
    }
  };

  // 5. Full Synthesis of Resume (Anti-Hallucination + ATS Scoring)
  const handleSynthesizeResume = async () => {
    setSynthesizing(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        '/api/ai/resume-builder/synthesize',
        {
          userData: resumeData,
          targetRole,
          targetCompany,
          jobDescription,
          seniority,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (data.success && data.resume) {
        setResumeData(data.resume);
        if (data.scores) {
          setAtsScoreData(data.scores);
        }
        toast.success('Resume synthesized with ATS compliance!');
        setViewMode('studio'); // Switch immediately to live canvas view
      } else {
        toast.error(data.message || 'Failed to synthesize resume');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Synthesis error');
    } finally {
      setSynthesizing(false);
    }
  };

  // 6. Save Resume Version
  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Please sign in to save resume drafts.');
        setIsSaving(false);
        return;
      }

      const { data } = await axios.post(
        '/api/ai/resume-builder/save',
        {
          title: `${resumeData.personal?.fullName || 'My'} - ${targetRole || 'Resume'}`,
          targetRole,
          targetCompany,
          jobDescription,
          resumeData,
          atsScores: atsScoreData,
          template: selectedTemplate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Resume version saved successfully!');
      } else {
        toast.error(data.message || 'Could not save resume');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Vector High-DPI PDF Download
  const handleDownloadPdf = () => {
    try {
      const printableHtml = generateResumePrintableHtml(resumeData, {
        template: selectedTemplate,
        isOnePage,
      });
      printResumeToPdf(printableHtml);
      toast.success('Opening print dialog. Select "Save as PDF" for vector ATS output.');
    } catch (err) {
      toast.error('PDF generation error: ' + err.message);
    }
  };

  // 8. Native Microsoft Word (.DOCX) Download
  const handleDownloadDocx = async () => {
    try {
      const name = (resumeData.personal?.fullName || 'Candidate')
        .toLowerCase()
        .replace(/\s+/g, '_');
      await exportResumeToDocx(resumeData, `${name}_ats_resume.docx`);
      toast.success('Word (.docx) document downloaded!');
    } catch (err) {
      toast.error('DOCX generation error: ' + err.message);
    }
  };

  // 9. Load User Resumes
  const loadUserResumes = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { data } = await axios.get('/api/ai/resume-builder/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setSavedResumesList(data.resumes || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadUserResumes();
  }, [user]);

  // Listen for auto-fixed resume passed from ReviewResume audit page
  useEffect(() => {
    if (location.state?.autoFixedResume) {
      setResumeData(location.state.autoFixedResume);
      if (location.state.atsScores) {
        setAtsScoreData(location.state.atsScores);
      }
      if (location.state.targetRole) {
        setTargetRole(location.state.targetRole);
      }
      if (location.state.targetCompany) {
        setTargetCompany(location.state.targetCompany);
      }
      if (location.state.jobDescription) {
        setJobDescription(location.state.jobDescription);
      }
      if (location.state.seniority) {
        setSeniority(location.state.seniority);
      }
      setViewMode('studio');
      toast.success('🎉 Loaded auto-repaired resume with 95+ ATS score!');
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* TOP STUDIO TOOLBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">AI ATS Resume Builder</h1>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Anti-Hallucination
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === 'wizard' ? 'Intake & Smart Follow-Up Mode' : 'Live A4 Canvas & Recruiter Audit'}
            </p>
          </div>

          {/* View Mode Toggle Pill */}
          <div className="ml-4 bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('wizard')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'wizard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Interview Wizard
            </button>
            <button
              type="button"
              onClick={() => setViewMode('studio')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'studio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Canvas & Audit
            </button>
          </div>
        </div>

        {/* Center: ATS Score Bar Preview (Realistic Terminology) */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-900/90 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">ATS Compatibility:</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                atsScoreData.atsCompatibilityScore >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {atsScoreData.atsCompatibilityScore}/100
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Quality Score:</span>
            <span className="text-xs font-bold text-slate-200">
              {atsScoreData.resumeQualityScore}/100
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Job Match:</span>
            <span className="text-xs font-bold text-indigo-300">
              {atsScoreData.jobMatchScore}/100
            </span>
          </div>
        </div>

        {/* Right: Actions & Dual Export */}
        <div className="flex items-center gap-2">
          {savedResumesList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSavedModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              title="Saved Resumes"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Resumes</span> ({savedResumesList.length})
            </button>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveResume}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-indigo-400" />}
            Save Draft
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center rounded-xl bg-indigo-600 hover:bg-indigo-500 transition shadow-sm overflow-hidden text-xs font-semibold text-white">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 flex items-center gap-1.5 border-r border-indigo-700 hover:bg-indigo-700/50 transition"
              title="Export Vector PDF (Workday & Greenhouse Compliant)"
            >
              <Printer className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              className="px-2.5 py-1.5 hover:bg-indigo-700/50 transition flex items-center gap-1"
              title="Download Microsoft Word (.DOCX)"
            >
              <FileDown className="w-3.5 h-3.5" />
              DOCX
            </button>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      {viewMode === 'wizard' ? (
        /* WIZARD MODE: Multi-Step Intake & Smart Follow-Up Interrogation */
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Wizard Header Bar & Import Trigger */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Step-by-Step ATS Optimization</h2>
              <p className="text-xs text-slate-400 mt-1">
                Provide your background details or import an existing PDF/DOCX. AI will ask smart questions to uncover real metrics.
              </p>
            </div>

            {/* Resume Upload Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingResume}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2 shadow-sm"
              >
                {uploadingResume ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                )}
                {uploadedFileName ? `Imported: ${uploadedFileName}` : 'Import Existing PDF / DOCX'}
              </button>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 overflow-x-auto text-xs gap-2">
            {[
              { num: 1, label: 'Target Job & JD' },
              { num: 2, label: 'Contact Info' },
              { num: 3, label: 'Work Experience' },
              { num: 4, label: 'Projects' },
              { num: 5, label: 'Skills & Match' },
              { num: 6, label: 'Education & Honors' },
            ].map((st) => (
              <button
                key={st.num}
                type="button"
                onClick={() => setCurrentStep(st.num)}
                className={`flex items-center gap-2 pb-1 border-b-2 font-medium transition shrink-0 ${
                  currentStep === st.num
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === st.num ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {st.num}
                </span>
                {st.label}
              </button>
            ))}
          </div>

          {/* STEP 1: TARGET JOB & JOB DESCRIPTION */}
          {currentStep === 1 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-white">Target Job & Job Description</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste the job posting to identify critical keywords, required technologies, and recruiter benchmarks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role Title</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Company (Optional)</label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, or Stealth Startup"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seniority Level</label>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option>Intern / Student</option>
                    <option>Entry-Level (0-2 yrs)</option>
                    <option>Mid-Level (3-5 yrs)</option>
                    <option>Senior / Staff (6+ yrs)</option>
                    <option>Lead / Principal / Architect</option>
                  </select>
                </div>
              </div>

              {/* JD Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Paste Job Description (JD)
                  </label>
                  <button
                    type="button"
                    disabled={analyzingJd || !jobDescription.trim()}
                    onClick={handleAnalyzeJd}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {analyzingJd ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Analyze JD & Extract Keywords
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description requirements, responsibilities, and qualifications here..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-y font-mono"
                />
              </div>

              {/* JD Analysis Card */}
              {jdAnalysis && (
                <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Identified Job Requirements:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(jdAnalysis.hardSkills || []).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-indigo-900/50 text-indigo-200 border border-indigo-700/50 rounded-md text-[11px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ATS will cross-check your authentic experience against these high-priority keywords.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PERSONAL & CONTACT INFO */}
          {currentStep === 2 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-white">Contact & Header Details</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ensure accurate contact details. Only standard phone, email, and clean profile links are ATS compliant.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.personal.fullName}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, fullName: e.target.value },
                      })
                    }
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={resumeData.personal.title || targetRole}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, title: e.target.value },
                      })
                    }
                    placeholder="Full Stack Engineer"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={resumeData.personal.email}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, email: e.target.value },
                      })
                    }
                    placeholder="janedoe@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={resumeData.personal.phone}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, phone: e.target.value },
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={resumeData.personal.location}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, location: e.target.value },
                      })
                    }
                    placeholder="San Francisco, CA (or Remote)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={resumeData.personal.linkedin}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, linkedin: e.target.value },
                      })
                    }
                    placeholder="linkedin.com/in/username"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Profile</label>
                  <input
                    type="text"
                    value={resumeData.personal.github}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, github: e.target.value },
                      })
                    }
                    placeholder="github.com/username"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Portfolio / Personal Site</label>
                  <input
                    type="text"
                    value={resumeData.personal.portfolio}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, portfolio: e.target.value },
                      })
                    }
                    placeholder="https://myportfolio.dev"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Professional Summary (Optional / Auto-Generated)
                </label>
                <textarea
                  rows={3}
                  value={resumeData.summary}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  placeholder="Leave empty or provide high-level career summary. AI will polish it during synthesis."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: WORK EXPERIENCE */}
          {currentStep === 3 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Work Experience & Internships</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Ask AI to Uncover Metrics" on any role to convert basic job tasks into Google XYZ formula achievements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setResumeData({
                      ...resumeData,
                      experience: [
                        ...resumeData.experience,
                        {
                          id: `exp_${Date.now()}`,
                          role: '',
                          company: '',
                          location: '',
                          startDate: '',
                          endDate: 'Present',
                          bullets: [''],
                        },
                      ],
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience
                </button>
              </div>

              <div className="space-y-6">
                {resumeData.experience.map((exp, expIdx) => (
                  <div
                    key={exp.id || expIdx}
                    className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Position #{expIdx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Smart AI Interrogation Button */}
                        <button
                          type="button"
                          onClick={() => openSmartFollowUp('experience', expIdx)}
                          className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Ask AI to Uncover Metrics
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const clone = [...resumeData.experience];
                            clone.splice(expIdx, 1);
                            setResumeData({ ...resumeData, experience: clone });
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const clone = [...resumeData.experience];
                            clone[expIdx].role = e.target.value;
                            setResumeData({ ...resumeData, experience: clone });
                          }}
                          placeholder="Software Engineer"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const clone = [...resumeData.experience];
                            clone[expIdx].company = e.target.value;
                            setResumeData({ ...resumeData, experience: clone });
                          }}
                          placeholder="Acme Corp"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Dates</label>
                        <input
                          type="text"
                          value={`${exp.startDate || ''} – ${exp.endDate || ''}`}
                          onChange={(e) => {
                            const parts = e.target.value.split('–');
                            const clone = [...resumeData.experience];
                            clone[expIdx].startDate = (parts[0] || '').trim();
                            clone[expIdx].endDate = (parts[1] || '').trim();
                            setResumeData({ ...resumeData, experience: clone });
                          }}
                          placeholder="Jan 2023 – Present"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => {
                            const clone = [...resumeData.experience];
                            clone[expIdx].location = e.target.value;
                            setResumeData({ ...resumeData, experience: clone });
                          }}
                          placeholder="Remote / City"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-400">
                        Bullet Points (Responsibilities & Verified Outcomes)
                      </label>
                      {(exp.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => {
                              const clone = [...resumeData.experience];
                              clone[expIdx].bullets[bIdx] = e.target.value;
                              setResumeData({ ...resumeData, experience: clone });
                            }}
                            placeholder="e.g. Developed high-throughput REST API using Express..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const clone = [...resumeData.experience];
                              clone[expIdx].bullets.splice(bIdx, 1);
                              setResumeData({ ...resumeData, experience: clone });
                            }}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const clone = [...resumeData.experience];
                          clone[expIdx].bullets = clone[expIdx].bullets || [];
                          clone[expIdx].bullets.push('');
                          setResumeData({ ...resumeData, experience: clone });
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Bullet Point
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PROJECTS */}
          {currentStep === 4 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Technical Projects</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Showcase engineering rigor, architecture choices, and solved challenges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setResumeData({
                      ...resumeData,
                      projects: [
                        ...resumeData.projects,
                        {
                          id: `proj_${Date.now()}`,
                          title: '',
                          techStack: [],
                          liveUrl: '',
                          githubUrl: '',
                          bullets: [''],
                        },
                      ],
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              <div className="space-y-6">
                {resumeData.projects.map((proj, projIdx) => (
                  <div
                    key={proj.id || projIdx}
                    className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Project #{projIdx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Smart AI Interrogation Button for Project */}
                        <button
                          type="button"
                          onClick={() => openSmartFollowUp('project', projIdx)}
                          className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Ask AI to Uncover Tech Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const clone = [...resumeData.projects];
                            clone.splice(projIdx, 1);
                            setResumeData({ ...resumeData, projects: clone });
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Project Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const clone = [...resumeData.projects];
                            clone[projIdx].title = e.target.value;
                            setResumeData({ ...resumeData, projects: clone });
                          }}
                          placeholder="Real-Time Collaboration App"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Technologies Used (Comma Separated)
                        </label>
                        <input
                          type="text"
                          value={proj.techStack?.join(', ') || ''}
                          onChange={(e) => {
                            const clone = [...resumeData.projects];
                            clone[projIdx].techStack = e.target.value
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean);
                            setResumeData({ ...resumeData, projects: clone });
                          }}
                          placeholder="React, WebSocket, Node.js, Redis"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">GitHub or Live URL</label>
                        <input
                          type="text"
                          value={proj.githubUrl || proj.liveUrl || ''}
                          onChange={(e) => {
                            const clone = [...resumeData.projects];
                            clone[projIdx].githubUrl = e.target.value;
                            setResumeData({ ...resumeData, projects: clone });
                          }}
                          placeholder="https://github.com/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-400">
                        Project Highlights & Solved Problems
                      </label>
                      {(proj.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => {
                              const clone = [...resumeData.projects];
                              clone[projIdx].bullets[bIdx] = e.target.value;
                              setResumeData({ ...resumeData, projects: clone });
                            }}
                            placeholder="e.g. Architected pub/sub websocket event architecture handling concurrent updates..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const clone = [...resumeData.projects];
                              clone[projIdx].bullets.splice(bIdx, 1);
                              setResumeData({ ...resumeData, projects: clone });
                            }}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const clone = [...resumeData.projects];
                          clone[projIdx].bullets = clone[projIdx].bullets || [];
                          clone[projIdx].bullets.push('');
                          setResumeData({ ...resumeData, projects: clone });
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Project Bullet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: SKILLS & VERIFICATION */}
          {currentStep === 5 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-white">Technical Skills (Anti-Hallucination Verified)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Categorized skills for flawless ATS categorization. We strictly only include skills you actually possess.
                </p>
              </div>

              {/* Truth Verification System for Missing JD Skills */}
              {atsScoreData.missingVerifiedSkills?.length > 0 && (
                <div className="p-5 bg-gradient-to-r from-amber-950/30 to-orange-950/20 border border-amber-800/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Truth Verification System: Job Description Skills Check
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Strict Zero-Hallucination
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    The target Job Description requests these skills. QuickAI will <strong>NEVER</strong> automatically fake them. Confirm whether you have genuine experience:
                  </p>

                  <div className="space-y-2 pt-1">
                    {atsScoreData.missingVerifiedSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{skill}</span>
                          <span className="text-[10px] text-slate-400">Required by job posting</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setResumeData((prev) => {
                                const clone = JSON.parse(JSON.stringify(prev));
                                clone.skills = clone.skills || {};
                                clone.skills.tools = clone.skills.tools || [];
                                if (!clone.skills.tools.includes(skill)) {
                                  clone.skills.tools.push(skill);
                                }
                                return clone;
                              });
                              setAtsScoreData((prev) => ({
                                ...prev,
                                missingVerifiedSkills: prev.missingVerifiedSkills.filter((s) => s !== skill),
                                matchedKeywords: [...(prev.matchedKeywords || []), skill],
                              }));
                              toast.success(`Verified: Added ${skill} to your genuine skills!`);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Yes, I have used it
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResumeData((prev) => {
                                const clone = JSON.parse(JSON.stringify(prev));
                                clone.skills = clone.skills || {};
                                clone.skills.tools = clone.skills.tools || [];
                                const labeled = `${skill} (Basic)`;
                                if (!clone.skills.tools.includes(labeled)) {
                                  clone.skills.tools.push(labeled);
                                }
                                return clone;
                              });
                              setAtsScoreData((prev) => ({
                                ...prev,
                                missingVerifiedSkills: prev.missingVerifiedSkills.filter((s) => s !== skill),
                              }));
                              toast.success(`Added ${skill} with basic knowledge note.`);
                            }}
                            className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Basic knowledge
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAtsScoreData((prev) => ({
                                ...prev,
                                missingVerifiedSkills: prev.missingVerifiedSkills.filter((s) => s !== skill),
                              }));
                              toast('Skill omitted to maintain strict resume honesty.');
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> No (Omit)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {[
                  { key: 'languages', label: 'Programming Languages', placeholder: 'JavaScript, TypeScript, Python, Go, SQL' },
                  { key: 'frameworks', label: 'Frameworks & Libraries', placeholder: 'React, Node.js, Express, Next.js, Redux, Tailwind CSS' },
                  { key: 'cloud_devops', label: 'Cloud & DevOps', placeholder: 'AWS (S3, EC2), Docker, GitHub Actions, Kubernetes' },
                  { key: 'databases', label: 'Databases & Storage', placeholder: 'PostgreSQL, MongoDB, Redis, Supabase' },
                  { key: 'tools', label: 'Tools, Protocols & Architecture', placeholder: 'Git, REST APIs, GraphQL, Microservices, Jest' },
                ].map((cat) => (
                  <div key={cat.key}>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{cat.label}</label>
                    <input
                      type="text"
                      value={resumeData.skills?.[cat.key]?.join(', ') || ''}
                      onChange={(e) => {
                        const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setResumeData({
                          ...resumeData,
                          skills: { ...resumeData.skills, [cat.key]: arr },
                        });
                      }}
                      placeholder={cat.placeholder}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: EDUCATION & HONORS */}
          {currentStep === 6 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-white">Education & Certifications</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Degrees, verified certifications, honors, and hackathon wins.
                </p>
              </div>

              {/* Education list */}
              <div className="space-y-4">
                {resumeData.education.map((edu, eduIdx) => (
                  <div key={edu.id || eduIdx} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Degree / Major</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const clone = [...resumeData.education];
                            clone[eduIdx].degree = e.target.value;
                            setResumeData({ ...resumeData, education: clone });
                          }}
                          placeholder="B.S. in Computer Science"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">University / College</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const clone = [...resumeData.education];
                            clone[eduIdx].institution = e.target.value;
                            setResumeData({ ...resumeData, education: clone });
                          }}
                          placeholder="Stanford University"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Year</label>
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => {
                            const clone = [...resumeData.education];
                            clone[eduIdx].year = e.target.value;
                            setResumeData({ ...resumeData, education: clone });
                          }}
                          placeholder="2020 – 2024"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">GPA / Score</label>
                        <input
                          type="text"
                          value={edu.grade}
                          onChange={(e) => {
                            const clone = [...resumeData.education];
                            clone[eduIdx].grade = e.target.value;
                            setResumeData({ ...resumeData, education: clone });
                          }}
                          placeholder="3.9 / 4.0"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Certifications Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Certifications (One per line or comma separated)
                </label>
                <input
                  type="text"
                  value={resumeData.certifications?.map((c) => c.name).join(', ') || ''}
                  onChange={(e) => {
                    const names = e.target.value.split(',').map((n) => n.trim()).filter(Boolean);
                    setResumeData({
                      ...resumeData,
                      certifications: names.map((name) => ({ name, issuer: '', year: '' })),
                    });
                  }}
                  placeholder="AWS Certified Solutions Architect, Meta Front-End Developer"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              {/* Ready to Synthesize Banner */}
              <div className="p-5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-700/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Ready to Synthesize ATS Resume?
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    AI will format all bullets with the Google XYZ formula and calculate your transparent ATS scores.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={synthesizing}
                  onClick={handleSynthesizeResume}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition shrink-0"
                >
                  {synthesizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" /> Synthesize & Open Studio
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Step
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-sm"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('studio')}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
              >
                Go to Live Studio Canvas <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* STUDIO MODE: Split Screen with ATS Audit Breakdown & Live Canvas */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel: Transparent ATS Recruiter Scorecard */}
          <aside className="w-full lg:w-96 bg-slate-950 border-r border-slate-800 p-5 overflow-y-auto space-y-6 shrink-0 max-h-[calc(100vh-60px)]">
            {/* Scorecard Hero */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  ATS Score Analysis
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Parsing Certified
                </span>
              </div>

              {/* 3 Metric Gauges */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="text-xl font-extrabold text-emerald-400">
                    {atsScoreData.atsCompatibilityScore}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">ATS Score</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="text-xl font-extrabold text-indigo-400">
                    {atsScoreData.resumeQualityScore}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Quality</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="text-xl font-extrabold text-violet-400">
                    {atsScoreData.jobMatchScore}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Job Match</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic leading-relaxed pt-1">
                "{atsScoreData.recruiterVerdict}"
              </p>
            </div>

            {/* Transparent Score Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                Transparent Breakdown
              </h4>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Keyword Match</span>
                    <span className="font-bold text-slate-200">
                      {atsScoreData.breakdown?.keywordMatchScore || 80}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${atsScoreData.breakdown?.keywordMatchScore || 80}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Quantifiable Impact</span>
                    <span className="font-bold text-slate-200">
                      {atsScoreData.breakdown?.quantifiableImpactScore || 75}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${atsScoreData.breakdown?.quantifiableImpactScore || 75}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Action Verb Quality</span>
                    <span className="font-bold text-slate-200">
                      {atsScoreData.breakdown?.actionVerbScore || 90}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${atsScoreData.breakdown?.actionVerbScore || 90}%` }}
                      className="h-full bg-violet-500 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>ATS Parser Safety</span>
                    <span className="font-bold text-slate-200">
                      {atsScoreData.breakdown?.formattingScore || 98}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${atsScoreData.breakdown?.formattingScore || 98}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Missing Verified Skills Widget */}
            {atsScoreData.missingVerifiedSkills?.length > 0 && (
              <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Missing Verified Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {atsScoreData.missingVerifiedSkills.map((sk, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setResumeData((prev) => {
                          const clone = JSON.parse(JSON.stringify(prev));
                          clone.skills = clone.skills || {};
                          clone.skills.tools = clone.skills.tools || [];
                          if (!clone.skills.tools.includes(sk)) {
                            clone.skills.tools.push(sk);
                          }
                          return clone;
                        });
                        toast.success(`Added ${sk} to your verified skills!`);
                      }}
                      className="text-[10px] bg-amber-500/10 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 transition"
                      title="Click to add if you actually know this skill"
                    >
                      <Plus className="w-2.5 h-2.5" /> {sk}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Re-Synthesize / Re-Evaluate Button */}
            <button
              type="button"
              disabled={synthesizing}
              onClick={handleSynthesizeResume}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              {synthesizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Re-Synthesize with AI
            </button>
          </aside>

          {/* Center / Right: Live Canvas with Toolbar */}
          <main className="flex-1 bg-slate-900/60 overflow-y-auto flex flex-col items-center">
            {/* Canvas Action Bar */}
            <div className="w-full sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              {/* Template Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Template:</span>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none font-medium"
                >
                  <option value="tech_modern">Silicon Valley Modern (Clean Sans)</option>
                  <option value="harvard">Harvard Classic (Serif Academic)</option>
                  <option value="executive">Executive Minimalist (Formal Slate)</option>
                </select>
              </div>

              {/* 1-Page Fit Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isOnePage}
                    onChange={(e) => setIsOnePage(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                  />
                  <span>Auto-Fit to 1 Page</span>
                </label>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setCanvasScale((s) => Math.max(0.7, s - 0.1))}
                  className="p-1 hover:text-white text-slate-400"
                >
                  -
                </button>
                <span className="px-1 text-slate-300 font-mono text-[11px]">
                  {Math.round(canvasScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setCanvasScale((s) => Math.min(1.3, s + 0.1))}
                  className="p-1 hover:text-white text-slate-400"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasScale(1.0)}
                  className="ml-1 text-[10px] text-indigo-400 hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* The Live Editable A4 Canvas */}
            <div className="w-full flex-1 overflow-x-auto p-4 sm:p-8 flex justify-center">
              <ResumeLiveCanvas
                resumeData={resumeData}
                onChange={setResumeData}
                template={selectedTemplate}
                isOnePage={isOnePage}
                scale={canvasScale}
                targetRole={targetRole}
                jobDescription={jobDescription}
              />
            </div>
          </main>
        </div>
      )}

      {/* SMART AI FOLLOW-UP MODAL (Uncovering Real Metrics Without Hallucinations) */}
      {smartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl max-w-xl w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Follow-Up: Uncover Real Metrics</h3>
                  <p className="text-xs text-slate-400">{smartTarget?.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmartModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {smartLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Formulating targeted questions to uncover your accomplishments...</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-xl text-xs text-indigo-300">
                  <strong>Zero-Hallucination Policy:</strong> QuickAI never fabricates metrics. Answer honestly—even approximate estimates help recruiters understand your impact!
                </div>

                {smartQuestions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      {qIdx + 1}. {q.question}
                    </label>
                    <input
                      type="text"
                      value={smartAnswers[q.id || qIdx] || ''}
                      onChange={(e) =>
                        setSmartAnswers({ ...smartAnswers, [q.id || qIdx]: e.target.value })
                      }
                      placeholder={q.hint || 'Your answer (or leave blank if not applicable)'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSmartModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applySmartFollowUpAnswers}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Enhance Bullets with My Answers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVED RESUMES MODAL */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl max-w-lg w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                Saved Resume Versions
              </h3>
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {savedResumesList.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl flex items-center justify-between gap-3 transition"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{res.title || 'Untitled Resume'}</h5>
                    <p className="text-[11px] text-slate-400">
                      {res.targetRole} {res.targetCompany ? `@ ${res.targetCompany}` : ''} • ATS {res.atsScores?.atsCompatibilityScore || 85}/100
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (res.resumeData) {
                        setResumeData(res.resumeData);
                        if (res.atsScores) setAtsScoreData(res.atsScores);
                        if (res.targetRole) setTargetRole(res.targetRole);
                        if (res.targetCompany) setTargetCompany(res.targetCompany);
                        if (res.jobDescription) setJobDescription(res.jobDescription);
                        if (res.template) setSelectedTemplate(res.template);
                        toast.success('Resume loaded into studio!');
                        setShowSavedModal(false);
                        setViewMode('studio');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
