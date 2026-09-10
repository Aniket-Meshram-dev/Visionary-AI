import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      q: 'Is there a free plan available to try out?',
      a: 'Yes, absolutely! Our Free plan provides instant access to AI Article Generation, Summarization, and Quick Code generation with free monthly credits. No credit card is required to sign up.',
    },
    {
      q: 'Which AI models power Visionary AI?',
      a: "We integrate Google Gemini's latest multi-modal LLMs for lightning-fast writing, analysis, and code synthesis, alongside Clipdrop's advanced diffusion engine for ultra-realistic image generation, background removal, and object replacement.",
    },
    {
      q: 'Can I use the generated images and articles commercially?',
      a: 'Yes! All content, images, and code snippets you generate are 100% yours with full commercial rights. You can use them for personal projects, client deliverables, YouTube thumbnails, blogs, and marketing campaigns.',
    },
    {
      q: 'What is included in the Premium subscription?',
      a: 'The Premium plan ($5/month billed annually) unlocks the entire tool suite including high-resolution AI Image Generation, Background & Object Removal, ATS Resume Reviewer, and priority queue processing.',
    },
    {
      q: 'How does the Community Showcase work?',
      a: 'When you create something amazing—like an anime render or a captivating article intro—you can publish it to the Community tab with one click. Other users can view, like, and get inspired by your prompts.',
    },
  ]

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  return (
    <section className='py-24 max-w-4xl mx-auto px-4 sm:px-8'>
      {/* Header */}
      <div className='text-center mb-14'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-primary mb-4'>
          <HelpCircle className='w-3.5 h-3.5' /> Got Questions?
        </div>
        <h2 className='text-3xl sm:text-5xl font-bold tracking-tight text-gray-900'>
          Frequently Asked Questions
        </h2>
        <p className='mt-4 text-base sm:text-lg text-gray-500'>
          Everything you need to know about the platform, credits, and AI features.
        </p>
      </div>

      {/* Accordion list */}
      <div className='space-y-4'>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-indigo-200 bg-indigo-50/20 shadow-xs'
                  : 'border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className='w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden'
              >
                <span className='text-base sm:text-lg font-bold text-gray-900'>
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className='px-5 sm:px-6 pb-6 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-indigo-100/60 pt-3'>
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Faq
