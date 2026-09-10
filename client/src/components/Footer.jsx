import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Github, Twitter, Linkedin, Sparkles } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-slate-900 text-gray-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img alt="Visionary.ai" className="h-8 object-contain" src={assets.logoLight} />
            </div>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              Empowering creators, engineers, and marketers worldwide with cutting-edge multi-modal AI tools powered by Google Gemini and Clipdrop.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[12px] font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All AI Models Operational
            </div>
          </div>

          {/* Tools Col */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              AI Tools
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#tools" className="hover:text-white transition">AI Article Writer</a>
              </li>
              <li>
                <a href="#tools" className="hover:text-white transition">Image Generation</a>
              </li>
              <li>
                <a href="#tools" className="hover:text-white transition">Quick Code Generator</a>
              </li>
              <li>
                <a href="#tools" className="hover:text-white transition">Background Removal</a>
              </li>
              <li>
                <a href="#tools" className="hover:text-white transition">Resume Reviewer</a>
              </li>
            </ul>
          </div>

          {/* Navigation Col */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigate('/ai/community')} className="hover:text-white transition cursor-pointer flex items-center gap-1">
                  Community Feed <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition">Why Visionary</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition">Pricing Plans</a>
              </li>
              <li>
                <button onClick={() => navigate('/ai')} className="hover:text-white transition cursor-pointer">
                  Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Architecture
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>Google Gemini 2.5</li>
              <li>Clipdrop AI Diffusion</li>
              <li>Neon Serverless Cloud</li>
              <li>Supabase Auth Ecosystem</li>
              <li>Cloudinary CDN</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Visionary AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-400 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 transition cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

