import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X, Sparkles, LayoutDashboard } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const { openSignIn } = useClerk()
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
    { name: 'Why Us', href: '#features' },
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
          ? 'bg-white/85 backdrop-blur-lg shadow-xs border-b border-gray-200/60 py-3'
          : 'bg-white/40 backdrop-blur-md py-4'
      }`}
    >
      <div className='max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8'>
        {/* Logo */}
        <div className='flex items-center gap-3 cursor-pointer' onClick={() => navigate('/')}>
          <img src={assets.logo} alt="Visionary AI" className='h-8 sm:h-9 object-contain' />
        </div>

        {/* Desktop Nav Links */}
        <nav className='hidden md:flex items-center gap-1 lg:gap-2 px-3 py-1.5 bg-gray-100/70 border border-gray-200/60 rounded-full backdrop-blur-sm'>
          {navLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className='px-3.5 py-1.5 text-xs lg:text-sm font-medium text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-white/80 cursor-pointer'
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Right CTA */}
        <div className='hidden sm:flex items-center gap-3'>
          {user ? (
            <div className='flex items-center gap-3'>
              <button
                onClick={() => navigate('/ai')}
                className='flex items-center gap-1.5 text-xs font-semibold text-primary bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-full transition cursor-pointer border border-indigo-200/50'
              >
                <LayoutDashboard className='w-3.5 h-3.5' /> Dashboard
              </button>
              <UserButton />
            </div>
          ) : (
            <button
              onClick={openSignIn}
              className='flex items-center gap-2 rounded-full text-xs sm:text-sm font-medium cursor-pointer bg-primary hover:bg-[#4338CA] text-white px-5 py-2.5 shadow-sm hover:shadow-md transition-all'
            >
              Get started <ArrowRight className='w-4 h-4' />
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className='flex items-center gap-2 sm:hidden'>
          {user && <UserButton />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            aria-label='Toggle Menu'
          >
            {mobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className='sm:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 py-4 space-y-2 shadow-lg'>
          {navLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className='block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-primary rounded-lg transition'
            >
              {item.name}
            </button>
          ))}
          <div className='pt-3 border-t border-gray-100'>
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/ai')
                }}
                className='w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg'
              >
                <LayoutDashboard className='w-4 h-4' /> Open Dashboard
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  openSignIn()
                }}
                className='w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg'
              >
                Get started <ArrowRight className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar

