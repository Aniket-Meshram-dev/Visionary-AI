import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import {
  Sparkles,
  ArrowRight,
  Star,
  SquarePen,
  Image as ImageIcon,
  Code2,
  ClipboardCheck,
  Copy,
  Check,
  CheckCircle2,
  Zap,
  Play,
} from 'lucide-react'

const Hero = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('article')
  const [copied, setCopied] = useState(false)

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const demoData = {
    article: {
      tool: 'AI Article Writer',
      icon: SquarePen,
      color: 'from-blue-500 to-cyan-500',
      tag: 'Google Gemini 2.0 Flash',
      prompt: 'Write an authoritative breakdown of Autonomous AI Agents shaping software engineering in 2026.',
      output: `### The Age of Autonomous Code & Creative Agency ⚡\n\nSoftware engineering in 2026 is no longer about typing boilerplate—it's about directing multi-agent systems that reason, test, and self-heal in real-time.\n\nKey inflection points:\n• **Sub-second Iteration Loops:** Multi-modal LLMs compress 2-week prototyping cycles into 4 minutes.\n• **Context-Aware Synthesis:** Agents analyze repository ASTs rather than isolated snippets.\n\nThe competitive moat is not syntax memorization; it's orchestrating intelligent workflows at scale.`,
      stats: '⚡ Synthesized in 0.8s • 86 words • 100% Unique',
    },
    image: {
      tool: 'Diffusion Image Studio',
      icon: ImageIcon,
      color: 'from-amber-500 to-orange-500',
      tag: 'FLUX.1 Photorealistic AI',
      prompt: 'A boy on a boat fishing under a dreamy cloudy blue sky, Studio Ghibli anime style, 8K ultra detail.',
      image: assets.ai_gen_img_1,
      stats: '🎨 1024x1024 HDR • Prompt Adherence: 99.4%',
    },
    code: {
      tool: 'Quick Code Engine',
      icon: Code2,
      color: 'from-emerald-500 to-teal-500',
      tag: 'Groq Llama 3.3 70B',
      prompt: 'Create a reusable debounce hook in React with TypeScript and strict cancellation.',
      code: `export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}`,
      stats: '⚡ Zero Dependencies • TypeScript Ready • Optimized',
    },
    resume: {
      tool: 'ATS Resume Reviewer',
      icon: ClipboardCheck,
      color: 'from-purple-500 to-pink-500',
      tag: 'Executive Career Coach',
      prompt: 'Senior Full-Stack Engineer Resume — Targeting Tech Lead ($180k+)',
      score: '96/100',
      feedback: [
        'Exceptional quantifiable impact: "Reduced API latency by 42% across 10M daily requests"',
        'Keyword density aligns with 94% of Top Tier Tech Lead job specs',
        'Recommendation: Link live GitHub architecture diagrams to portfolio section',
      ],
      stats: '📄 Audited against 1,200+ Enterprise Tech Specs',
    },
  }

  const currentDemo = demoData[activeTab]

  return (
    <section className='relative pt-32 pb-20 overflow-hidden bg-radial-gradient'>
      {/* Ambient background glowing orbs */}
      <div className='absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none -z-10' />
      <div className='absolute top-48 right-10 w-[350px] h-[350px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10' />
      <div className='absolute top-36 left-10 w-[350px] h-[350px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none -z-10' />

      <div className='max-w-7xl mx-auto px-4 sm:px-8'>
        {/* Header content */}
        <div className='text-center max-w-4xl mx-auto'>
          {/* Announcement pill */}
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs sm:text-sm font-semibold text-indigo-300 mb-8 backdrop-blur-md shadow-lg shadow-indigo-500/5 hover:border-indigo-500/40 transition'>
            <span className='flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
            <Sparkles className='w-3.5 h-3.5 text-indigo-400' />
            <span>Next-Gen Multi-Modal AI Suite • Powered by Gemini & Groq</span>
          </div>

          <h1 className='text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.12] mb-6'>
            Supercharge Your Ideas with{' '}
            <span className='text-gradient'>Intelligent AI</span>
          </h1>

          <p className='text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10'>
            The all-in-one generative creation suite. Write authoritative articles, synthesize 8K
            visuals, engineer clean code, and isolate objects in seconds.
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-wrap items-center justify-center gap-4 mb-12'>
            <button
              onClick={() => navigate('/ai')}
              className='flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer'
            >
              Start Creating Free <ArrowRight className='w-4 h-4' />
            </button>
            <a
              href='#tools'
              className='flex items-center gap-2 px-7 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-800 shadow-sm hover:border-slate-700 transition cursor-pointer'
            >
              Explore 7 Tools
            </a>
          </div>

          {/* Social Proof Row */}
          <div className='inline-flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-800/90 shadow-xl mb-16'>
            <img src={assets.user_group} alt='Active creators' className='h-7 object-contain' />
            <div className='flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium'>
              <div className='flex items-center text-amber-400'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className='w-3.5 h-3.5 fill-amber-400 text-amber-400' />
                ))}
              </div>
              <span className='font-bold text-white'>4.9 / 5.0</span>
              <span className='text-slate-600'>•</span>
              <span className='text-slate-400'>Trusted by creators worldwide</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Product Demo Mockup */}
        <div className='max-w-4xl mx-auto'>
          <div className='rounded-3xl border border-slate-800/90 bg-slate-900/70 shadow-2xl backdrop-blur-2xl overflow-hidden'>
            {/* Window bar */}
            <div className='bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-rose-500/80' />
                <div className='w-3 h-3 rounded-full bg-amber-500/80' />
                <div className='w-3 h-3 rounded-full bg-emerald-500/80' />
                <span className='ml-2 text-xs font-mono font-semibold text-slate-400 hidden sm:inline'>
                  visionary://playground
                </span>
              </div>

              {/* Interactive Demo Tabs */}
              <div className='flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800'>
                {[
                  { id: 'article', label: 'Article', icon: SquarePen },
                  { id: 'image', label: 'Image', icon: ImageIcon },
                  { id: 'code', label: 'Code', icon: Code2 },
                  { id: 'resume', label: 'Resume', icon: ClipboardCheck },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className='w-3.5 h-3.5' />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mockup Body */}
            <div className='p-5 sm:p-7 space-y-4'>
              {/* Prompt box */}
              <div className='p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start justify-between gap-3'>
                <div className='flex items-start gap-2.5'>
                  <span className='text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md mt-0.5 shrink-0'>
                    PROMPT
                  </span>
                  <p className='text-xs sm:text-sm text-slate-200 font-medium leading-relaxed'>
                    {currentDemo.prompt}
                  </p>
                </div>
                <div className='flex items-center gap-1 text-[11px] text-emerald-400 font-mono shrink-0'>
                  <Zap className='w-3 h-3 fill-current' /> {currentDemo.tag}
                </div>
              </div>

              {/* Output Preview Area */}
              <div className='bg-slate-950 rounded-2xl border border-slate-800/90 p-5 min-h-[220px] flex flex-col justify-between shadow-inner'>
                {activeTab === 'article' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80'>
                      <span className='text-xs font-semibold text-slate-400 flex items-center gap-1.5'>
                        <SquarePen className='w-3.5 h-3.5 text-indigo-400' /> AI Structured Draft
                      </span>
                      <button
                        onClick={() => handleCopy(currentDemo.output)}
                        className='flex items-center gap-1 text-xs text-slate-400 hover:text-white transition cursor-pointer'
                      >
                        {copied ? (
                          <Check className='w-3.5 h-3.5 text-emerald-400' />
                        ) : (
                          <Copy className='w-3.5 h-3.5' />
                        )}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className='text-slate-200 text-xs sm:text-sm whitespace-pre-line leading-relaxed font-sans'>
                      {currentDemo.output}
                    </div>
                  </div>
                )}

                {activeTab === 'image' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80'>
                      <span className='text-xs font-semibold text-slate-400 flex items-center gap-1.5'>
                        <ImageIcon className='w-3.5 h-3.5 text-amber-400' /> Rendered Output
                      </span>
                      <span className='text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md'>
                        1024 x 1024 Ultra HD
                      </span>
                    </div>
                    <div className='flex flex-col sm:flex-row items-center gap-4'>
                      <img
                        src={currentDemo.image}
                        alt='AI Visual'
                        className='w-full sm:w-48 h-44 object-cover rounded-xl border border-slate-800 shadow-md'
                      />
                      <div className='text-xs sm:text-sm text-slate-300 space-y-2'>
                        <p className='font-semibold text-white'>✨ Synthesized in 1.4s via Diffusion Engine</p>
                        <p className='text-slate-400 text-xs'>Style Tags: Anime, Ghibli, 8K ultra detail</p>
                        <div className='flex flex-wrap gap-1.5 pt-1'>
                          <span className='bg-slate-900 border border-slate-800 text-indigo-300 px-2 py-0.5 rounded text-[11px]'>
                            #StudioGhibli
                          </span>
                          <span className='bg-slate-900 border border-slate-800 text-indigo-300 px-2 py-0.5 rounded text-[11px]'>
                            #CinematicColor
                          </span>
                          <span className='bg-slate-900 border border-slate-800 text-indigo-300 px-2 py-0.5 rounded text-[11px]'>
                            #VisionaryDiffusion
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80'>
                      <span className='text-xs font-semibold text-slate-400 flex items-center gap-1.5'>
                        <Code2 className='w-3.5 h-3.5 text-emerald-400' /> Clean Synthesized Code
                      </span>
                      <button
                        onClick={() => handleCopy(currentDemo.code)}
                        className='flex items-center gap-1 text-xs text-slate-400 hover:text-white transition cursor-pointer'
                      >
                        {copied ? (
                          <Check className='w-3.5 h-3.5 text-emerald-400' />
                        ) : (
                          <Copy className='w-3.5 h-3.5' />
                        )}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className='p-4 bg-slate-900/90 text-indigo-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed'>
                      <code>{currentDemo.code}</code>
                    </pre>
                  </div>
                )}

                {activeTab === 'resume' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80'>
                      <span className='text-xs font-semibold text-slate-400 flex items-center gap-1.5'>
                        <ClipboardCheck className='w-3.5 h-3.5 text-purple-400' /> ATS Score Audit
                      </span>
                      <span className='text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md'>
                        ATS Score: {currentDemo.score}
                      </span>
                    </div>
                    <div className='space-y-2.5 text-xs sm:text-sm text-slate-300'>
                      {currentDemo.feedback.map((item, idx) => (
                        <div key={idx} className='flex items-start gap-2'>
                          <CheckCircle2 className='w-4 h-4 text-emerald-400 shrink-0 mt-0.5' />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer status of demo */}
                <div className='mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono'>
                  <span>{currentDemo.stats}</span>
                  <button
                    onClick={() => navigate('/ai')}
                    className='text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer'
                  >
                    Launch tool in Studio <ArrowRight className='w-3 h-3' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
