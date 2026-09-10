import React from 'react'
import { dummyTestimonialData, assets } from '../assets/assets'
import { Star, Quote, CheckCircle } from 'lucide-react'

const Testimonials = () => {
  const testimonials = [
    ...dummyTestimonialData,
    {
      image: assets.profile_img_1,
      name: 'Sarah Chen',
      title: 'Senior Frontend Engineer, Apex Labs',
      content: 'The Quick Code generator and Resume Reviewer are shockingly accurate. It refactored complex asynchronous code in seconds. An indispensable tool in my developer toolkit.',
      rating: 5,
    },
  ]

  return (
    <section className='py-24 bg-slate-50/70 border-y border-gray-200/60'>
      <div className='max-w-7xl mx-auto px-4 sm:px-8'>
        {/* Section Header */}
        <div className='text-center max-w-2xl mx-auto mb-16'>
          <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700 mb-4'>
            <Star className='w-3.5 h-3.5 fill-emerald-600 text-emerald-600' /> Loved by Global Creators
          </div>
          <h2 className='text-3xl sm:text-5xl font-bold tracking-tight text-gray-900'>
            Trusted by Creators & Developers
          </h2>
          <p className='mt-4 text-base sm:text-lg text-gray-500'>
            Here is what professionals say about accelerating their content and design with Visionary AI.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {testimonials.map((item, index) => (
            <div
              key={index}
              className='p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between'
            >
              <div>
                {/* Rating & Quote icon */}
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-0.5 text-amber-500'>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < item.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className='w-6 h-6 text-indigo-200' />
                </div>

                {/* Content */}
                <p className='text-gray-600 text-sm leading-relaxed mb-6 italic'>
                  "{item.content}"
                </p>
              </div>

              {/* User profile info */}
              <div className='flex items-center gap-3 pt-4 border-t border-gray-100'>
                <img
                  src={item.image}
                  alt={item.name}
                  className='w-10 h-10 rounded-full object-cover border border-indigo-100 shadow-xs'
                />
                <div>
                  <div className='flex items-center gap-1.5'>
                    <h4 className='text-sm font-bold text-gray-900'>{item.name}</h4>
                    <CheckCircle className='w-3.5 h-3.5 text-blue-500' />
                  </div>
                  <p className='text-[11px] text-gray-400 font-medium'>{item.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
