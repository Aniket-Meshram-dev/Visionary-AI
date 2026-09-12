import React, { useState } from 'react'
import {
  ListOrdered,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Clock,
  Edit3,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react'

const ArticleOutlineBuilder = ({
  outlineData,
  onApprove,
  onRegenerate,
  isLoadingDraft,
}) => {
  const [sections, setSections] = useState(() => outlineData?.sections || [])
  const [articleTitle, setArticleTitle] = useState(() => outlineData?.title || '')
  const [editingTitleId, setEditingTitleId] = useState(null)
  const [newSubpointTexts, setNewSubpointTexts] = useState({})

  // Move section Up
  const moveUp = (index) => {
    if (index === 0) return
    const updated = [...sections]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setSections(updated)
  }

  // Move section Down
  const moveDown = (index) => {
    if (index === sections.length - 1) return
    const updated = [...sections]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setSections(updated)
  }

  // Delete section
  const deleteSection = (id) => {
    if (sections.length <= 2) {
      return
    }
    setSections(sections.filter((s) => s.id !== id))
  }

  // Add new section
  const addSection = () => {
    const newId = Date.now()
    setSections([
      ...sections,
      {
        id: newId,
        title: `${sections.length + 1}. New Custom Section`,
        keyPoints: ['Add supporting detail or case study'],
      },
    ])
    setEditingTitleId(newId)
  }

  // Update section title
  const updateSectionTitle = (id, newTitle) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    )
  }

  // Delete keypoint
  const deleteKeyPoint = (sectionId, pointIdx) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          const filtered = s.keyPoints.filter((_, idx) => idx !== pointIdx)
          return { ...s, keyPoints: filtered }
        }
        return s
      })
    )
  }

  // Add subpoint
  const addKeyPoint = (sectionId) => {
    const text = (newSubpointTexts[sectionId] || '').trim()
    if (!text) return

    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, keyPoints: [...(s.keyPoints || []), text] }
        }
        return s
      })
    )

    setNewSubpointTexts({ ...newSubpointTexts, [sectionId]: '' })
  }

  const handleProceed = () => {
    onApprove({
      title: articleTitle,
      sections,
    })
  }

  return (
    <div className='bg-white rounded-2xl border border-blue-200/80 shadow-md p-5 sm:p-6 space-y-6 animate-in fade-in duration-300'>
      {/* Header Banner */}
      <div className='flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100'>
        <div>
          <div className='flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider'>
            <span className='px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 text-[10px] font-bold'>
              STAGE 1 of 3
            </span>
            <span>Outline Architect & Review</span>
          </div>
          <h3 className='text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center gap-2'>
            <ListOrdered className='w-5 h-5 text-blue-600' />
            Review & Customize Article Blueprint
          </h3>
          <p className='text-xs text-slate-500 mt-0.5'>
            Reorder sections, refine headings, or add key talking points before drafting.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <span className='flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg'>
            <Clock className='w-3.5 h-3.5 text-slate-400' />
            Est. {outlineData?.estimatedReadTime || '5 min'} read
          </span>

          <button
            type='button'
            onClick={onRegenerate}
            disabled={isLoadingDraft}
            className='px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50'
          >
            <RotateCcw className='w-3 h-3' />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Suggested Article Headline */}
      <div className='bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 space-y-1.5'>
        <label className='text-[11px] font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5'>
          <BookOpen className='w-3.5 h-3.5 text-blue-600' /> Recommended Headline (H1)
        </label>
        <input
          type='text'
          value={articleTitle}
          onChange={(e) => setArticleTitle(e.target.value)}
          className='w-full px-3 py-2 bg-white text-xs sm:text-sm font-bold text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        />
      </div>

      {/* Outline Sections Cards */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between text-xs font-semibold text-slate-700 px-1'>
          <span>Sections ({sections.length})</span>
          <span className='text-[11px] font-normal text-slate-400'>
            Use arrows to reorder • Click heading to edit
          </span>
        </div>

        {sections.map((sec, idx) => (
          <div
            key={sec.id || idx}
            className='bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-blue-300 hover:shadow-xs transition space-y-2.5'
          >
            <div className='flex items-start justify-between gap-2'>
              {/* Title Editor */}
              <div className='flex-1 min-w-0'>
                {editingTitleId === sec.id ? (
                  <div className='flex items-center gap-2'>
                    <input
                      type='text'
                      value={sec.title}
                      onChange={(e) => updateSectionTitle(sec.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingTitleId(null)}
                      autoFocus
                      className='w-full text-xs sm:text-sm font-semibold text-slate-900 bg-blue-50/50 border border-blue-300 rounded px-2.5 py-1 outline-none'
                    />
                    <button
                      type='button'
                      onClick={() => setEditingTitleId(null)}
                      className='p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer'
                    >
                      <Check className='w-3.5 h-3.5' />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingTitleId(sec.id)}
                    className='group flex items-center gap-2 cursor-pointer'
                  >
                    <span className='w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold flex items-center justify-center shrink-0'>
                      {idx + 1}
                    </span>
                    <h4 className='text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition'>
                      {sec.title}
                    </h4>
                    <Edit3 className='w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition' />
                  </div>
                )}
              </div>

              {/* Actions: Move Up / Down / Delete */}
              <div className='flex items-center gap-1 shrink-0'>
                <button
                  type='button'
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  title='Move section up'
                  className='p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition cursor-pointer'
                >
                  <ArrowUp className='w-3.5 h-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => moveDown(idx)}
                  disabled={idx === sections.length - 1}
                  title='Move section down'
                  className='p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition cursor-pointer'
                >
                  <ArrowDown className='w-3.5 h-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => deleteSection(sec.id)}
                  title='Delete section'
                  disabled={sections.length <= 2}
                  className='p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition cursor-pointer'
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </button>
              </div>
            </div>

            {/* Subpoints / Talking Points */}
            <div className='pl-7 space-y-1.5'>
              {(sec.keyPoints || []).map((point, pIdx) => (
                <div
                  key={pIdx}
                  className='flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100'
                >
                  <span className='truncate pr-2'>• {point}</span>
                  <button
                    type='button'
                    onClick={() => deleteKeyPoint(sec.id, pIdx)}
                    className='text-slate-400 hover:text-rose-500 cursor-pointer'
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add keypoint input */}
              <div className='flex items-center gap-1.5 pt-1'>
                <input
                  type='text'
                  placeholder='+ Add talking point or angle...'
                  value={newSubpointTexts[sec.id] || ''}
                  onChange={(e) =>
                    setNewSubpointTexts({
                      ...newSubpointTexts,
                      [sec.id]: e.target.value,
                    })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && addKeyPoint(sec.id)}
                  className='flex-1 text-[11px] px-2 py-0.5 bg-slate-50/60 border border-slate-200 rounded outline-none focus:bg-white focus:border-blue-400'
                />
                <button
                  type='button'
                  onClick={() => addKeyPoint(sec.id)}
                  className='text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 cursor-pointer'
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Section Button */}
      <button
        type='button'
        onClick={addSection}
        className='w-full py-2 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50/50 hover:bg-blue-50/30 transition flex items-center justify-center gap-1.5 cursor-pointer'
      >
        <Plus className='w-3.5 h-3.5' />
        <span>Add Another Section</span>
      </button>

      {/* Stage 2 Trigger CTA */}
      <div className='pt-3 border-t border-slate-100 flex items-center justify-between gap-3'>
        <p className='text-[11px] text-slate-500'>
          Ready to write? Stage 2 will stream in-depth content adhering strictly to this blueprint.
        </p>

        <button
          type='button'
          onClick={handleProceed}
          disabled={isLoadingDraft}
          className='py-2.5 px-5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50'
        >
          {isLoadingDraft ? (
            <>
              <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
              <span>Drafting Article...</span>
            </>
          ) : (
            <>
              <Sparkles className='w-4 h-4' />
              <span>Approve & Draft Full Article</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ArticleOutlineBuilder
