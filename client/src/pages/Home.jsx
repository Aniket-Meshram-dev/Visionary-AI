import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import AiTools from '../components/AiTools'
import ComparisonSlider from '../components/ComparisonSlider'
import HowItWorks from '../components/HowItWorks'
import Features from '../components/Features'
import Testimonials from '../components/Testimonials'
import Plan from '../components/Plan'
import Faq from '../components/Faq'
import CtaBanner from '../components/CtaBanner'
import Footer from '../components/Footer'

const Home = () => {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '')
      const scrollToTarget = () => {
        const element = document.getElementById(targetId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }

      // Immediate attempt
      scrollToTarget()

      // Retry slightly after mount to account for lazy-loaded assets & layout shifts
      const timer1 = setTimeout(scrollToTarget, 100)
      const timer2 = setTimeout(scrollToTarget, 300)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [location.hash, location.pathname])

  return (
    <div className='min-h-screen bg-[#07090E] text-slate-100 selection:bg-indigo-500 selection:text-white relative bg-grid-mesh overflow-hidden'>
      <Navbar />
      <main className='relative z-10'>
        <Hero />
        <StatsBar />
        <AiTools />
        <ComparisonSlider />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Plan />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}

export default Home
