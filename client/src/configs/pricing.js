/**
 * Visionary.ai — Unified Pricing & Plan Configuration
 * Single Source of Truth for all pricing, limits, features, and FAQ answers.
 */

export const PRICING_CONFIG = {
  currency: {
    usd: { symbol: '$', code: 'USD' },
    inr: { symbol: '₹', code: 'INR' },
  },
  plans: {
    free: {
      id: 'free',
      name: 'Starter Free',
      badge: 'Forever Free',
      tagline: 'Ideal for students, hobbyists, and exploring our AI capabilities.',
      pricing: {
        usd: { monthly: 0, annual: 0 },
        inr: { monthly: 0, annual: 0 },
      },
      credits: 10,
      period: 'one-time credits',
      features: [
        '10 Free AI Generations across tools',
        'Full-Length AI Article Writer (600-1800 words)',
        'Intelligent Text & Article Summarizer',
        'High-Speed Quick Code Snippet Generator',
        'Community Creations Gallery & Likes',
        'Standard Server Processing Queue',
      ],
      buttonText: 'Get Started for Free',
      highlighted: false,
    },
    pro: {
      id: 'premium',
      name: 'Pro Unlimited',
      badge: 'Most Popular Choice',
      tagline: 'For creators, founders, developers, and professionals who create at scale.',
      pricing: {
        usd: {
          monthly: 19,
          annualMonthly: 15, // $15/mo billed annually ($180/yr)
          annualTotal: 180,
          annualSavingsPercent: 20,
        },
        inr: {
          monthly: 1499,
          annualMonthly: 1249, // ₹1,249/mo billed annually (₹14,999/yr)
          annualTotal: 14999,
          annualSavingsPercent: 17,
        },
      },
      credits: 'Unlimited',
      features: [
        'Unlimited AI Generations — Zero Caps',
        'Photorealistic Text-to-Image AI (FLUX.1)',
        '1-Click AI Image Background Removal',
        'AI Object & Watermark Removal',
        'ATS Executive Resume Review & Scoring (5MB)',
        'Ultra-Fast Groq & Gemini 2.0 Flash Processing',
        'Export to Markdown, Code, & HD Images',
        'Priority 24/7 Support & Early Feature Access',
      ],
      buttonText: 'Upgrade to Pro ⚡',
      highlighted: true,
    },
  },
  faqItems: [
    {
      q: 'Is there a free plan available to try out?',
      a: 'Yes, absolutely! Our Free plan provides 10 free AI generations across Article Writing, Summarization, and Quick Code synthesis with zero credit card required.',
    },
    {
      q: 'Which AI models power Visionary AI?',
      a: 'We integrate Google Gemini 2.0 Flash and Groq Llama 3.3 70B for lightning-fast writing, analysis, and code synthesis, alongside FLUX.1 and Cloudinary for ultra-realistic image generation, background removal, and object inpainting.',
    },
    {
      q: 'Can I use the generated images and articles commercially?',
      a: 'Yes! All content, images, and code snippets you generate are 100% yours with full commercial rights. You can use them for personal projects, client deliverables, YouTube thumbnails, blogs, and marketing campaigns.',
    },
    {
      q: 'What are the pricing options for the Pro subscription?',
      a: 'The Pro plan is $19/month on monthly billing, or $15/month when billed annually ($180/year — saving 20%). For Indian customers, it is ₹1,499/month or ₹14,999/year via Razorpay. Pro unlocks unlimited generations, FLUX.1 photorealistic image generation, background removal, and ATS resume evaluation.',
    },
    {
      q: 'How does the Community Showcase work?',
      a: 'When you create something amazing—like an anime render or a captivating article intro—you can publish it to the Community tab with one click. Visitors can view creations freely, and registered users can like and remix prompts.',
    },
  ],
};

export default PRICING_CONFIG;
