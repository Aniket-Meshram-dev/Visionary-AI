import { branding } from "./branding";
import gradientBackground from "./gradientBackground.png";
import user_group from "./user_group.png";
import star_icon from "./star_icon.svg";
import star_dull_icon from "./star_dull_icon.svg";
import profile_img_1 from "./profile_img_1.png";
import arrow_icon from "./arrow_icon.svg";
import { SquarePen, FileText, Code2, Image, Eraser, Scissors, ClipboardCheck } from 'lucide-react'
import ai_gen_img_1 from "./ai_gen_img_1.png";
import ai_gen_img_2 from "./ai_gen_img_2.png";
import ai_gen_img_3 from "./ai_gen_img_3.png";

export { branding };

export const assets = {
    logo: branding.logoFull,
    logoIcon: branding.logoIcon,
    logoLight: branding.logoLight,
    gradientBackground,
    user_group,
    star_icon,
    star_dull_icon,
    profile_img_1,
    arrow_icon,
};

export const AiToolsData = [
    {
        title: 'AI Article Writer',
        description: 'Generate high-quality, engaging articles on any topic with our AI writing technology.',
        Icon: SquarePen,
        bg: { from: '#3588F2', to: '#0BB0D7' },
        path: '/ai/write-article'
    },
    {
        title: 'Summarize Article',
        description: 'Quickly summarize long articles into concise and easy-to-read content.',
        Icon: FileText,
        bg: { from: '#B153EA', to: '#E549A3' },
        path: '/ai/summarize-article'
    },
    {
        title: 'Quick Code Generator',
        description: 'Generate clean and efficient code snippets instantly with AI assistance.',
        Icon: Code2,
        bg: { from: '#20C363', to: '#11B97E' },
        path: '/ai/quick-code'
    },
    {
        title: 'AI Image Generation',
        description: 'Create stunning visuals with our AI image generation tool.',
        Icon: Image,
        bg: { from: '#F7A30F', to: '#FF6B00' },
        path: '/ai/generate-images'
    },
    {
        title: 'Background Removal',
        description: 'Effortlessly remove backgrounds from your images with our AI-driven tool.',
        Icon: Eraser,
        bg: { from: '#F76C1C', to: '#F04A3C' },
        path: '/ai/remove-background'
    },
    {
        title: 'Object Removal',
        description: 'Remove unwanted objects from your images seamlessly with our AI object removal tool.',
        Icon: Scissors,
        bg: { from: '#5C6AF1', to: '#427DF5' },
        path: '/ai/remove-object'
    },
    {
        title: 'Resume Reviewer',
        description: 'Get your resume reviewed by AI to improve your chances of landing your dream job.',
        Icon: ClipboardCheck,
        bg: { from: '#12B7AC', to: '#08B6CE' },
        path: '/ai/review-resume'
    }
]

export const dummyTestimonialData = [
    {
        image: assets.profile_img_1,
        name: 'John Doe',
        title: 'Marketing Director, TechCorp',
        content: 'ContentAI has revolutionized our content workflow. The quality of the articles is outstanding, and it saves us hours of work every week.',
        rating: 4,
    },
    {
        image: assets.profile_img_1,
        name: 'Jane Smith',
        title: 'Content Creator, TechCorp',
        content: 'ContentAI has made our content creation process effortless. The AI tools have helped us produce high-quality content faster than ever before.',
        rating: 5,
    },
    {
        image: assets.profile_img_1,
        name: 'David Lee',
        title: 'Content Writer, TechCorp',
        content: 'ContentAI has transformed our content creation process. The AI tools have helped us produce high-quality content faster than ever before.',
        rating: 4,
    },
]


export const dummyCreationData = [
    {
        "id": 9,
        "user_id": "user_2yMX02PRbyMtQK6PebpjnxvRNIA",
        "prompt": "Generate a blog title for the keyword blog in the category Technology.",
        "content": "Here are a few blog title options for a technology blog...",
        "type": "blog-title",
        "publish": false,
        "likes": [],
        "created_at": "2025-07-01T11:09:50.492Z",
        "updated_at": "2025-07-01T11:09:50.492Z"
    }
    // keep rest same...
]


export const dummyPublishedCreationData = [
    {
        "id": 1,
        "user_id": "user_2yMX02PRbyMtQK6PebpjnxvRNIA",
        "prompt": "Generate an image of A Boy is on Boat , and fishing in the style Anime style.",
        "content": ai_gen_img_1,
        "type": "image",
        "publish": true,
        "likes": [
            "user_2yMX02PRbyMtQK6PebpjnxvRNIA",
            "user_2yaW5EHzeDfQbXdAJWYFnZo2bje"
        ],
        "created_at": "2025-06-19T09:02:25.035Z",
        "updated_at": "2025-06-19T09:58:37.552Z",
    }
    // keep rest same...
]