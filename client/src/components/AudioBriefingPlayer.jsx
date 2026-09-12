import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  Square,
  Volume2,
  Headphones,
  Mic,
  ChevronDown,
  Check,
  Sparkles,
  Search,
  X,
  Radio,
  Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

// Clean and normalize text for speech
function cleanTextForSpeech(text) {
  if (!text) return ''
  return text
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links
    .replace(/^[-*+]\s+/gm, '') // bullets
    .replace(/^[0-9]+\.\s+/gm, '') // numbers
    .replace(/>\s+/gm, '') // quotes
    .replace(/---+/g, '') // hr
    .replace(/[|]/g, ' ') // markdown table pipes
    .replace(/\s+/g, ' ')
    .trim()
}

// Split into short natural sentence chunks (supporting English '.', '!', '?' and Hindi danda '।')
function splitIntoSentenceChunks(text) {
  const cleaned = cleanTextForSpeech(text)
  if (!cleaned) return []

  // Split on '.', '!', '?', Hindi danda '।', or newlines
  const rawParts = cleaned.split(/([.!?।\n]+)/)
  const chunks = []
  for (let i = 0; i < rawParts.length; i += 2) {
    const segment = (rawParts[i] || '') + (rawParts[i + 1] || '')
    const trimmed = segment.trim()
    if (trimmed.length > 0) {
      // If a sentence is very long (> 180 chars), split by comma/semicolon for instant audio chunking
      if (trimmed.length > 180) {
        const subClauses = trimmed.split(/([,;:]+)/)
        for (let j = 0; j < subClauses.length; j += 2) {
          const sub = ((subClauses[j] || '') + (subClauses[j + 1] || '')).trim()
          if (sub.length > 0) chunks.push(sub)
        }
      } else {
        chunks.push(trimmed)
      }
    }
  }
  return chunks.length > 0 ? chunks : [cleaned]
}

// Curated Cloud HD voice profiles (Powered by our 100% free high-fidelity TTS engine)
const CLOUD_VOICES = [
  { id: 'cloud-hi', name: 'Natural Hindi (हिन्दी)', lang: 'hi', tag: 'Natural • Hindi', isDefaultHindi: true },
  { id: 'cloud-en-us', name: 'Natural English (US)', lang: 'en', tag: 'Natural • EN-US', isDefaultEnglish: true },
  { id: 'cloud-en-uk', name: 'Natural English (UK)', lang: 'en-GB', tag: 'Natural • EN-UK' },
  { id: 'cloud-en-in', name: 'Natural English (India)', lang: 'en-IN', tag: 'Natural • EN-IN' },
]

const AudioBriefingPlayer = ({ text, title = 'Executive Briefing' }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [totalSentences, setTotalSentences] = useState(0)
  
  // Audio Engine: 'cloud' (High-Fidelity MP3 stream, 100% works for Hindi & English) or 'local' (SpeechSynthesis)
  const [engineType, setEngineType] = useState('cloud')
  const [activeVoice, setActiveVoice] = useState(CLOUD_VOICES[0])
  const [systemVoices, setSystemVoices] = useState([])
  
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceSearch, setVoiceSearch] = useState('')
  const [activeTab, setActiveTab] = useState('cloud') // 'cloud' | 'system'

  // Refs for audio playback control
  const audioElementRef = useRef(null)
  const preloadedAudioRef = useRef(null)
  const sentencesRef = useRef([])
  const currentIndexRef = useRef(0)
  const isPlayingRef = useRef(false)
  const isPausedRef = useRef(false)
  const speedRef = useRef(1.0)
  const engineTypeRef = useRef('cloud')
  const activeVoiceRef = useRef(CLOUD_VOICES[0])

  speedRef.current = speed
  engineTypeRef.current = engineType
  activeVoiceRef.current = activeVoice

  // Initialize audio element and system voices
  useEffect(() => {
    // Create HTML5 Audio instance for cloud streaming
    const audio = new Audio()
    audioElementRef.current = audio

    const preloadAudio = new Audio()
    preloadedAudioRef.current = preloadAudio

    // Determine initial default voice based on text language
    const hasHindi = /[\u0900-\u097F]/.test(text || '')
    const defaultVoice = hasHindi ? CLOUD_VOICES[0] : CLOUD_VOICES[1]
    setActiveVoice(defaultVoice)
    activeVoiceRef.current = defaultVoice
    setEngineType('cloud')
    engineTypeRef.current = 'cloud'

    // Load available browser voices as secondary option
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadSysVoices = () => {
        const available = window.speechSynthesis.getVoices()
        if (available && available.length > 0) {
          setSystemVoices(available)
        }
      }
      loadSysVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadSysVoices
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowVoiceModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      stopAllAudio()
    }
  }, [text])

  // Stop all running audio safely
  const stopAllAudio = () => {
    isPlayingRef.current = false
    isPausedRef.current = false
    setIsPlaying(false)
    setIsPaused(false)
    currentIndexRef.current = 0
    setCurrentSentenceIndex(0)

    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.removeAttribute('src')
      audioElementRef.current.load()
    }
    if (preloadedAudioRef.current) {
      preloadedAudioRef.current.removeAttribute('src')
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (window._speechUtterance) {
      window._speechUtterance = null
    }
  }

  // Preload next audio sentence for zero-delay, gapless transitions
  const preloadNextSentence = (nextIndex) => {
    const sentences = sentencesRef.current
    if (!sentences || nextIndex >= sentences.length) return
    const nextText = sentences[nextIndex]
    const lang = activeVoiceRef.current?.lang || (hasHindi(nextText) ? 'hi' : 'en')
    const url = `/api/ai/tts-stream?text=${encodeURIComponent(nextText)}&lang=${lang}`
    if (preloadedAudioRef.current) {
      preloadedAudioRef.current.src = url
      preloadedAudioRef.current.load()
    }
  }

  const hasHindi = (str) => /[\u0900-\u097F]/.test(str || '')

  // Play Cloud Audio chunk via HTML5 Audio element
  const playCloudSentenceAtIndex = (index) => {
    if (!isPlayingRef.current || isPausedRef.current) return

    const sentences = sentencesRef.current
    if (!sentences || index >= sentences.length) {
      stopAllAudio()
      return
    }

    currentIndexRef.current = index
    setCurrentSentenceIndex(index)

    const textToSpeak = sentences[index]
    if (!textToSpeak) {
      playCloudSentenceAtIndex(index + 1)
      return
    }

    // Auto-detect chunk language (Hindi vs English)
    const isChunkHindi = hasHindi(textToSpeak)
    const lang = activeVoiceRef.current?.lang || (isChunkHindi ? 'hi' : 'en')
    const streamUrl = `/api/ai/tts-stream?text=${encodeURIComponent(textToSpeak)}&lang=${lang}`

    const audio = audioElementRef.current
    if (!audio) return

    audio.pause()
    audio.src = streamUrl
    audio.playbackRate = speedRef.current

    audio.onended = () => {
      if (isPlayingRef.current && !isPausedRef.current) {
        playCloudSentenceAtIndex(index + 1)
      }
    }

    audio.onerror = (e) => {
      console.warn('Cloud audio load error, trying next sentence:', e)
      if (isPlayingRef.current && !isPausedRef.current) {
        setTimeout(() => playCloudSentenceAtIndex(index + 1), 100)
      }
    }

    // Start playback immediately
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Preload upcoming sentence in background
          preloadNextSentence(index + 1)
        })
        .catch((err) => {
          console.warn('Audio play() interrupted or blocked:', err.message)
        })
    }
  }

  // Play Local SpeechSynthesis sentence chunk (Secondary option)
  const playLocalSentenceAtIndex = (index) => {
    if (!isPlayingRef.current || isPausedRef.current) return

    const sentences = sentencesRef.current
    if (!sentences || index >= sentences.length) {
      stopAllAudio()
      return
    }

    currentIndexRef.current = index
    setCurrentSentenceIndex(index)

    const textToSpeak = sentences[index]
    if (!textToSpeak) {
      playLocalSentenceAtIndex(index + 1)
      return
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    // Prevent Chromium V8 Garbage-Collection Bug:
    window._speechUtterance = utterance

    if (activeVoiceRef.current?.rawVoice) {
      utterance.voice = activeVoiceRef.current.rawVoice
    }
    utterance.lang = hasHindi(textToSpeak) ? 'hi-IN' : (utterance.voice?.lang || 'en-US')
    utterance.rate = speedRef.current
    utterance.volume = 1.0
    utterance.pitch = 1.0

    utterance.onend = () => {
      if (isPlayingRef.current && !isPausedRef.current) {
        playLocalSentenceAtIndex(index + 1)
      }
    }

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('SpeechSynthesis error:', e.error)
        // Auto-switch to Cloud Engine if browser voice fails on this language
        toast('Switching to HD Cloud Audio for flawless playback...', { icon: '🎙️' })
        setEngineType('cloud')
        engineTypeRef.current = 'cloud'
        playCloudSentenceAtIndex(index)
        return
      }
      if (isPlayingRef.current && !isPausedRef.current) {
        playLocalSentenceAtIndex(index + 1)
      }
    }

    window.speechSynthesis.resume()
    window.speechSynthesis.speak(utterance)
  }

  // Master Play Handler
  const handlePlay = () => {
    if (!text || !text.trim()) {
      toast.error('No summary text available to play')
      return
    }

    // If resumed from pause
    if (isPaused) {
      setIsPaused(false)
      setIsPlaying(true)
      isPlayingRef.current = true
      isPausedRef.current = false

      if (engineTypeRef.current === 'cloud') {
        if (audioElementRef.current) {
          audioElementRef.current.playbackRate = speedRef.current
          audioElementRef.current.play().catch(e => console.warn(e))
        }
      } else {
        if (window.speechSynthesis) {
          window.speechSynthesis.resume()
        }
      }
      return
    }

    // Fresh play start: prepare chunks
    stopAllAudio()
    const chunks = splitIntoSentenceChunks(text)
    if (chunks.length === 0) {
      toast.error('No readable text content')
      return
    }

    sentencesRef.current = chunks
    setTotalSentences(chunks.length)
    currentIndexRef.current = 0
    setCurrentSentenceIndex(0)
    isPlayingRef.current = true
    isPausedRef.current = false
    setIsPlaying(true)
    setIsPaused(false)

    // Auto-detect Hindi and ensure appropriate voice
    const isTextHindi = hasHindi(text)
    if (isTextHindi && activeVoiceRef.current?.lang !== 'hi') {
      setActiveVoice(CLOUD_VOICES[0])
      activeVoiceRef.current = CLOUD_VOICES[0]
    }

    if (engineTypeRef.current === 'cloud') {
      playCloudSentenceAtIndex(0)
    } else {
      setTimeout(() => {
        playLocalSentenceAtIndex(0)
      }, 50)
    }
  }

  // Handle Pause
  const handlePause = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setIsPaused(true)
      isPlayingRef.current = false
      isPausedRef.current = true

      if (engineTypeRef.current === 'cloud') {
        if (audioElementRef.current) {
          audioElementRef.current.pause()
        }
      } else {
        if (window.speechSynthesis) {
          window.speechSynthesis.pause()
        }
      }
    }
  }

  // Handle Stop
  const handleStop = () => {
    stopAllAudio()
  }

  // Handle Speed Change
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed)
    speedRef.current = newSpeed
    if (engineTypeRef.current === 'cloud') {
      if (audioElementRef.current) {
        audioElementRef.current.playbackRate = newSpeed
      }
    } else {
      if (isPlaying) {
        window.speechSynthesis.cancel()
        playLocalSentenceAtIndex(currentIndexRef.current)
      }
    }
  }

  // Select Cloud Voice
  const handleSelectCloudVoice = (voice) => {
    setActiveVoice(voice)
    setEngineType('cloud')
    engineTypeRef.current = 'cloud'
    setShowVoiceModal(false)
    toast.success(`Voice set to: ${voice.name}`)

    if (isPlaying) {
      stopAllAudio()
      setTimeout(() => handlePlay(), 80)
    }
  }

  // Select System Voice
  const handleSelectSystemVoice = (voice) => {
    const formatted = {
      id: voice.voiceURI,
      name: voice.name.replace(/^Microsoft\s+|^Google\s+/i, ''),
      lang: voice.lang,
      tag: `${voice.name.includes('Female') ? 'Female' : 'Voice'} • ${voice.lang.toUpperCase()}`,
      rawVoice: voice,
    }
    setActiveVoice(formatted)
    setEngineType('local')
    engineTypeRef.current = 'local'
    setShowVoiceModal(false)
    toast.success(`Voice set to: ${formatted.name}`)

    if (isPlaying) {
      stopAllAudio()
      setTimeout(() => handlePlay(), 80)
    }
  }

  return (
    <div className='flex items-center gap-2 sm:gap-2.5 bg-white border border-slate-200/90 shadow-xs px-3 py-1.5 rounded-xl transition-all'>
      {/* Studio Badge & Wave */}
      <div className='flex items-center gap-1.5 pr-1 border-r border-slate-200/80'>
        <div className='w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0'>
          <Headphones className='w-3.5 h-3.5' />
        </div>
        <span className='text-xs font-bold text-slate-800 hidden sm:inline'>
          Audio Studio
        </span>

        {/* Dynamic Animated Waveform */}
        {isPlaying && (
          <div className='flex items-center gap-0.5 ml-1' title='Audio Playing'>
            <span className='w-0.5 h-3 bg-cyan-500 rounded-full animate-pulse' />
            <span className='w-0.5 h-4 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.2s]' />
            <span className='w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.4s]' />
            <span className='w-0.5 h-5 bg-cyan-600 rounded-full animate-bounce [animation-delay:-0.1s]' />
            <span className='w-0.5 h-2.5 bg-teal-400 rounded-full animate-pulse' />
          </div>
        )}
      </div>

      {/* Main Play / Pause Button */}
      <div className='flex items-center gap-1'>
        {isPlaying ? (
          <button
            type='button'
            onClick={handlePause}
            className='py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs'
            title='Pause Audio'
          >
            <Pause className='w-3 h-3 fill-white' />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type='button'
            onClick={handlePlay}
            className='py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer shadow-xs'
            title='Listen to Summary'
          >
            <Play className='w-3 h-3 fill-white' />
            <span>{isPaused ? 'Resume' : 'Listen'}</span>
          </button>
        )}

        {(isPlaying || isPaused) && (
          <button
            type='button'
            onClick={handleStop}
            className='p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer'
            title='Stop Playback'
          >
            <Square className='w-3.5 h-3.5 fill-slate-500' />
          </button>
        )}
      </div>

      {/* Speed Selector */}
      <div className='flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600'>
        {[1.0, 1.25, 1.5].map((s) => (
          <button
            key={s}
            type='button'
            onClick={() => handleSpeedChange(s)}
            className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
              speed === s
                ? 'bg-white text-cyan-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Voice Selection Pill */}
      <button
        type='button'
        onClick={() => setShowVoiceModal(true)}
        className='flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer max-w-[140px] sm:max-w-[185px]'
        title='Choose AI Narrator'
      >
        <Mic className='w-3 h-3 text-cyan-600 shrink-0' />
        <span className='truncate text-[11px] font-medium'>
          {activeVoice?.name || 'HD Narrator'}
        </span>
        <ChevronDown className='w-3 h-3 text-slate-400 shrink-0' />
      </button>

      {/* Professional Modal for Voice Selection */}
      {showVoiceModal && (
        <div className='fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[300] p-4 animate-in fade-in duration-150'>
          <div className='bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]'>
            {/* Modal Header */}
            <div className='p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center'>
                  <Volume2 className='w-4 h-4' />
                </div>
                <div>
                  <h3 className='text-sm font-bold text-slate-900'>Choose AI Narrator</h3>
                  <p className='text-[11px] text-slate-500'>
                    High-definition natural speech for Hindi & English
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setShowVoiceModal(false)}
                className='p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className='flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1 text-xs'>
              <button
                type='button'
                onClick={() => setActiveTab('cloud')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'cloud'
                    ? 'bg-white text-cyan-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className='w-3.5 h-3.5 text-cyan-600' />
                <span>HD Cloud Voices (Recommended)</span>
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'system'
                    ? 'bg-white text-cyan-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className='w-3.5 h-3.5 text-slate-500' />
                <span>Browser Voices</span>
              </button>
            </div>

            {/* Tab 1: HD Cloud Voices */}
            {activeTab === 'cloud' && (
              <div className='flex-1 overflow-y-auto p-3 space-y-2'>
                <div className='bg-cyan-50/70 border border-cyan-200/80 rounded-xl p-2.5 text-[11px] text-cyan-900 flex items-start gap-2'>
                  <Sparkles className='w-4 h-4 text-cyan-600 shrink-0 mt-0.5' />
                  <span>
                    <strong>HD Cloud Audio</strong> streams natural human pronunciation in <strong>Hindi and English</strong> with zero installation, zero lag, and 100% free reliability.
                  </span>
                </div>

                <div className='space-y-1.5'>
                  {CLOUD_VOICES.map((v) => {
                    const isSelected = engineType === 'cloud' && activeVoice?.id === v.id
                    return (
                      <button
                        key={v.id}
                        type='button'
                        onClick={() => handleSelectCloudVoice(v)}
                        className={`w-full p-3 rounded-xl text-left transition flex items-center justify-between cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-50/80 border-cyan-400 text-cyan-950 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                        }`}
                      >
                        <div className='min-w-0 pr-2'>
                          <div className='text-xs font-bold flex items-center gap-1.5'>
                            <span>{v.name}</span>
                            <span className='text-[10px] font-semibold bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded-full'>
                              {v.tag}
                            </span>
                          </div>
                          <div className='text-[11px] text-slate-400 mt-0.5'>
                            Zero-lag natural streaming
                          </div>
                        </div>

                        {isSelected ? (
                          <div className='w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs'>
                            <Check className='w-3.5 h-3.5' />
                          </div>
                        ) : (
                          <div className='w-6 h-6 rounded-full border border-slate-200 shrink-0' />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: System Browser Voices */}
            {activeTab === 'system' && (
              <div className='flex-1 overflow-y-auto p-3 space-y-2'>
                <div className='relative mb-2'>
                  <Search className='w-3.5 h-3.5 text-slate-400 absolute left-3 top-3' />
                  <input
                    type='text'
                    value={voiceSearch}
                    onChange={(e) => setVoiceSearch(e.target.value)}
                    placeholder='Filter local system voices...'
                    className='w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-cyan-500'
                  />
                </div>

                <div className='space-y-1 max-h-[280px] overflow-y-auto'>
                  {systemVoices
                    .filter(
                      (v) =>
                        v.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
                        v.lang.toLowerCase().includes(voiceSearch.toLowerCase())
                    )
                    .map((v) => {
                      const isSelected = engineType === 'local' && activeVoice?.id === v.voiceURI
                      return (
                        <button
                          key={v.voiceURI}
                          type='button'
                          onClick={() => handleSelectSystemVoice(v)}
                          className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? 'bg-cyan-50 border-cyan-400 text-cyan-950 shadow-xs'
                              : 'hover:bg-slate-50 text-slate-700 border-transparent'
                          }`}
                        >
                          <div className='min-w-0 pr-2'>
                            <div className='text-xs font-semibold truncate'>
                              {v.name.replace(/^Microsoft\s+|^Google\s+/i, '')}
                            </div>
                            <div className='text-[11px] text-slate-400 mt-0.5'>
                              {v.lang}
                            </div>
                          </div>

                          {isSelected ? (
                            <div className='w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0'>
                              <Check className='w-3 h-3' />
                            </div>
                          ) : (
                            <div className='w-5 h-5 rounded-full border border-slate-200 shrink-0' />
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className='p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between'>
              <span>100% Free • Works on all devices</span>
              <button
                type='button'
                onClick={() => setShowVoiceModal(false)}
                className='px-3 py-1 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition cursor-pointer'
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioBriefingPlayer
