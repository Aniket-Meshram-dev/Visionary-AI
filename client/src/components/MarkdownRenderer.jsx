import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Normalizes common markdown table quirks:
 * - Fixes empty lines between table header and delimiter (| col |\n\n|---|)
 * - Fixes inline tables glued together (| row1 || row2 |)
 */
const normalizeMarkdown = (content) => {
  if (!content || typeof content !== 'string') return ''

  let normalized = content
    // Replace double pipes used as row separators: " | || " -> " |\n| "
    .replace(/\|\s*\|\|/g, ' |\n|')
    .replace(/\|\s*\|(?=[A-Za-z0-9\-*#])/g, ' |\n| ')
    // Ensure delimiter row directly follows table header without blank lines
    .replace(/(\|[^\n]+\|)\s*\n\s*\n\s*(\|[-:| ]+\|)/g, '$1\n$2')

  return normalized
}

const MarkdownRenderer = ({ content, className = '' }) => {
  const cleanContent = normalizeMarkdown(content)

  return (
    <div className={`prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className='overflow-x-auto my-4 rounded-xl border border-slate-200/90 shadow-xs bg-white'>
              <table className='min-w-full divide-y divide-slate-200 text-left text-xs border-collapse' {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className='bg-slate-100/90 text-slate-800 font-semibold' {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className='px-4 py-2.5 font-bold text-slate-900 border-b border-slate-200 whitespace-nowrap' {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className='divide-y divide-slate-100 bg-white' {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className='px-4 py-2.5 text-slate-700 border-b border-slate-100 leading-normal align-top' {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className='hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/40' {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className='text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-3 first:mt-0 tracking-tight' {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className='text-base sm:text-lg font-bold text-slate-900 mt-5 mb-2.5 first:mt-0 tracking-tight flex items-center gap-2' {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className='text-sm sm:text-base font-semibold text-slate-800 mt-4 mb-2 first:mt-0' {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className='list-disc pl-5 my-3 space-y-1.5 marker:text-emerald-500' {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className='list-decimal pl-5 my-3 space-y-1.5 marker:text-emerald-600 font-medium' {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className='text-slate-700 pl-0.5' {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className='border-l-4 border-emerald-500 pl-4 py-1.5 my-3 bg-emerald-50/40 rounded-r-lg text-slate-600 italic' {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className='px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-indigo-600 font-semibold' {...props} />
            ) : (
              <code className='block p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-3' {...props} />
            ),
          hr: ({ node, ...props }) => (
            <hr className='my-5 border-slate-200/80' {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className='font-bold text-slate-900' {...props} />
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
