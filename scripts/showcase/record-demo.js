import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECORDINGS_DIR = path.resolve(__dirname, '../../recordings');
let FFMPEG_PATH = 'C:\\Users\\ANIKET\\OneDrive\\Documents\\Projects\\Visionary AI\\node_modules\\ffmpeg-static\\ffmpeg.exe';
if (!fs.existsSync(FFMPEG_PATH)) {
  FFMPEG_PATH = 'ffmpeg';
}

if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Cinematic easeInOutCubic smooth scrolling
async function smoothScroll(page, targetY, durationMs = 1500, steps = 25) {
  try {
    const startY = await page.evaluate(() => window.scrollY);
    const diff = targetY - startY;
    const stepTime = durationMs / steps;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const current = startY + diff * ease;
      await page.evaluate((y) => window.scrollTo(0, y), current);
      await page.waitForTimeout(stepTime);
    }
  } catch (e) {
    console.log('Scroll skipped:', e.message);
  }
}

// Realistic human typing
async function humanType(page, selector, text, delayMs = 25) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
    await page.click(selector);
    for (const char of text) {
      await page.keyboard.type(char, { delay: delayMs });
    }
  } catch (e) {
    console.log(`Fallback type on ${selector}:`, e.message);
    try {
      await page.fill(selector, text);
    } catch (err) {
      console.log(`Could not fill ${selector}:`, err.message);
    }
  }
}

// Visual cursor movement simulation
async function moveMouseSmoothly(page, targetX, targetY, steps = 12) {
  try {
    await page.mouse.move(targetX, targetY, { steps });
  } catch (e) {}
}

async function runRecording() {
  console.log('🎬 Initializing Visionary.ai 1080p Playwright Full Showcase Recording...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--window-size=1920,1080',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Clear existing storage to start from clean guest Landing page
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  console.log('📍 SCENE 1: Landing Page Showcase');
  await page.waitForTimeout(2000);
  await moveMouseSmoothly(page, 960, 500);

  // Smooth scroll down through hero, features, comparison slider, pricing, FAQ
  console.log('  Scrolling to features and comparison slider...');
  await smoothScroll(page, 850, 1600);
  await page.waitForTimeout(1400);

  console.log('  Scrolling to 9 AI Tool Showcase Bento Grid...');
  await smoothScroll(page, 1850, 1800);
  await page.waitForTimeout(1500);

  console.log('  Scrolling to Pricing Matrix & Plans...');
  await smoothScroll(page, 2800, 1600);
  await page.waitForTimeout(1400);

  console.log('  Scrolling to FAQ & Footer...');
  await smoothScroll(page, 3800, 1400);
  await page.waitForTimeout(1000);

  console.log('  Gliding back to top for Auth Flow...');
  await smoothScroll(page, 0, 1400);
  await page.waitForTimeout(1000);

  console.log('📍 SCENE 2: Authentication Modal & Seamless Sign-In');
  const getStartedBtn = await page.$('button:has-text("Get Started Free")') || await page.$('button:has-text("Start Creating")');
  if (getStartedBtn) {
    await getStartedBtn.click();
  } else {
    await page.click('header button:has-text("Sign In"), header button:has-text("Get Started")');
  }
  await page.waitForTimeout(1200);

  // Type admin credentials
  console.log('  Entering admin credentials...');
  await humanType(page, 'input[type="email"]', 'admin@gmail.com', 20);
  await page.waitForTimeout(300);
  await humanType(page, 'input[type="password"]', 'Admin123@', 20);
  await page.waitForTimeout(500);

  // Click Sign In
  await page.click('button[type="submit"]:has-text("Sign In")');
  await page.waitForTimeout(2500); // Allow Supabase session handshake & redirect

  console.log('📍 SCENE 3: Workspace Hub & Telemetry Dashboard');
  await page.goto('http://localhost:5173/ai', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await moveMouseSmoothly(page, 700, 300);

  // Smooth scroll to view recent creations and quick launch tiles
  await smoothScroll(page, 550, 1400);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 0, 1000);
  await page.waitForTimeout(800);

  console.log('📍 SCENE 4: AI Article & Blog Generator');
  await page.goto('http://localhost:5173/ai/write-article', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Select Medium length and Thought Leadership tone
  const toneBtn = await page.$('button:has-text("Thought Leadership")') || await page.$('button:has-text("Technical")');
  if (toneBtn) await toneBtn.click();
  await page.waitForTimeout(300);

  // Pick sample prompt or type topic
  const samplePromptBtn = await page.$('button:has-text("The Rise of Autonomous AI Agents in 2026")');
  if (samplePromptBtn) {
    await samplePromptBtn.click();
  } else {
    await humanType(page, 'textarea, input[placeholder*="topic"]', 'The Rise of Autonomous AI Agents in 2026', 15);
  }
  await page.waitForTimeout(600);

  // Submit article generation
  const generateArticleBtn = await page.$('button[type="submit"]');
  if (generateArticleBtn) {
    console.log('  Generating article...');
    await generateArticleBtn.click();
    await page.waitForTimeout(4500);
  }

  // Scroll through generated article markdown preview
  await smoothScroll(page, 600, 1400);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 0, 1000);
  await page.waitForTimeout(600);

  console.log('📍 SCENE 5: Smart Executive Summarizer');
  await page.goto('http://localhost:5173/ai/summarize-article', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const sampleArticleText = `Artificial Intelligence in 2026 has transitioned from isolated prompt-response models to persistent, multi-agent autonomous ecosystems. Modern enterprise applications leverage self-orchestrating agent loops capable of dynamic code compilation, continuous integration testing, localized semantic memory retrieval, and cross-platform publishing. By delegating complex asynchronous workflows to specialized agentic runtimes, developer velocity increases tenfold while operational cognitive overhead drops significantly. Furthermore, next-generation LLM distillation enables lightning-fast edge execution with near-zero latency, transforming how SaaS solutions deliver real-time intelligence.`;
  await page.fill('textarea', sampleArticleText);
  await page.waitForTimeout(600);

  // Click 50% reduction preset
  const balancedBtn = await page.$('button:has-text("Balanced (50%)")');
  if (balancedBtn) await balancedBtn.click();
  await page.waitForTimeout(400);

  // Click Summarize
  const summarizeBtn = await page.$('button:has-text("Summarize Content")') || await page.$('button:has-text("Summarize")') || await page.$('button[type="submit"]');
  if (summarizeBtn) {
    console.log('  Summarizing content...');
    await summarizeBtn.click();
    await page.waitForTimeout(4000);
  }

  // Smooth scroll output and switch to mindmap if present
  await smoothScroll(page, 450, 1200);
  await page.waitForTimeout(1400);
  const mindmapTab = await page.$('button:has-text("Mindmap")');
  if (mindmapTab) {
    await mindmapTab.click();
    await page.waitForTimeout(1200);
  }
  await smoothScroll(page, 0, 800);

  console.log('📍 SCENE 6: High-Velocity AI Code Engine');
  await page.goto('http://localhost:5173/ai/quick-code', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click JavaScript pill
  const jsBtn = await page.$('button:has-text("JavaScript")');
  if (jsBtn) await jsBtn.click();
  await page.waitForTimeout(300);

  // Click sample prompt
  const codePromptBtn = await page.$('button:has-text("LRU Cache implementation with O(1) get and put")') || await page.$('button:has-text("Custom React hook")');
  if (codePromptBtn) {
    await codePromptBtn.click();
  } else {
    await humanType(page, 'textarea, input[placeholder*="prompt"]', 'LRU Cache implementation in JavaScript with O(1) get and put operations', 15);
  }
  await page.waitForTimeout(500);

  // Click Generate Code
  const genCodeBtn = await page.$('button:has-text("Generate Code")') || await page.$('button[type="submit"]');
  if (genCodeBtn) {
    console.log('  Generating code...');
    await genCodeBtn.click();
    await page.waitForTimeout(4500);
  }

  // Showcase code output, scroll editor, switch to Console runner
  await smoothScroll(page, 500, 1400);
  await page.waitForTimeout(1400);
  const consoleTab = await page.$('button:has-text("Terminal")') || await page.$('button:has-text("Console")') || await page.$('button:has-text("Run")');
  if (consoleTab) {
    await consoleTab.click();
    await page.waitForTimeout(1200);
  }
  await smoothScroll(page, 0, 800);

  console.log('📍 SCENE 7: FLUX.1 Neural Image Studio');
  await page.goto('http://localhost:5173/ai/generate-images', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Select Cyberpunk Neon style
  const cyberpunkStyle = await page.$('button:has-text("Cyberpunk Neon")') || await page.$('button:has-text("3D Render")');
  if (cyberpunkStyle) await cyberpunkStyle.click();
  await page.waitForTimeout(300);

  // Select 16:9 Landscape ratio
  const ratioBtn = await page.$('button:has-text("Landscape 16:9")') || await page.$('button:has-text("16:9")');
  if (ratioBtn) await ratioBtn.click();
  await page.waitForTimeout(300);

  // Click sample prompt
  const imagePrompt = await page.$('button:has-text("Futuristic cyberpunk city at night")');
  if (imagePrompt) {
    await imagePrompt.click();
  } else {
    await humanType(page, 'textarea, input[placeholder*="prompt"]', 'Futuristic cyberpunk city at night with flying cars and holographic neon signs, ultra-detailed 8k octane render', 15);
  }
  await page.waitForTimeout(500);

  // Click Generate
  const genImageBtn = await page.$('button:has-text("Generate Image")') || await page.$('button[type="submit"]');
  if (genImageBtn) {
    console.log('  Generating image...');
    await genImageBtn.click();
    await page.waitForTimeout(5000);
  }

  await smoothScroll(page, 450, 1200);
  await page.waitForTimeout(1800);
  await smoothScroll(page, 0, 800);

  console.log('📍 SCENE 8: Photo Cleanup Studio');
  await page.goto('http://localhost:5173/ai/photo-cleanup', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Toggle to Erase Object
  const eraseObjectTab = await page.$('button:has-text("Erase Object")');
  if (eraseObjectTab) {
    await eraseObjectTab.click();
    await page.waitForTimeout(800);
    // Type in #targetObject
    const targetInput = await page.$('#targetObject');
    if (targetInput) {
      await targetInput.fill('watermark and unwanted background logo');
    }
    await page.waitForTimeout(800);
  }

  // Toggle back to Remove Background
  const removeBgTab = await page.$('button:has-text("Remove Background")');
  if (removeBgTab) {
    await removeBgTab.click();
    await page.waitForTimeout(800);
  }

  await smoothScroll(page, 300, 1000);
  await page.waitForTimeout(1200);
  await smoothScroll(page, 0, 800);

  console.log('📍 SCENE 9: ATS Resume Reviewer');
  await page.goto('http://localhost:5173/ai/review-resume', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Switch to Paste Text mode
  const pasteTextBtn = await page.$('button:has-text("Paste Text")');
  if (pasteTextBtn) {
    await pasteTextBtn.click();
    await page.waitForTimeout(500);
  }

  const sampleResume = `ANIKET MESHRAM
Senior Full Stack Engineer | San Francisco, CA | aniket@example.com | github.com/aniket080808

PROFESSIONAL SUMMARY
Results-driven Full Stack Engineer with 5+ years of experience architecting high-scale cloud platforms and autonomous AI web applications. Proven track record reducing API latency by 45% and driving 200k+ MAU adoption.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React 19, Next.js 15, TailwindCSS, Redux Toolkit
Backend: Node.js, Express, PostgreSQL, Redis, Supabase, Stripe
AI & Cloud: Google Gemini, Groq Compound, Docker, AWS, Render

WORK EXPERIENCE
Senior Full Stack Engineer — CloudTech Solutions (2023 - Present)
• Architected multi-model AI content generation engine serving 50,000+ daily requests with 99.98% uptime.
• Decreased database response times by 42% through query optimization, connection pooling, and Redis caching.
• Designed ATS Resume Builder & Auditor suite utilizing automated keyword scoring and dynamic PDF export.

Full Stack Developer — Nexus Digital Labs (2021 - 2023)
• Developed responsive SaaS dashboard with real-time telemetry metrics using WebSockets and React.
• Integrated Stripe subscription billing workflow supporting 10,000+ paying subscribers.`;

  const resumeTextarea = await page.$('textarea');
  if (resumeTextarea) {
    await resumeTextarea.fill(sampleResume);
  }
  await page.waitForTimeout(600);

  // Enter Target Role
  const roleInput = await page.$('#roleInput') || await page.$('input[placeholder*="Role"]');
  if (roleInput) {
    await roleInput.fill('Senior Full Stack AI Engineer');
  }
  await page.waitForTimeout(500);

  // Click Audit Resume
  const auditBtn = await page.$('button[type="submit"]');
  if (auditBtn) {
    console.log('  Auditing resume for ATS score...');
    await auditBtn.click();
    await page.waitForTimeout(5000);
  }

  // Smooth scroll through ATS score cards, radar, and recommendations
  await smoothScroll(page, 600, 1500);
  await page.waitForTimeout(1800);

  // Switch to Bullet Optimizer tab (Google XYZ Formula)
  const bulletTab = await page.$('button:has-text("Bullet Optimizer")');
  if (bulletTab) {
    await bulletTab.click();
    await page.waitForTimeout(1500);
    await smoothScroll(page, 300, 1000);
    await page.waitForTimeout(1500);
  }
  await smoothScroll(page, 0, 1000);

  console.log('📍 SCENE 10: ATS Interactive Resume Builder Studio');
  await page.goto('http://localhost:5173/ai/resume-builder', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // Show Interview Wizard controls first
  console.log('  Demonstrating Interview Wizard mode...');
  const roleTargetInput = await page.$('input[placeholder*="Target Job Title"], input[placeholder*="Role"], input[value*="Developer"]');
  if (roleTargetInput) {
    await roleTargetInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Principal AI Systems Architect', { delay: 20 });
  }
  await page.waitForTimeout(800);

  // Now switch to Live Canvas & Studio Mode!
  console.log('  Switching to Live Canvas & Studio Mode...');
  const studioTabBtn = await page.$('button:has-text("Live Canvas & Studio")');
  if (studioTabBtn) {
    await studioTabBtn.click();
    await page.waitForTimeout(1500);
  }

  // Smooth scroll through the live A4 document canvas
  console.log('  Inspecting live A4 canvas preview...');
  await smoothScroll(page, 550, 1600);
  await page.waitForTimeout(2000);
  await smoothScroll(page, 0, 1000);
  await page.waitForTimeout(800);

  console.log('📍 SCENE 11: My Creations Vault');
  await page.goto('http://localhost:5173/ai/creations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // Switch filter tabs: Articles, Code Snippets, Images & Photos
  const filterNames = ['Articles', 'Code Snippets', 'Images & Photos', 'All Assets'];
  for (const name of filterNames) {
    const tabBtn = await page.$(`button:has-text("${name}")`);
    if (tabBtn) {
      await tabBtn.click();
      await page.waitForTimeout(700);
    }
  }
  await smoothScroll(page, 450, 1200);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 0, 800);

  console.log('📍 SCENE 12: Community Feed & Social Showcase');
  await page.goto('http://localhost:5173/ai/community', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // Click category filter: Images
  const imgFilterBtn = await page.$('button:has-text("Images")');
  if (imgFilterBtn) {
    await imgFilterBtn.click();
    await page.waitForTimeout(800);
  }

  // Click like button on first card
  const likeBtn = await page.$('button:has(.lucide-heart), button:has-text("❤️")');
  if (likeBtn) {
    await likeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Smooth scroll through community wall
  await smoothScroll(page, 650, 1600);
  await page.waitForTimeout(1800);
  await smoothScroll(page, 0, 1000);

  console.log('📍 SCENE 13: Enterprise Admin Cockpit');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Showcase KPI cards and telemetry
  await moveMouseSmoothly(page, 800, 250);
  await page.waitForTimeout(1000);

  // Switch between tabs: Community Moderation, System Health & Telemetry, Users & Subscriptions
  console.log('  Navigating admin management tabs...');
  const modTab = await page.$('button:has-text("Community Moderation")');
  if (modTab) {
    await modTab.click();
    await page.waitForTimeout(1000);
  }
  const healthTab = await page.$('button:has-text("System Health & Telemetry")');
  if (healthTab) {
    await healthTab.click();
    await page.waitForTimeout(1200);
  }
  const usersTab = await page.$('button:has-text("Users & Subscriptions")');
  if (usersTab) {
    await usersTab.click();
    await page.waitForTimeout(1000);
  }

  // Smooth scroll down to view User Management table
  console.log('  Inspecting User Management Database...');
  await smoothScroll(page, 550, 1500);
  await page.waitForTimeout(1800);
  await smoothScroll(page, 0, 1000);
  await page.waitForTimeout(1000);

  console.log('📍 SCENE 14: Polished Finale & Return to Landing');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await moveMouseSmoothly(page, 960, 400);
  await page.waitForTimeout(1500);

  console.log('🏁 Closing page and context to finalize WebM video stream...');
  await page.close();
  await context.close();
  await browser.close();

  // Find the generated video file
  const files = fs.readdirSync(RECORDINGS_DIR);
  const webmFiles = files
    .filter(f => f.endsWith('.webm'))
    .map(f => ({
      name: f,
      path: path.join(RECORDINGS_DIR, f),
      time: fs.statSync(path.join(RECORDINGS_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);

  if (webmFiles.length === 0) {
    throw new Error('No recorded .webm video was found in ' + RECORDINGS_DIR);
  }

  const latestWebm = webmFiles[0].path;
  const targetMp4 = path.join(RECORDINGS_DIR, 'visionary-ai-full-walkthrough.mp4');

  console.log(`✅ Raw WebM recording saved at: ${latestWebm}`);
  console.log('🔄 Transcoding WebM to High-Quality 1080p MP4 (H.264 / AAC) for LinkedIn & GitHub...');

  const ffmpegCmd = `"${FFMPEG_PATH}" -y -i "${latestWebm}" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.2 -preset slow -crf 20 -movflags +faststart "${targetMp4}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  const mp4Stats = fs.statSync(targetMp4);
  const sizeMb = (mp4Stats.size / (1024 * 1024)).toFixed(2);
  console.log(`🎉 Master Walkthrough Video successfully generated!`);
  console.log(`📁 MP4 Path: ${targetMp4} (${sizeMb} MB)`);
}

runRecording().catch((err) => {
  console.error('❌ Recording failed with error:', err);
  process.exit(1);
});
