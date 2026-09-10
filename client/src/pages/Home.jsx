import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import AiTools from '../components/AiTools'
import HowItWorks from '../components/HowItWorks'
import Features from '../components/Features'
import Testimonials from '../components/Testimonials'
import Plan from '../components/Plan'
import Faq from '../components/Faq'
import CtaBanner from '../components/CtaBanner'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <div className='min-h-screen bg-[#FDFEFE] text-gray-900 selection:bg-indigo-500 selection:text-white'>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <AiTools />
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

