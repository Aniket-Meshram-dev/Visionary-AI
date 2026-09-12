import { branding } from "./branding";
import gradientBackground from "./gradientBackground.png";
import user_group from "./user_group.png";
import star_icon from "./star_icon.svg";
import star_dull_icon from "./star_dull_icon.svg";
import profile_img_1 from "./profile_img_1.png";
import arrow_icon from "./arrow_icon.svg";
import { SquarePen, FileText, Code2, Image, Eraser, Scissors, ClipboardCheck, Wand2 } from 'lucide-react'
import ai_gen_img_1 from "./ai_gen_img_1.png";
import ai_gen_img_2 from "./ai_gen_img_2.png";
import ai_gen_img_3 from "./ai_gen_img_3.png";
import slider_bg_before from "./slider_bg_before.jpg";
import slider_bg_after from "./slider_bg_after.jpg";
import slider_obj_before from "./slider_obj_before.jpg";
import slider_obj_after from "./slider_obj_after.jpg";

export { branding };

export const assets = {
    logo: branding.logoFull,
    logoFull: branding.logoFull,
    logoLight: branding.logoLight,
    logoIcon: branding.logoIcon,
    logoSmall: branding.logoIcon,
    logoMark: branding.logoIcon,
    profile_img_1,
    arrow_icon,
    user_group,
    star_icon,
    star_dull_icon,
    gradientBackground,
    ai_gen_img_1,
    ai_gen_img_2,
    ai_gen_img_3,
    slider_bg_before,
    slider_bg_after,
    slider_obj_before,
    slider_obj_after,
}

export const AiToolsData = [
    {
        title: 'AI Article Writer',
        description: 'Generate comprehensive, engaging articles on any topic with customizable length and tone.',
        Icon: SquarePen,
        bg: { from: '#0070F3', to: '#00DFD8' },
        path: '/ai/write-article'
    },
    {
        title: 'Article Summarizer',
        description: 'Condense long articles and documents into concise, digestible summaries effortlessly.',
        Icon: FileText,
        bg: { from: '#7928CA', to: '#FF0080' },
        path: '/ai/summarize-article'
    },
    {
        title: 'Quick Code Engine',
        description: 'Generate production-ready code snippets and algorithms across multiple programming languages.',
        Icon: Code2,
        bg: { from: '#10B981', to: '#059669' },
        path: '/ai/quick-code'
    },
    {
        title: 'AI Image Generation',
        description: 'Create stunning visuals and photo remixes with FLUX.1 diffusion engine.',
        Icon: Image,
        bg: { from: '#F7A30F', to: '#FF6B00' },
        path: '/ai/generate-images'
    },
    {
        title: 'Photo Cleanup & Eraser',
        description: '1-click transparent background cutout and smart generative object eraser in one unified studio.',
        Icon: Wand2,
        bg: { from: '#F76C1C', to: '#7C3AED' },
        path: '/ai/photo-cleanup'
    },
    {
        title: 'Resume Reviewer',
        description: 'Get your resume reviewed by AI to improve your chances of landing your dream job.',
        Icon: ClipboardCheck,
        bg: { from: '#12B7AC', to: '#08B6CE' },
        path: '/ai/review-resume'
    }
]