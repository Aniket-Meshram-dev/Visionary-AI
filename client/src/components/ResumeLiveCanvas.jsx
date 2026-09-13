import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  Wand2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const ResumeLiveCanvas = ({
  resumeData,
  onChange,
  template = 'tech_modern', // 'tech_modern' | 'harvard' | 'executive'
  isOnePage = true,
  scale = 1.0,
  targetRole = '',
  jobDescription = '',
}) => {
  // Inline Copilot State for Bullets
  const [copilotOpen, setCopilotOpen] = useState(null); // { type: 'exp'|'proj', parentIdx: 0, bulletIdx: 0, currentText: '' }
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotSuggestion, setCopilotSuggestion] = useState('');
  const [copilotNotes, setCopilotNotes] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [metricPromptInput, setMetricPromptInput] = useState('');
  const [showMetricInput, setShowMetricInput] = useState(false);

  const personal = resumeData?.personal || {};
  const summary = resumeData?.summary || '';
  const skills = resumeData?.skills || {};
  const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const projects = Array.isArray(resumeData?.projects) ? resumeData.projects : [];
  const education = Array.isArray(resumeData?.education) ? resumeData.education : [];
  const certifications = Array.isArray(resumeData?.certifications) ? resumeData.certifications : [];
  const achievements = Array.isArray(resumeData?.achievements) ? resumeData.achievements : [];

  // Helper updater
  const updateData = (updater) => {
    if (typeof onChange === 'function') {
      const clone = JSON.parse(JSON.stringify(resumeData || {}));
      updater(clone);
      onChange(clone);
    }
  };

  // 10 ATS-Certified Template Themes
  const getTheme = (t) => {
    switch (t) {
      case 'harvard':
        return {
          fontClass: 'font-serif',
          headerClass: 'mb-3 text-center border-b-2 border-slate-900 pb-2',
          nameClass: 'text-2xl text-center uppercase tracking-wider text-slate-950 font-bold',
          roleClass: 'text-center uppercase tracking-widest text-[11px] text-slate-700 font-medium',
          contactClass: 'justify-center text-slate-600',
          contactLinkClass: 'text-slate-900 underline',
          sectionTitleStyle: 'text-xs uppercase font-bold tracking-widest text-slate-900 border-b border-slate-900 pb-0.5 mb-2 mt-3 text-center',
          bulletClass: 'text-slate-800',
        };
      case 'executive':
        return {
          fontClass: 'font-sans',
          headerClass: 'mb-3 border-b-2 border-slate-800 pb-2',
          nameClass: 'text-2xl tracking-tight text-slate-900 font-extrabold uppercase',
          roleClass: 'text-slate-700 font-bold uppercase tracking-wider text-xs',
          contactClass: 'justify-start text-slate-600',
          contactLinkClass: 'text-slate-900 font-medium',
          sectionTitleStyle: 'text-xs uppercase font-bold tracking-wider text-slate-900 border-b-2 border-slate-800 pb-0.5 mb-2 mt-3',
          bulletClass: 'text-slate-800',
        };
      case 'minimal_clean':
        return {
          fontClass: 'font-sans',
          headerClass: 'mb-3 pb-1',
          nameClass: 'text-2xl tracking-tight text-slate-800 font-semibold',
          roleClass: 'text-slate-500 font-normal text-xs',
          contactClass: 'justify-start text-slate-500',
          contactLinkClass: 'text-slate-700',
          sectionTitleStyle: 'text-xs uppercase font-semibold tracking-widest text-slate-700 border-b border-slate-200 pb-0.5 mb-2 mt-3',
          bulletClass: 'text-slate-700',
        };
      case 'corporate_formal':
        return {
          fontClass: 'font-serif',
          headerClass: 'mb-3 text-center border-b-2 border-double border-blue-950 pb-2',
          nameClass: 'text-2xl text-center uppercase tracking-wider text-blue-950 font-bold',
          roleClass: 'text-center uppercase tracking-widest text-[11px] text-blue-900 font-semibold',
          contactClass: 'justify-center text-slate-700',
          contactLinkClass: 'text-blue-950 underline',
          sectionTitleStyle: 'text-xs uppercase font-bold tracking-widest text-blue-950 border-b border-blue-900/40 pb-0.5 mb-2 mt-3 text-center',
          bulletClass: 'text-slate-800',
        };
      case 'modern_teal':
        return {
          fontClass: 'font-sans',
          headerClass: 'mb-3 border-b border-teal-200 pb-2',
          nameClass: 'text-2xl tracking-tight text-slate-950 font-bold',
          roleClass: 'text-teal-700 font-semibold text-xs',
          contactClass: 'justify-start text-slate-600',
          contactLinkClass: 'text-teal-700 font-medium',
          sectionTitleStyle: 'text-xs uppercase font-bold tracking-wider text-teal-800 border-b border-teal-300 pb-0.5 mb-2 mt-3',
          bulletClass: 'text-slate-700',
        };
      case 'emerald_compact':
        return {
          fontClass: 'font-sans',
          headerClass: 'mb-2 border-b border-emerald-200 pb-1.5',
          nameClass: 'text-xl tracking-tight text-slate-950 font-bold',
          roleClass: 'text-emerald-700 font-semibold text-xs',
          contactClass: 'justify-start text-slate-600 text-[10.5px]',
          contactLinkClass: 'text-emerald-700 font-medium',
          sectionTitleStyle: 'text-[11px] uppercase font-bold tracking-wider text-emerald-800 border-b border-emerald-300 pb-0.5 mb-1.5 mt-2',
          bulletClass: 'text-slate-700',
        };
      case 'monochrome_bold':
        return {
          fontClass: 'font-sans',
          headerClass: 'mb-3 border-b-2 border-black pb-2',
          nameClass: 'text-2xl tracking-tight text-black font-extrabold uppercase',
          roleClass: 'text-black font-bold uppercase tracking-wider text-xs',
          contactClass: 'justify-start text-black',
          contactLinkClass: 'text-black font-bold underline',
          sectionTitleStyle: 'text-xs uppercase font-extrabold tracking-wider text-black border-b-2 border-black pb-0.5 mb-2 mt-3',
          bulletClass: 'text-black',
        };
      case 'creative_indigo':
        return {
          fontClass: 'font-sans',
          headerClass: 'mb-3 border-l-4 border-indigo-600 pl-3 py-1',
          nameClass: 'text-2xl tracking-tight text-slate-950 font-bold',
          roleClass: 'text-indigo-600 font-semibold text-xs',
          contactClass: 'justify-start text-slate-600',
          contactLinkClass: 'text-indigo-600 font-medium',
          sectionTitleStyle: 'text-xs uppercase font-bold tracking-wider text-indigo-900 border-l-4 border-indigo-500 pl-2 mb-2 mt-3',
          bulletClass: 'text-slate-700',
        };
      case 'classic_serif':
        return {
          fontClass: 'font-serif',
          headerClass: 'mb-3 text-center border-b border-stone-800 pb-2',
          nameClass: 'text-2xl text-center tracking-normal text-stone-950 font-serif font-bold',
          roleClass: 'text-center uppercase tracking-widest text-[11px] text-stone-700 font-medium',
          contactClass: 'justify-center text-stone-700',
          contactLinkClass: 'text-stone-900 underline',
          sectionTitleStyle: 'text-xs uppercase font-bold tracking-widest text-stone-900 border-b border-stone-400 pb-0.5 mb-2 mt-3 text-center',
          bulletClass: 'text-stone-800',
        };
      case 'tech_modern':
      default:
        return {
          fontClass: 'font-sans',
          headerClass: 'mb-3',
          nameClass: 'text-2xl tracking-tight text-slate-950 font-bold',
          roleClass: 'text-indigo-600 font-semibold text-xs',
          contactClass: 'justify-start text-slate-600',
          contactLinkClass: 'text-indigo-600 font-medium',
          sectionTitleStyle: 'text-xs uppercase font-bold tracking-wider text-indigo-700 border-b border-indigo-200 pb-0.5 mb-2 mt-3',
          bulletClass: 'text-slate-700',
        };
    }
  };

  const theme = getTheme(template);
  const isHarvard = template === 'harvard' || template === 'corporate_formal' || template === 'classic_serif';
  const isExecutive = template === 'executive' || template === 'monochrome_bold';
  const fontClass = theme.fontClass;
  const sectionTitleStyle = theme.sectionTitleStyle;

  // Call API for bullet improvement
  const handleImproveBullet = async (instruction, userMetric = '') => {
    if (!copilotOpen) return;
    setCopilotLoading(true);
    setCopilotSuggestion('');
    setCopilotNotes('');

    try {
      let finalInstruction = instruction;
      if (userMetric) {
        finalInstruction += ` The user provided this real metric/data: "${userMetric}". Incorporate it honestly without exaggeration.`;
      }

      const { data } = await axios.post('/api/ai/resume-builder/improve-section', {
        sectionType: 'bullet',
        content: copilotOpen.currentText,
        instruction: finalInstruction,
        targetRole,
        jobDescription,
      });

      if (data.success) {
        setCopilotSuggestion(data.improvedContent);
        setCopilotNotes(data.notes || '');
      } else {
        toast.error(data.message || 'Could not improve bullet');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setCopilotLoading(false);
    }
  };

  // Apply improved bullet
  const applyCopilotSuggestion = () => {
    if (!copilotSuggestion || !copilotOpen) return;
    const { type, parentIdx, bulletIdx } = copilotOpen;

    updateData((draft) => {
      if (type === 'exp' && draft.experience?.[parentIdx]?.bullets) {
        draft.experience[parentIdx].bullets[bulletIdx] = copilotSuggestion;
      } else if (type === 'proj' && draft.projects?.[parentIdx]?.bullets) {
        draft.projects[parentIdx].bullets[bulletIdx] = copilotSuggestion;
      }
    });

    toast.success('Bullet point updated!');
    setCopilotOpen(null);
    setCopilotSuggestion('');
    setShowMetricInput(false);
    setMetricPromptInput('');
  };

  return (
    <div className="relative flex justify-center w-full py-4">
      {/* Zoom transform container */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className="w-full flex justify-center"
      >
        {/* Printable Physical Sheet Canvas (Simulating true A4 210mm x 297mm) */}
        <div
          id="resume-live-sheet"
          className={`relative w-[794px] min-h-[1123px] bg-white text-slate-800 shadow-2xl rounded-sm border border-slate-200 print:shadow-none print:border-none print:m-0 ${fontClass} ${
            isOnePage ? 'p-8 text-[12.5px] leading-tight' : 'p-10 text-[13px] leading-normal'
          }`}
          style={{
            boxShadow: '0 10px 35px -5px rgba(15, 23, 42, 0.15), 0 0 1px 1px rgba(15, 23, 42, 0.05)',
          }}
        >
          {/* HEADER SECTION */}
          <header className={`mb-3 ${isHarvard ? 'text-center border-b-2 border-slate-900 pb-2' : ''}`}>
            {/* Candidate Name */}
            <input
              type="text"
              value={personal.fullName || ''}
              placeholder="YOUR FULL NAME"
              onChange={(e) =>
                updateData((draft) => {
                  draft.personal = draft.personal || {};
                  draft.personal.fullName = e.target.value;
                })
              }
              className={`w-full bg-transparent hover:bg-indigo-50/40 focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1.5 py-0.5 text-slate-950 font-bold transition outline-none ${
                isHarvard ? 'text-2xl text-center uppercase tracking-wider' : 'text-2xl tracking-tight'
              }`}
            />

            {/* Target Role Tagline (Optional) */}
            <input
              type="text"
              value={personal.title || targetRole || ''}
              placeholder="Target Role (e.g. Senior Full-Stack Engineer)"
              onChange={(e) =>
                updateData((draft) => {
                  draft.personal = draft.personal || {};
                  draft.personal.title = e.target.value;
                })
              }
              className={`w-full bg-transparent hover:bg-indigo-50/40 focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1.5 py-0.5 text-slate-600 font-medium text-xs transition outline-none ${
                isHarvard ? 'text-center uppercase tracking-widest text-[11px] text-slate-700' : 'text-indigo-600'
              }`}
            />

            {/* Contact Line */}
            <div
              className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-600 text-[11px] mt-1 px-1.5 ${
                isHarvard ? 'justify-center' : 'justify-start'
              }`}
            >
              <input
                type="text"
                value={personal.phone || ''}
                placeholder="+1 (555) 000-0000"
                onChange={(e) =>
                  updateData((draft) => {
                    draft.personal.phone = e.target.value;
                  })
                }
                className="bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.2 outline-none w-32"
              />
              <span>•</span>
              <input
                type="text"
                value={personal.email || ''}
                placeholder="email@example.com"
                onChange={(e) =>
                  updateData((draft) => {
                    draft.personal.email = e.target.value;
                  })
                }
                className="bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.2 outline-none w-44"
              />
              <span>•</span>
              <input
                type="text"
                value={personal.location || ''}
                placeholder="City, State / Remote"
                onChange={(e) =>
                  updateData((draft) => {
                    draft.personal.location = e.target.value;
                  })
                }
                className="bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.2 outline-none w-36"
              />
              {personal.linkedin && (
                <>
                  <span>•</span>
                  <input
                    type="text"
                    value={personal.linkedin || ''}
                    placeholder="linkedin.com/in/..."
                    onChange={(e) =>
                      updateData((draft) => {
                        draft.personal.linkedin = e.target.value;
                      })
                    }
                    className="bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.2 outline-none w-36 text-indigo-600"
                  />
                </>
              )}
              {personal.github && (
                <>
                  <span>•</span>
                  <input
                    type="text"
                    value={personal.github || ''}
                    placeholder="github.com/..."
                    onChange={(e) =>
                      updateData((draft) => {
                        draft.personal.github = e.target.value;
                      })
                    }
                    className="bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.2 outline-none w-32 text-indigo-600"
                  />
                </>
              )}
              {personal.portfolio && (
                <>
                  <span>•</span>
                  <input
                    type="text"
                    value={personal.portfolio || ''}
                    placeholder="portfolio.dev"
                    onChange={(e) =>
                      updateData((draft) => {
                        draft.personal.portfolio = e.target.value;
                      })
                    }
                    className="bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.2 outline-none w-28 text-indigo-600"
                  />
                </>
              )}
            </div>
          </header>

          {/* PROFESSIONAL SUMMARY */}
          <section className="mb-2">
            <h2 className={sectionTitleStyle}>Professional Summary</h2>
            <textarea
              rows={isOnePage ? 2 : 3}
              value={summary}
              placeholder="High-impact 2-3 sentence executive summary highlighting key strengths, core tech stack, and verified career achievements..."
              onChange={(e) =>
                updateData((draft) => {
                  draft.summary = e.target.value;
                })
              }
              className="w-full bg-transparent hover:bg-indigo-50/30 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1.5 py-1 text-slate-700 resize-none outline-none transition"
            />
          </section>

          {/* TECHNICAL SKILLS SECTION */}
          <section className="mb-2">
            <h2 className={sectionTitleStyle}>Technical Competencies</h2>
            <div className="space-y-1 text-xs">
              {/* Languages */}
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-900 w-36 shrink-0">Languages:</span>
                <input
                  type="text"
                  value={skills.languages?.join(', ') || ''}
                  placeholder="e.g. JavaScript, TypeScript, Python, SQL, Go"
                  onChange={(e) =>
                    updateData((draft) => {
                      draft.skills = draft.skills || {};
                      draft.skills.languages = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    })
                  }
                  className="flex-1 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-700"
                />
              </div>

              {/* Frameworks */}
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-900 w-36 shrink-0">Frameworks & Libs:</span>
                <input
                  type="text"
                  value={skills.frameworks?.join(', ') || ''}
                  placeholder="e.g. React, Node.js, Express, Next.js, Tailwind CSS"
                  onChange={(e) =>
                    updateData((draft) => {
                      draft.skills = draft.skills || {};
                      draft.skills.frameworks = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    })
                  }
                  className="flex-1 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-700"
                />
              </div>

              {/* Cloud & DevOps */}
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-900 w-36 shrink-0">Cloud & DevOps:</span>
                <input
                  type="text"
                  value={skills.cloud_devops?.join(', ') || ''}
                  placeholder="e.g. AWS (S3, EC2), Docker, CI/CD, Kubernetes"
                  onChange={(e) =>
                    updateData((draft) => {
                      draft.skills = draft.skills || {};
                      draft.skills.cloud_devops = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    })
                  }
                  className="flex-1 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-700"
                />
              </div>

              {/* Databases */}
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-900 w-36 shrink-0">Databases & Storage:</span>
                <input
                  type="text"
                  value={skills.databases?.join(', ') || ''}
                  placeholder="e.g. PostgreSQL, MongoDB, Redis, Supabase"
                  onChange={(e) =>
                    updateData((draft) => {
                      draft.skills = draft.skills || {};
                      draft.skills.databases = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    })
                  }
                  className="flex-1 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-700"
                />
              </div>

              {/* Tools */}
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-900 w-36 shrink-0">Tools & Architecture:</span>
                <input
                  type="text"
                  value={skills.tools?.join(', ') || ''}
                  placeholder="e.g. Git, REST APIs, Microservices, Jest, Webpack"
                  onChange={(e) =>
                    updateData((draft) => {
                      draft.skills = draft.skills || {};
                      draft.skills.tools = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    })
                  }
                  className="flex-1 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-700"
                />
              </div>
            </div>
          </section>

          {/* PROFESSIONAL EXPERIENCE SECTION */}
          <section className="mb-2">
            <div className="flex items-center justify-between">
              <h2 className={sectionTitleStyle}>Professional Experience</h2>
              <button
                type="button"
                onClick={() =>
                  updateData((draft) => {
                    draft.experience = draft.experience || [];
                    draft.experience.unshift({
                      id: `exp_${Date.now()}`,
                      role: 'Software Engineer',
                      company: 'Company Name',
                      location: 'Remote',
                      startDate: 'Jan 2024',
                      endDate: 'Present',
                      bullets: ['Engineered scalable features using React and Node.js.'],
                    });
                  })
                }
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 opacity-80 hover:opacity-100 transition print:hidden"
              >
                <Plus className="w-3.5 h-3.5" /> Add Job
              </button>
            </div>

            <div className="space-y-2.5">
              {experience.map((exp, expIdx) => (
                <div key={exp.id || expIdx} className="group relative">
                  {/* Job Header Row */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={exp.role || ''}
                        placeholder="Job Title"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.experience[expIdx].role = e.target.value;
                          })
                        }
                        className="font-bold text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none flex-1"
                      />
                      <span className="text-slate-400">|</span>
                      <input
                        type="text"
                        value={exp.company || ''}
                        placeholder="Company"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.experience[expIdx].company = e.target.value;
                          })
                        }
                        className="font-semibold text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[11px] shrink-0">
                      <input
                        type="text"
                        value={exp.startDate || ''}
                        placeholder="Start"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.experience[expIdx].startDate = e.target.value;
                          })
                        }
                        className="w-16 text-right bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                      />
                      <span>–</span>
                      <input
                        type="text"
                        value={exp.endDate || 'Present'}
                        placeholder="End"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.experience[expIdx].endDate = e.target.value;
                          })
                        }
                        className="w-16 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                      />
                      <span>|</span>
                      <input
                        type="text"
                        value={exp.location || ''}
                        placeholder="Location"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.experience[expIdx].location = e.target.value;
                          })
                        }
                        className="w-20 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateData((draft) => {
                            draft.experience.splice(expIdx, 1);
                          })
                        }
                        className="text-red-400 hover:text-red-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition print:hidden"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <ul className="list-disc ml-4 space-y-1 mt-1 text-slate-700">
                    {(exp.bullets || []).map((bullet, bIdx) => (
                      <li key={bIdx} className="group/bullet relative pl-0.5">
                        <div className="flex items-start gap-1">
                          <textarea
                            rows={1}
                            value={bullet}
                            onChange={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                              updateData((draft) => {
                                draft.experience[expIdx].bullets[bIdx] = e.target.value;
                              });
                            }}
                            className="w-full bg-transparent hover:bg-indigo-50/30 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1 py-0.5 outline-none resize-none overflow-hidden transition"
                          />

                          {/* Per-Bullet AI Copilot Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/bullet:opacity-100 transition-opacity shrink-0 print:hidden mt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCopilotOpen({
                                  type: 'exp',
                                  parentIdx: expIdx,
                                  bulletIdx: bIdx,
                                  currentText: bullet,
                                });
                                setCopilotSuggestion('');
                                setShowMetricInput(false);
                              }}
                              className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
                              title="Improve with AI (XYZ Formula / Metrics)"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateData((draft) => {
                                  draft.experience[expIdx].bullets.splice(bIdx, 1);
                                })
                              }
                              className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                              title="Delete Bullet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Add Bullet Button */}
                  <button
                    type="button"
                    onClick={() =>
                      updateData((draft) => {
                        draft.experience[expIdx].bullets = draft.experience[expIdx].bullets || [];
                        draft.experience[expIdx].bullets.push('Architected feature resulting in improved performance.');
                      })
                    }
                    className="ml-4 text-[11px] text-slate-400 hover:text-indigo-600 font-medium flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition print:hidden"
                  >
                    <Plus className="w-3 h-3" /> Add Achievement Bullet
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* KEY PROJECTS SECTION */}
          <section className="mb-2">
            <div className="flex items-center justify-between">
              <h2 className={sectionTitleStyle}>Technical Projects</h2>
              <button
                type="button"
                onClick={() =>
                  updateData((draft) => {
                    draft.projects = draft.projects || [];
                    draft.projects.unshift({
                      id: `proj_${Date.now()}`,
                      title: 'Project Name',
                      techStack: ['React', 'Node.js', 'PostgreSQL'],
                      liveUrl: '',
                      githubUrl: '',
                      bullets: ['Built full-stack application handling secure authentication.'],
                    });
                  })
                }
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 opacity-80 hover:opacity-100 transition print:hidden"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            <div className="space-y-2.5">
              {projects.map((proj, projIdx) => (
                <div key={proj.id || projIdx} className="group relative">
                  {/* Project Header Row */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={proj.title || ''}
                        placeholder="Project Title"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.projects[projIdx].title = e.target.value;
                          })
                        }
                        className="font-bold text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                      />
                      <span className="text-slate-400">|</span>
                      <input
                        type="text"
                        value={proj.techStack?.join(', ') || ''}
                        placeholder="React, TypeScript, AWS"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.projects[projIdx].techStack = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                          })
                        }
                        className="font-medium text-slate-600 text-[11.5px] bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none flex-1 italic"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[11px] shrink-0">
                      {proj.liveUrl !== undefined && (
                        <input
                          type="text"
                          value={proj.liveUrl || ''}
                          placeholder="Demo Link"
                          onChange={(e) =>
                            updateData((draft) => {
                              draft.projects[projIdx].liveUrl = e.target.value;
                            })
                          }
                          className="w-24 text-indigo-600 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                        />
                      )}
                      {proj.githubUrl !== undefined && (
                        <input
                          type="text"
                          value={proj.githubUrl || ''}
                          placeholder="GitHub Link"
                          onChange={(e) =>
                            updateData((draft) => {
                              draft.projects[projIdx].githubUrl = e.target.value;
                            })
                          }
                          className="w-24 text-indigo-600 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          updateData((draft) => {
                            draft.projects.splice(projIdx, 1);
                          })
                        }
                        className="text-red-400 hover:text-red-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition print:hidden"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Bullets */}
                  <ul className="list-disc ml-4 space-y-1 mt-1 text-slate-700">
                    {(proj.bullets || []).map((bullet, bIdx) => (
                      <li key={bIdx} className="group/bullet relative pl-0.5">
                        <div className="flex items-start gap-1">
                          <textarea
                            rows={1}
                            value={bullet}
                            onChange={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                              updateData((draft) => {
                                draft.projects[projIdx].bullets[bIdx] = e.target.value;
                              });
                            }}
                            className="w-full bg-transparent hover:bg-indigo-50/30 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1 py-0.5 outline-none resize-none overflow-hidden transition"
                          />

                          {/* Copilot Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/bullet:opacity-100 transition-opacity shrink-0 print:hidden mt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCopilotOpen({
                                  type: 'proj',
                                  parentIdx: projIdx,
                                  bulletIdx: bIdx,
                                  currentText: bullet,
                                });
                                setCopilotSuggestion('');
                                setShowMetricInput(false);
                              }}
                              className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
                              title="Improve with AI (XYZ Formula / Metrics)"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateData((draft) => {
                                  draft.projects[projIdx].bullets.splice(bIdx, 1);
                                })
                              }
                              className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                              title="Delete Bullet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      updateData((draft) => {
                        draft.projects[projIdx].bullets = draft.projects[projIdx].bullets || [];
                        draft.projects[projIdx].bullets.push('Engineered modular component architecture.');
                      })
                    }
                    className="ml-4 text-[11px] text-slate-400 hover:text-indigo-600 font-medium flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition print:hidden"
                  >
                    <Plus className="w-3 h-3" /> Add Project Bullet
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* EDUCATION SECTION */}
          <section className="mb-2">
            <div className="flex items-center justify-between">
              <h2 className={sectionTitleStyle}>Education</h2>
              <button
                type="button"
                onClick={() =>
                  updateData((draft) => {
                    draft.education = draft.education || [];
                    draft.education.push({
                      id: `edu_${Date.now()}`,
                      degree: 'B.Tech / B.S. in Computer Science',
                      institution: 'University Name',
                      year: '2020 – 2024',
                      grade: 'GPA: 3.8/4.0',
                      highlights: [],
                    });
                  })
                }
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 opacity-80 hover:opacity-100 transition print:hidden"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </button>
            </div>

            <div className="space-y-1.5">
              {education.map((edu, eduIdx) => (
                <div key={edu.id || eduIdx} className="group relative">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={edu.degree || ''}
                        placeholder="Degree / Major"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.education[eduIdx].degree = e.target.value;
                          })
                        }
                        className="font-bold text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none flex-1"
                      />
                      <span className="text-slate-400">|</span>
                      <input
                        type="text"
                        value={edu.institution || ''}
                        placeholder="University / College"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.education[eduIdx].institution = e.target.value;
                          })
                        }
                        className="font-medium text-slate-700 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[11px] shrink-0">
                      <input
                        type="text"
                        value={edu.year || ''}
                        placeholder="Graduation Year"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.education[eduIdx].year = e.target.value;
                          })
                        }
                        className="w-24 text-right bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                      />
                      {edu.grade !== undefined && (
                        <>
                          <span>|</span>
                          <input
                            type="text"
                            value={edu.grade || ''}
                            placeholder="GPA / Score"
                            onChange={(e) =>
                              updateData((draft) => {
                                draft.education[eduIdx].grade = e.target.value;
                              })
                            }
                            className="w-20 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          updateData((draft) => {
                            draft.education.splice(eduIdx, 1);
                          })
                        }
                        className="text-red-400 hover:text-red-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition print:hidden"
                        title="Delete Degree"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CERTIFICATIONS & HONORS SECTION */}
          {(certifications.length > 0 || achievements.length > 0) && (
            <section className="mb-1">
              <h2 className={sectionTitleStyle}>Honors & Certifications</h2>
              <ul className="list-disc ml-4 space-y-0.5 text-xs text-slate-700">
                {certifications.map((c, cIdx) => (
                  <li key={`cert_${cIdx}`} className="group/cert">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={c.name || ''}
                        placeholder="Certification Name"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.certifications[cIdx].name = e.target.value;
                          })
                        }
                        className="font-semibold text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none"
                      />
                      <span>–</span>
                      <input
                        type="text"
                        value={c.issuer || ''}
                        placeholder="Issuer (e.g. AWS, Coursera)"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.certifications[cIdx].issuer = e.target.value;
                          })
                        }
                        className="bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-600"
                      />
                      <input
                        type="text"
                        value={c.year || ''}
                        placeholder="Year"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.certifications[cIdx].year = e.target.value;
                          })
                        }
                        className="w-16 bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateData((draft) => {
                            draft.certifications.splice(cIdx, 1);
                          })
                        }
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover/cert:opacity-100 transition print:hidden"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
                {achievements.map((a, aIdx) => (
                  <li key={`ach_${aIdx}`} className="group/ach">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={a}
                        placeholder="Notable achievement or award"
                        onChange={(e) =>
                          updateData((draft) => {
                            draft.achievements[aIdx] = e.target.value;
                          })
                        }
                        className="w-full bg-transparent hover:bg-slate-100/80 focus:bg-white rounded px-1 py-0.5 outline-none text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateData((draft) => {
                            draft.achievements.splice(aIdx, 1);
                          })
                        }
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover/ach:opacity-100 transition print:hidden"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* FLOATING AI BULLET COPILOT MODAL / POPOVER */}
      {copilotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-lg w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Bullet Point Copilot</h3>
                  <p className="text-xs text-slate-500">Google XYZ Formula • Verified Impact • Zero Hallucination</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCopilotOpen(null);
                  setCopilotSuggestion('');
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Bullet Display */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Bullet:</span>
              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1 leading-relaxed">
                {copilotOpen.currentText}
              </p>
            </div>

            {/* Quick Action Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Choose Enhancement Strategy:</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  type="button"
                  disabled={copilotLoading}
                  onClick={() =>
                    handleImproveBullet(
                      'Rewrite in strict Google XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]. If metric missing, highlight active outcome honestly without fake numbers.'
                    )
                  }
                  className="p-2 text-left rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs text-slate-700 transition flex items-center gap-1.5 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Google XYZ Formula
                </button>
                <button
                  type="button"
                  disabled={copilotLoading}
                  onClick={() =>
                    handleImproveBullet(
                      'Strengthen action verbs with decisive, executive-level technical verbs (e.g. Architected, Orchestrated, Spearheaded, Refactored) and eliminate passive phrases.'
                    )
                  }
                  className="p-2 text-left rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs text-slate-700 transition flex items-center gap-1.5 font-medium"
                >
                  <Wand2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  Decisive Action Verbs
                </button>
                <button
                  type="button"
                  disabled={copilotLoading}
                  onClick={() => {
                    setShowMetricInput(!showMetricInput);
                  }}
                  className={`p-2 text-left rounded-xl border text-xs transition flex items-center gap-1.5 font-medium ${
                    showMetricInput
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900'
                      : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Add Real Metric / Scale
                </button>
                <button
                  type="button"
                  disabled={copilotLoading}
                  onClick={() =>
                    handleImproveBullet(
                      'Make concisely impactful: Eliminate fluff and filler adjectives. Keep it under 24 words for optimal 1-page ATS scanning.'
                    )
                  }
                  className="p-2 text-left rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs text-slate-700 transition flex items-center gap-1.5 font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Concise 1-Page Polish
                </button>
              </div>
            </div>

            {/* Optional Metric Prompt Input (anti-hallucination guarantee: asking user) */}
            {showMetricInput && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  Provide Your Real Metric (Zero Guesswork):
                </div>
                <p className="text-[11px] text-emerald-800">
                  QuickAI will NEVER invent fake metrics. Tell us your approximate number (e.g. "reduced latency by ~35%", "handled ~10k daily requests", "saved 4 hours/week"):
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={metricPromptInput}
                    onChange={(e) => setMetricPromptInput(e.target.value)}
                    placeholder="e.g., cut build time from 15m to 4m, or 50k+ active users"
                    className="flex-1 bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={!metricPromptInput.trim() || copilotLoading}
                    onClick={() =>
                      handleImproveBullet(
                        'Integrate this honest metric seamlessly into the Google XYZ formula.',
                        metricPromptInput
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Integrate
                  </button>
                </div>
              </div>
            )}

            {/* AI Response Preview */}
            {copilotLoading ? (
              <div className="flex items-center justify-center py-6 text-indigo-600 text-xs font-medium gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Optimizing bullet with ATS recruiter benchmarks...
              </div>
            ) : copilotSuggestion ? (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Proposed Optimization:
                </span>
                <p className="text-xs text-slate-900 bg-indigo-50/50 border border-indigo-200 rounded-xl p-3 font-medium leading-relaxed">
                  {copilotSuggestion}
                </p>
                {copilotNotes && (
                  <p className="text-[11px] text-slate-500 italic px-1">
                    💡 Why this works: {copilotNotes}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCopilotSuggestion('')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Try Another
                  </button>
                  <button
                    type="button"
                    onClick={applyCopilotSuggestion}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept & Update
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeLiveCanvas;
