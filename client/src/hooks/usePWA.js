import { useState, useEffect, useCallback } from 'react'

/**
 * usePWA — Progressive Web App lifecycle, installation, and offline state manager
 */
export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
      const isStandaloneNavigator = window.navigator.standalone === true
      const isApp = isStandaloneMedia || isStandaloneNavigator || document.referrer.includes('android-app://')
      setIsInstalled(isApp)
      return isApp
    }

    const alreadyInstalled = checkStandalone()

    // 2. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream
    setIsIOS(isIosDevice)

    // 3. Listen for Chromium beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)

      // Show banner if not previously dismissed recently
      const dismissedTime = localStorage.getItem('visionary_pwa_dismissed')
      const now = Date.now()
      // If never dismissed, or dismissed over 7 days ago
      if (!dismissedTime || now - Number(dismissedTime) > 7 * 24 * 60 * 60 * 1000) {
        setShowBanner(true)
      }
    }

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] Visionary.ai successfully installed!')
      setIsInstalled(true)
      setIsInstallable(false)
      setShowBanner(false)
      setDeferredPrompt(null)
    }

    // 5. Network status listeners
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // On iOS Safari: show prompt if not in standalone and not dismissed recently
    if (isIosDevice && !alreadyInstalled) {
      const dismissedTime = localStorage.getItem('visionary_pwa_dismissed')
      const now = Date.now()
      if (!dismissedTime || now - Number(dismissedTime) > 7 * 24 * 60 * 60 * 1000) {
        setShowBanner(true)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Trigger Native Install Prompt
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { success: false, reason: 'no-prompt' }
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted installation')
        setIsInstalled(true)
        setShowBanner(false)
        setDeferredPrompt(null)
        return { success: true }
      } else {
        console.log('[PWA] User dismissed installation')
        return { success: false, reason: 'dismissed' }
      }
    } catch (err) {
      console.error('[PWA] Install prompt error:', err)
      return { success: false, error: err }
    }
  }, [deferredPrompt])

  // Dismiss Install Banner
  const dismissBanner = useCallback(() => {
    setShowBanner(false)
    localStorage.setItem('visionary_pwa_dismissed', String(Date.now()))
  }, [])

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isOffline,
    showBanner,
    promptInstall,
    dismissBanner,
  }
}

export default usePWA
