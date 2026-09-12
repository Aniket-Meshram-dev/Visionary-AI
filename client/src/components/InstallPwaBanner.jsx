import React, { useState } from 'react'
import { Download, X, Sparkles, Share, PlusSquare, WifiOff } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'

export const InstallPwaBanner = () => {
  const { isInstallable, isInstalled, isIOS, isOffline, showBanner, promptInstall, dismissBanner } =
    usePWA()
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [installing, setInstalling] = useState(false)

  // Handle Android / Chrome install click
  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true)
      return
    }
    setInstalling(true)
    await promptInstall()
    setInstalling(false)
  }

  return (
    <>
      {/* 1. Offline Indicator Banner */}
      {isOffline && (
        <aside
          role="status"
          aria-live="polite"
          className='fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-amber-500/90 backdrop-blur-md text-slate-950 px-4 py-2 rounded-xl shadow-lg border border-amber-400 flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300'
        >
          <div className='flex items-center gap-2'>
            <WifiOff className='w-4 h-4 text-slate-950 shrink-0' />
            <span>Offline Mode Active. Cached tools and creations are accessible.</span>
          </div>
        </aside>
      )}

      {/* 2. In-App Install Prompt Banner */}
      {!isInstalled && showBanner && (
        <aside
          aria-label="Install Application Banner"
          className='fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl shadow-indigo-950/50 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300'
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3 min-w-0'>
              <img
                src='/pwa-192x192.png'
                alt='Visionary.ai Icon'
                className='w-11 h-11 rounded-xl shadow-md border border-white/10 shrink-0 object-cover'
              />
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5'>
                  <h2 className='text-xs sm:text-sm font-bold text-white truncate'>
                    Install Visionary.ai
                  </h2>
                  <span className='px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'>
                    App
                  </span>
                </div>
                <p className='text-[11px] text-slate-400 truncate'>
                  Fast offline launch, fullscreen workspace, 0 latency.
                </p>
              </div>
            </div>

            <button
              onClick={dismissBanner}
              className='p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer'
              aria-label='Dismiss install prompt'
            >
              <X className='w-4 h-4' />
            </button>
          </div>

          {/* Action Row */}
          <div className='flex items-center gap-2 pt-1 border-t border-white/10'>
            <button
              onClick={dismissBanner}
              className='flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer'
            >
              Maybe Later
            </button>

            <button
              onClick={handleInstallClick}
              disabled={installing}
              className='flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50'
            >
              <Sparkles className='w-3.5 h-3.5 text-indigo-200' />
              <span>{isIOS ? 'How to Install' : 'Install App'}</span>
            </button>
          </div>

          {/* iOS Safari Installation Guide Modal/Tooltip */}
          {showIosGuide && isIOS && (
            <div className='mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2'>
              <p className='font-bold text-indigo-300 flex items-center gap-1.5'>
                <Share className='w-3.5 h-3.5' /> Install on iOS / Safari:
              </p>
              <ol className='list-decimal list-inside space-y-1 text-slate-300 text-[11px]'>
                <li>Tap the Safari <strong>Share</strong> button at bottom toolbar.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare className='w-3 h-3 inline' />.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
            </div>
          )}
        </aside>
      )}
    </>
  )
}

export default InstallPwaBanner
