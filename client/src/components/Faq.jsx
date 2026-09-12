import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { PRICING_CONFIG } from '../configs/pricing'

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(0)
  const faqs = PRICING_CONFIG.faqItems

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
