import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'

const VoiceInputButton = ({ onTranscript, className = '' }) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        }
      }
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript.trim())
      }
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition notice:', event.error)
      if (event.error === 'not-allowed') {
        toast.error('Microphone access was denied. Please allow microphone permissions in browser.')
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser. Please try Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      toast.success('Voice input stopped')
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
        toast.success('Listening... Speak your prompt now 🎙️', { id: 'mic-active' })
      } catch (err) {
        console.error('Error starting speech recognition:', err)
        setIsListening(false)
      }
    }
  }

  if (!isSupported) return null

  return (
    <button
      type='button'
      onClick={toggleListening}
      title={isListening ? 'Stop listening' : 'Dictate with Voice (Speech to Text)'}
      className={`relative p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
        isListening
          ? 'bg-rose-500/20 text-rose-500 ring-2 ring-rose-500/40 animate-pulse'
          : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 bg-transparent'
      } ${className}`}
    >
      {isListening && (
        <span className='absolute inset-0 rounded-lg bg-rose-500/30 animate-ping' />
      )}
      {isListening ? <MicOff className='w-4 h-4' /> : <Mic className='w-4 h-4' />}
    </button>
  )
}

export default VoiceInputButton
