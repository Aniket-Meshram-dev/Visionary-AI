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
  Zap
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
      prompt: 'Write a compelling hook about how AI tools are revolutionizing creator workflows.',
      output: `### The Next Frontier of Digital Creativity 🚀\n\nCreators spend nearly **65% of their time** on repetitive drafting, formatting, and manual asset preparation. AI isn't replacing the creative spark—it's supercharging it.\n\nWith multi-modal intelligence, ideas move from conceptual brainstorms to publication-ready assets in under 30 seconds.`,
      stats: '⚡ Generated in 1.2s • 98 words • 100% Unique'
    },
    image: {
      tool: 'AI Image Generation',
      icon: ImageIcon,
      color: 'from-amber-500 to-orange-500',
      prompt: 'A Boy on a boat fishing under a dreamy cloudy blue sky, Studio Ghibli anime style, 8K ultra detail.',
      image: assets.ai_gen_img_1,
      stats: '🎨 Clipdrop Engine • 1024x1024 • HDR Color'
    },
    code: {
      tool: 'Quick Code Generator',
      icon: Code2,
      color: 'from-emerald-500 to-teal-500',
      prompt: 'Create a reusable debounce hook in React with TypeScript.',
      code: `function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}`,
      stats: '⚡ Optimized • Zero Dependencies • TypeScript Ready'
    },
    resume: {
      tool: 'Resume Reviewer',
      icon: ClipboardCheck,
      color: 'from-teal-500 to-cyan-600',
      prompt: 'Senior Full Stack Developer Resume - ATS Screening',
      score: '94/100',
      feedback: [
        'Strong quantifiable impact: "Reduced API latency by 42%"',
        'Keyword density matches 91% of targeted Tech Lead roles',
        'Recommendation: Add system architecture diagram link'
      ],
      stats: '📄 Evaluated against 500+ Top Tech Job Descriptions'
    }
  }

  const currentDemo = demoData[activeTab]

  return (
    <section className='relative pt-28 pb-20 overflow-hidden bg-[url(/gradientBackground.png)] bg-cover bg-no-repeat'>
      {/* Decorative gradient glow orbs */}
      <div className='absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none -z-10' />
      <div className='absolute top-40 right-10 w-[300px] h-[300px] bg-purple-400/10 blur-[100px] rounded-full pointer-events-none -z-10' />

      <div className='max-w-7xl mx-auto px-4 sm:px-8'>
        {/* Header content */}
        <div className='text-center max-w-4xl mx-auto'>
          {/* Announcement pill */}
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 shadow-xs border border-indigo-100 text-xs sm:text-sm font-medium text-primary mb-6 backdrop-blur-sm'>
            <span className='flex h-2 w-2 rounded-full bg-primary animate-pulse' />
            <Sparkles className='w-3.5 h-3.5 text-primary' />
            <span>Next-Gen AI Suite 2.0 • Powered by Gemini & Clipdrop</span>
          </div>

          <h1 className='text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.12] mb-6'>
            Create Amazing Content with{' '}
            <span className='text-gradient'>Intelligent AI</span>
          </h1>

          <p className='text-base sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8'>
            Unleash peak creativity with our all-in-one suite. Write high-converting articles, 
            generate photorealistic visuals, build clean code, and streamline your workflow in seconds.
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-wrap items-center justify-center gap-4 mb-10'>
            <button
              onClick={() => navigate('/ai')}
              className='flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-[#4338CA] text-white font-semibold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer'
            >
              Start Creating Free <ArrowRight className='w-4 h-4' />
            </button>
            <a
              href='#tools'
              className='flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/90 hover:bg-white text-gray-700 font-medium text-base border border-gray-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer'
            >
              Explore 7 Tools
            </a>
          </div>

          {/* Social Proof Row */}
          <div className='inline-flex items-center gap-4 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-full border border-gray-200/70 shadow-xs mb-14'>
            <img src={assets.user_group} alt="Active creators" className='h-7 object-contain' />
            <div className='flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium'>
              <div className='flex items-center text-amber-500'>
                <Star className='w-3.5 h-3.5 fill-amber-500 text-amber-500' />
                <Star className='w-3.5 h-3.5 fill-amber-500 text-amber-500' />
                <Star className='w-3.5 h-3.5 fill-amber-500 text-amber-500' />
                <Star className='w-3.5 h-3.5 fill-amber-500 text-amber-500' />
                <Star className='w-3.5 h-3.5 fill-amber-500 text-amber-500' />
              </div>
              <span className='font-bold text-gray-900'>4.9/5</span>
              <span className='text-gray-400'>•</span>
              <span className='text-gray-600'>Loved by 10,000+ creators</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Product Demo Mockup */}
        <div className='max-w-4xl mx-auto'>
          <div className='rounded-2xl border border-gray-200/90 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden'>
            {/* Top Mockup Header with window dots & live tabs */}
            <div className='bg-gray-50/90 border-b border-gray-200/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-red-400' />
                <div className='w-3 h-3 rounded-full bg-amber-400' />
                <div className='w-3 h-3 rounded-full bg-emerald-400' />
                <span className='ml-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline'>Visionary Playground</span>
              </div>

              {/* Interactive Demo Tabs */}
              <div className='flex items-center gap-1 bg-gray-200/60 p-1 rounded-xl'>
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
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-primary shadow-xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
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
            <div className='p-5 sm:p-7'>
              {/* Prompt box */}
              <div className='mb-5 p-3.5 bg-gray-50 rounded-xl border border-gray-200/70 flex items-start justify-between gap-3'>
                <div className='flex items-start gap-2.5'>
                  <span className='text-xs font-bold text-primary uppercase bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md mt-0.5 shrink-0'>Prompt</span>
                  <p className='text-xs sm:text-sm text-gray-700 font-medium leading-relaxed'>{currentDemo.prompt}</p>
                </div>
                <div className='flex items-center gap-1 text-[11px] text-gray-400 shrink-0 font-medium'>
                  <Zap className='w-3 h-3 text-amber-500 fill-amber-500' /> AI Ready
                </div>
              </div>

              {/* Output Preview Area */}
              <div className='bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-xs min-h-[220px] flex flex-col justify-between'>
                {activeTab === 'article' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-100'>
                      <span className='text-xs font-semibold text-gray-500 flex items-center gap-1.5'>
                        <SquarePen className='w-3.5 h-3.5 text-primary' /> Generated Article Draft
                      </span>
                      <button
                        onClick={() => handleCopy(currentDemo.output)}
                        className='flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition cursor-pointer'
                      >
                        {copied ? <Check className='w-3.5 h-3.5 text-emerald-500' /> : <Copy className='w-3.5 h-3.5' />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className='text-gray-800 text-xs sm:text-sm whitespace-pre-line leading-relaxed'>
                      {currentDemo.output}
                    </div>
                  </div>
                )}

                {activeTab === 'image' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-100'>
                      <span className='text-xs font-semibold text-gray-500 flex items-center gap-1.5'>
                        <ImageIcon className='w-3.5 h-3.5 text-amber-500' /> AI Rendered Visual
                      </span>
                      <span className='text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50'>Ultra HD</span>
                    </div>
                    <div className='flex flex-col sm:flex-row items-center gap-4'>
                      <img
                        src={currentDemo.image}
                        alt="AI Generation Output"
                        className='w-full sm:w-48 h-44 object-cover rounded-lg border border-gray-200 shadow-xs'
                      />
                      <div className='text-xs sm:text-sm text-gray-600 space-y-2'>
                        <p className='font-medium text-gray-800'>✨ Synthesized from high-detail prompt</p>
                        <p className='text-gray-500 text-xs'>Negative Prompts: blur, distortion, low quality, artifacts</p>
                        <div className='flex flex-wrap gap-1.5 pt-1'>
                          <span className='bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px]'>#AnimeStyle</span>
                          <span className='bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px]'>#GhibliVibes</span>
                          <span className='bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px]'>#ClipdropAI</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-100'>
                      <span className='text-xs font-semibold text-gray-500 flex items-center gap-1.5'>
                        <Code2 className='w-3.5 h-3.5 text-emerald-500' /> Clean Code Output
                      </span>
                      <button
                        onClick={() => handleCopy(currentDemo.code)}
                        className='flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition cursor-pointer'
                      >
                        {copied ? <Check className='w-3.5 h-3.5 text-emerald-500' /> : <Copy className='w-3.5 h-3.5' />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className='bg-slate-900 text-slate-100 p-3.5 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed'>
                      <code>{currentDemo.code}</code>
                    </pre>
                  </div>
                )}

                {activeTab === 'resume' && (
                  <div>
                    <div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-100'>
                      <span className='text-xs font-semibold text-gray-500 flex items-center gap-1.5'>
                        <ClipboardCheck className='w-3.5 h-3.5 text-teal-500' /> AI Resume Evaluation
                      </span>
                      <span className='text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md'>
                        ATS Score: {currentDemo.score}
                      </span>
                    </div>
                    <div className='space-y-2.5 text-xs sm:text-sm text-gray-700'>
                      {currentDemo.feedback.map((item, idx) => (
                        <div key={idx} className='flex items-start gap-2'>
                          <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0 mt-0.5' />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer status of demo */}
                <div className='mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium'>
                  <span>{currentDemo.stats}</span>
                  <button
                    onClick={() => navigate('/ai')}
                    className='text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer'
                  >
                    Try in dashboard <ArrowRight className='w-3 h-3' />
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

