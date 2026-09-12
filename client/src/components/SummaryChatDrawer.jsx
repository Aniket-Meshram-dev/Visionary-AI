import React, { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import MarkdownRenderer from './MarkdownRenderer'
import { useAuth } from '../context/AuthContext'

const STARTER_PROMPTS = [
  'What are the core metrics and numbers mentioned?',
  'What are the 3 biggest actionable takeaways?',
  'Does this document mention any risks or limitations?',
  'Explain this to a 10-year-old in simple terms'
]

const SummaryChatDrawer = ({ summary, sourceContent, isOpenDefault = false }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatBottomRef = useRef(null)
  const { getToken } = useAuth()

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || input
    if (!textToSend || !textToSend.trim()) return

    if (!summary && !sourceContent) {
      toast.error('No document context available to query')
      return
    }

    const userMessage = { sender: 'user', text: textToSend.trim(), timestamp: Date.now() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

    try {
      const token = await getToken()
      const res = await axios.post(
        `${BASE_URL}/api/ai/chat-summary`,
        {
          summary,
          sourceContent,
          message: textToSend.trim(),
          history: nextMessages.slice(-6),
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )

      if (res.data?.success && res.data.reply) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: res.data.reply, timestamp: Date.now() },
        ])
      } else {
        toast.error(res.data?.message || 'Failed to get answer')
      }
    } catch (err) {
      console.error('chatWithSummary error:', err)
      toast.error(err.response?.data?.message || 'Error communicating with AI')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    setMessages([])
    toast.success('Chat history cleared')
  }

  return (
    <div className='mt-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all'>
      {/* Accordion Header */}
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full p-4 sm:px-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition cursor-pointer'
      >
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 flex items-center justify-center'>
            <MessageSquare className='w-4 h-4' />
          </div>
          <div className='text-left'>
            <h3 className='text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5'>
              Chat with this Document
              <span className='text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded'>
                Grounded Q&A
              </span>
            </h3>
            <p className='text-[11px] text-slate-500'>
              Ask follow-up questions strictly answered from the source text
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 text-slate-400'>
          {isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
        </div>
      </button>

      {/* Drawer Body */}
      {isOpen && (
        <div className='p-4 sm:p-5 border-t border-slate-100 space-y-4'>
          {/* Starter Prompts */}
          {messages.length === 0 && (
            <div className='space-y-2'>
              <p className='text-xs font-semibold text-slate-700 flex items-center gap-1'>
                <HelpCircle className='w-3.5 h-3.5 text-cyan-600' /> Quick questions you can ask:
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type='button'
                    onClick={() => handleSendMessage(prompt)}
                    className='text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 hover:border-cyan-300 rounded-lg px-2.5 py-1 transition cursor-pointer text-left'
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.length > 0 && (
            <div className='space-y-3 max-h-[360px] overflow-y-auto pr-1'>
              <div className='flex justify-end'>
                <button
                  type='button'
                  onClick={handleClearChat}
                  className='text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer'
                >
                  <Trash2 className='w-3 h-3' /> Clear history
                </button>
              </div>

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className='w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs'>
                      <Bot className='w-3.5 h-3.5' />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className='whitespace-pre-wrap'>{msg.text}</p>
                    ) : (
                      <MarkdownRenderer content={msg.text} />
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className='w-6 h-6 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs'>
                      <User className='w-3.5 h-3.5' />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className='flex gap-2.5 items-center text-slate-400 text-xs italic py-2'>
                  <div className='w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs'>
                    <Bot className='w-3.5 h-3.5' />
                  </div>
                  <span className='flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 rounded-full bg-cyan-600 animate-ping' />
                    Analyzing document context...
                  </span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Input Row */}
          <div className='flex items-center gap-2 pt-2 border-t border-slate-100'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask a question about this summary or document...'
              disabled={loading}
              className='flex-1 p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition'
            />
            <button
              type='button'
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className='p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1'
              title='Send Question'
            >
              <Send className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SummaryChatDrawer
