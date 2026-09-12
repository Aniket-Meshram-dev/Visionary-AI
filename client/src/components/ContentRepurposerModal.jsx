import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Share2,
  Twitter,
  Linkedin,
  Mail,
  Clipboard,
  Check,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Copy,
  RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'

const ContentRepurposerModal = ({
  isOpen,
  onClose,
  repurposedData,
  isLoading,
  onRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState('twitter') // 'twitter' | 'linkedin' | 'newsletter'
  const [copiedKey, setCopiedKey] = useState(null)

  if (!isOpen) return null

  const handleCopy = (text, keyName) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(keyName)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  const handleCopyAllTweets = () => {
    if (!repurposedData?.twitterThread) return
    const fullThread = repurposedData.twitterThread.join('\n\n---\n\n')
    handleCopy(fullThread, 'full-thread')
  }

  // Deduplicate and clean tweets on frontend as extra safeguard
  const rawTweets = repurposedData?.twitterThread || []
  const uniqueTweets = []
  const seenPrefixes = new Set()
  for (const tweet of rawTweets) {
    const coreText = tweet.replace(/^[0-9]+[\/:\-][0-9]*\s*/i, '').trim()
    if (!seenPrefixes.has(coreText.slice(0, 50).toLowerCase())) {
      seenPrefixes.add(coreText.slice(0, 50).toLowerCase())
      uniqueTweets.push(coreText)
    }
  }

  const totalTweets = uniqueTweets.length

  const modalContent = (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200'>
      {/* Background click to dismiss */}
      <div
        className='fixed inset-0'
        onClick={onClose}
        aria-label='Close background backdrop'
      />

      {/* Main Modal Card */}
      <div className='relative z-10 bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150'>
        {/* Modal Header */}
        <div className='p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0'>
              <Share2 className='w-4 h-4' />
            </div>
            <div>
              <h3 className='text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2'>
                Omni-Channel Content Repurposer
                <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700'>
                  1-Click AI
                </span>
              </h3>
              <p className='text-[11px] sm:text-xs text-slate-500'>
                Auto-converted into viral Twitter threads, LinkedIn posts & email newsletters.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1.5'>
            {onRegenerate && (
              <button
                type='button'
                onClick={onRegenerate}
                disabled={isLoading}
                title='Regenerate social assets'
                className='p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50'
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              type='button'
              onClick={onClose}
              className='p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 shrink-0'>
          <button
            type='button'
            onClick={() => setActiveTab('twitter')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'twitter'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Twitter className='w-3.5 h-3.5 text-sky-500' />
            <span>Twitter / X Thread ({totalTweets})</span>
          </button>

          <button
            type='button'
            onClick={() => setActiveTab('linkedin')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'linkedin'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Linkedin className='w-3.5 h-3.5 text-blue-700' />
            <span>LinkedIn Post</span>
          </button>

          <button
            type='button'
            onClick={() => setActiveTab('newsletter')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 ${
              activeTab === 'newsletter'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Mail className='w-3.5 h-3.5 text-purple-600' />
            <span>Email Newsletter</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
          {isLoading ? (
            <div className='py-16 text-center space-y-3'>
              <div className='w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-spin'>
                <Sparkles className='w-6 h-6' />
              </div>
              <h4 className='text-sm font-semibold text-slate-800'>
                Synthesizing Multi-Channel Formats...
              </h4>
              <p className='text-xs text-slate-400'>
                Crafting viral hooks, whitespace formatting, and newsletter subject lines.
              </p>
            </div>
          ) : !repurposedData ? (
            <div className='py-16 text-center text-slate-400 text-xs'>
              No repurposed data generated yet.
            </div>
          ) : (
            <>
              {/* 1. Twitter Thread Tab */}
              {activeTab === 'twitter' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-slate-500'>
                      Pre-formatted {totalTweets} tweet viral thread with hook, numbered progression, and CTA.
                    </p>
                    <button
                      type='button'
                      onClick={handleCopyAllTweets}
                      className='px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1.5 cursor-pointer'
                    >
                      {copiedKey === 'full-thread' ? (
                        <Check className='w-3.5 h-3.5 text-emerald-600' />
                      ) : (
                        <Copy className='w-3.5 h-3.5' />
                      )}
                      <span>Copy Entire Thread</span>
                    </button>
                  </div>

                  <div className='space-y-3'>
                    {uniqueTweets.map((tweetText, idx) => {
                      const fullNumberedTweet = `${idx + 1}/${totalTweets} ${tweetText}`
                      return (
                        <div
                          key={idx}
                          className='bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 relative group hover:border-sky-300 transition'
                        >
                          <div className='flex items-center justify-between text-[11px] font-semibold text-sky-600 mb-1.5'>
                            <span>Tweet {idx + 1} of {totalTweets}</span>
                            <div className='flex items-center gap-2'>
                              <span
                                className={`text-[10px] ${
                                  fullNumberedTweet.length > 280
                                    ? 'text-rose-500 font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {fullNumberedTweet.length}/280 chars
                              </span>
                              <button
                                type='button'
                                onClick={() => handleCopy(fullNumberedTweet, `tweet-${idx}`)}
                                className='text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer'
                                title='Copy this tweet'
                              >
                                {copiedKey === `tweet-${idx}` ? (
                                  <Check className='w-3 h-3 text-emerald-600' />
                                ) : (
                                  <Clipboard className='w-3 h-3' />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className='text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed'>
                            <span className='font-bold text-sky-700 mr-1'>
                              {idx + 1}/{totalTweets}
                            </span>
                            {tweetText}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 2. LinkedIn Post Tab */}
              {activeTab === 'linkedin' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-slate-500'>
                      Formatted with optimal line breaks, bulleted takeaways, and discussion prompt.
                    </p>
                    <button
                      type='button'
                      onClick={() => handleCopy(repurposedData.linkedInPost, 'linkedin-post')}
                      className='px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer'
                    >
                      {copiedKey === 'linkedin-post' ? (
                        <Check className='w-3.5 h-3.5' />
                      ) : (
                        <Clipboard className='w-3.5 h-3.5' />
                      )}
                      <span>Copy LinkedIn Post</span>
                    </button>
                  </div>

                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 font-sans text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed'>
                    {repurposedData.linkedInPost}
                  </div>
                </div>
              )}

              {/* 3. Email Newsletter Tab */}
              {activeTab === 'newsletter' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-slate-500'>
                      Ready to send newsletter with subject lines, preview hook, and takeaways.
                    </p>
                    <button
                      type='button'
                      onClick={() =>
                        handleCopy(
                          `Subject: ${repurposedData.newsletter?.subject}\nPreview: ${repurposedData.newsletter?.preview}\n\n${repurposedData.newsletter?.body}`,
                          'newsletter-copy'
                        )
                      }
                      className='px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer'
                    >
                      {copiedKey === 'newsletter-copy' ? (
                        <Check className='w-3.5 h-3.5' />
                      ) : (
                        <Clipboard className='w-3.5 h-3.5' />
                      )}
                      <span>Copy Full Newsletter</span>
                    </button>
                  </div>

                  {/* Subject Line Pill */}
                  <div className='bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 space-y-1'>
                    <span className='text-[10px] font-bold uppercase text-purple-700 tracking-wider'>
                      Catchy Subject Line:
                    </span>
                    <p className='text-xs sm:text-sm font-semibold text-purple-950'>
                      {repurposedData.newsletter?.subject}
                    </p>
                    {repurposedData.newsletter?.preview && (
                      <p className='text-[11px] text-purple-700/80 pt-1'>
                        <span className='font-semibold'>Preview Text:</span>{' '}
                        {repurposedData.newsletter?.preview}
                      </p>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed'>
                    {repurposedData.newsletter?.body}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ContentRepurposerModal
