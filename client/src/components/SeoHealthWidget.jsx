import React, { useState, useMemo } from 'react'
import {
  Gauge,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
} from 'lucide-react'
import { analyzeArticleSeo } from '../utils/seoAnalyzer'

const SeoHealthWidget = ({ content = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [targetKeyword, setTargetKeyword] = useState('')

  const metrics = useMemo(() => {
    return analyzeArticleSeo(content, targetKeyword)
  }, [content, targetKeyword])

  if (!content) return null

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-rose-600 bg-rose-50 border-rose-200'
  }

  return (
    <div className='bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs'>
      {/* Header / Toggle Button */}
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full p-3.5 px-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/60 transition cursor-pointer'
      >
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center'>
            <Gauge className='w-4 h-4' />
          </div>
          <div className='text-left'>
            <div className='flex items-center gap-2'>
              <h4 className='text-xs font-bold text-slate-900'>
                Live SEO & Readability Health Score
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreColor(
                  metrics.overallHealthScore
                )}`}
              >
                {metrics.overallHealthScore}/100
              </span>
            </div>
            <p className='text-[10px] text-slate-500'>
              Flesch: {metrics.fleschScore}/100 ({metrics.fleschGrade}) • ~{metrics.readingTimeMin} min read
            </p>
          </div>
        </div>

        <div className='flex items-center gap-1.5 text-xs text-slate-400'>
          <span>{isOpen ? 'Hide Audit' : 'View Audit'}</span>
          {isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
        </div>
      </button>

      {/* Expanded Audit Drawer */}
      {isOpen && (
        <div className='p-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200'>
          {/* Target Keyword Input */}
          <div className='space-y-1.5'>
            <label className='text-[11px] font-semibold text-slate-700 flex items-center gap-1.5'>
              <Search className='w-3 h-3 text-blue-600' />
              Target Keyword to Track
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='text'
                placeholder='e.g. artificial intelligence'
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                className='flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500'
              />
              {targetKeyword && (
                <span className='text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md'>
                  {metrics.keywordDensity}% density ({metrics.keywordCount}x)
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-center'>
            <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
              <p className='text-[10px] text-slate-400 font-medium'>Word Count</p>
              <p className='text-sm font-bold text-slate-800 mt-0.5'>{metrics.wordCount}</p>
            </div>

            <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
              <p className='text-[10px] text-slate-400 font-medium'>Readability</p>
              <p className='text-sm font-bold text-slate-800 mt-0.5'>{metrics.fleschScore}/100</p>
            </div>

            <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
              <p className='text-[10px] text-slate-400 font-medium'>Heading Structure</p>
              <p className='text-sm font-bold text-slate-800 mt-0.5'>
                {metrics.headings.h1} H1 • {metrics.headings.h2} H2
              </p>
            </div>

            <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
              <p className='text-[10px] text-slate-400 font-medium'>Est. Read Time</p>
              <p className='text-sm font-bold text-slate-800 mt-0.5'>~{metrics.readingTimeMin} min</p>
            </div>
          </div>

          {/* Actionable Checklist */}
          <div className='space-y-2 pt-1'>
            <p className='text-[11px] font-semibold text-slate-700'>
              Search Engine Checklist:
            </p>
            <div className='space-y-1.5'>
              {metrics.auditChecks.map((chk, idx) => (
                <div
                  key={idx}
                  className='flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/70 border border-slate-100'
                >
                  <span className='font-medium text-slate-800 flex items-center gap-1.5'>
                    {chk.passed ? (
                      <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                    ) : (
                      <AlertCircle className='w-3.5 h-3.5 text-amber-500 shrink-0' />
                    )}
                    {chk.label}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      chk.passed ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {chk.info}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeoHealthWidget
