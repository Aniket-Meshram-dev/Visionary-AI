import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X, LayoutDashboard, Shield, Sparkles, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UserDropdown from './UserDropdown'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, openSignIn, isAdmin } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'AI Tools', href: '#tools' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Community', to: '/ai/community' },
  ]

  const handleNavClick = (link) => {
    setMobileMenuOpen(false)
    if (link.to) {
      navigate(link.to)
    } else if (link.href) {
      if (location.pathname !== '/') {
        navigate(`/${link.href}`)
      } else {
        const element = document.querySelector(link.href)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#07090E]/85 backdrop-blur-xl border-b border-slate-800/80 py-3 shadow-2xl shadow-black/40'
          : 'bg-transparent py-5'
      }`}
    >
      <div className='max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8'>
        {/* Logo */}
        <div className='flex items-center gap-3 cursor-pointer' onClick={() => navigate('/')}>
          <img src={assets.logoLight} alt='Visionary AI' className='h-8 sm:h-9 object-contain' />
        </div>

        {/* Desktop Nav Links */}
        <nav className='hidden md:flex items-center gap-1 px-3 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded-full backdrop-blur-md shadow-inner'>
          {navLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className='px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all rounded-full hover:bg-slate-800/80 cursor-pointer'
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Right CTA with Command Palette Trigger */}
        <div className='hidden sm:flex items-center gap-3'>
          <button
            type='button'
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className='flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 hover:bg-slate-800 hover:text-slate-200 border border-slate-800 px-3 py-1.5 rounded-full transition cursor-pointer'
            title='Open Command Palette (Ctrl+K)'
          >
            <Search className='w-3.5 h-3.5 text-indigo-400' />
            <span className='hidden lg:inline'>Quick Search...</span>
            <kbd className='text-[10px] font-mono bg-slate-800 border border-slate-700/80 px-1.5 py-0.5 rounded-md text-slate-400'>
              Ctrl K
            </kbd>
          </button>
          {user ? (
            <div className='flex items-center gap-2.5'>
              {/* Admin Portal Shortcut (Visible only to Admin) */}
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className='flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-full transition cursor-pointer border border-amber-500/30'
                >
                  <Shield className='w-3.5 h-3.5' /> Admin
                </button>
              )}

              <button
                onClick={() => navigate('/ai')}
                className='flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-full transition cursor-pointer border border-slate-800 shadow-xs'
              >
                <LayoutDashboard className='w-3.5 h-3.5 text-indigo-400' /> Workspace
              </button>
              <UserDropdown />
            </div>
          ) : (
            <button
              onClick={() => openSignIn('sign-in')}
              className='flex items-center gap-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all'
            >
              Get Started Free <ArrowRight className='w-3.5 h-3.5' />
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className='flex items-center gap-2 sm:hidden'>
          {user && <UserDropdown />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer border border-slate-800'
            aria-label='Toggle Menu'
          >
            {mobileMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className='sm:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 px-4 py-5 space-y-2 shadow-2xl'>
          {navLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className='block w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-indigo-400 rounded-xl transition'
            >
              {item.name}
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/admin')
              }}
              className='block w-full text-left px-3 py-2.5 text-sm font-bold text-amber-400 hover:bg-slate-900 rounded-xl transition'
            >
              👑 Admin Control Center
            </button>
          )}

          <div className='pt-3 border-t border-slate-800'>
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/ai')
                }}
                className='w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer shadow-md'
              >
                <LayoutDashboard className='w-4 h-4' /> Open AI Studio
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  openSignIn('sign-in')
                }}
                className='w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl cursor-pointer shadow-md'
              >
                Get Started Free <ArrowRight className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
