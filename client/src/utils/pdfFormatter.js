/**
 * Intelligent Content-Aware PDF Formatter
 * Analyzes article/summary structure, themes, and formats high-DPI vector printable documents.
 */

// Analyze text content to determine optimal document styling and categorization
export function analyzeContentForPdf(text = '', meta = {}) {
  const content = text || ''
  const hasCodeBlocks = /```[\s\S]*?```/.test(content)
  const hasTables = /\|.*\|.*\|/.test(content)
  const hasNumberedThread = /^[0-9]+\/[0-9]+/m.test(content)
  const bulletCount = (content.match(/^[-*+]\s+/gm) || []).length
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const isHindi = /[\u0900-\u097F]/.test(content)

  let detectedType = 'article'
  let label = 'In-Depth Research Article'
  let badge = 'EDITORIAL PUBLICATION'
  let themeColor = '#0284c7' // Sky 600
  let secondaryColor = '#e0f2fe'

  if (meta.type === 'resume' || /ats|resume|audit|scoring|career|cover letter/i.test(meta.title || '') || /ats score|keyword match|bullet impact/i.test(content)) {
    detectedType = 'resume'
    label = 'Executive Career & ATS Diagnostic'
    badge = 'CAREER AUDIT & DIAGNOSTIC'
    themeColor = '#059669' // Emerald 600
    secondaryColor = '#d1fae5'
  } else if (hasNumberedThread || meta.type === 'thread' || /thread|linkedin|social/i.test(meta.title || '')) {
    detectedType = 'social'
    label = 'Omni-Channel Distribution Brief'
    badge = 'SOCIAL & MEDIA CAMPAIGN'
    themeColor = '#7c3aed' // Violet 600
    secondaryColor = '#ede9fe'
  } else if (meta.type === 'summary' || (bulletCount > 6 && wordCount < 800) || /summary|briefing|संक्षिप्त/i.test(meta.title || '')) {
    detectedType = 'summary'
    label = 'Executive Intelligence Briefing'
    badge = 'EXECUTIVE BRIEFING'
    themeColor = '#0d9488' // Teal 600
    secondaryColor = '#ccfbf1'
  } else if (hasCodeBlocks || /function|class|import|const|def|api|docker|architecture/i.test(content)) {
    detectedType = 'technical'
    label = 'Technical Architecture & Spec'
    badge = 'TECHNICAL WHITE PAPER'
    themeColor = '#0f766e' // Dark Teal
    secondaryColor = '#f0fdfa'
  } else {
    detectedType = 'article'
    label = 'Comprehensive Deep-Dive'
    badge = 'SPECIAL REPORT'
    themeColor = '#2563eb' // Blue 600
    secondaryColor = '#dbeafe'
  }

  // Extract up to 4 key takeaways from bold points or bullets
  const takeaways = []
  const bulletMatches = content.match(/^[-*+]\s+(.+)$/gm)
  if (bulletMatches && bulletMatches.length > 0) {
    bulletMatches.slice(0, 4).forEach((b) => {
      const clean = b.replace(/^[-*+]\s+/, '').replace(/\*\*/g, '').trim()
      if (clean.length > 10 && clean.length < 180) {
        takeaways.push(clean)
      }
    })
  }

  return {
    detectedType,
    label,
    badge,
    themeColor,
    secondaryColor,
    wordCount,
    readTime: Math.max(1, Math.ceil(wordCount / 200)),
    isHindi,
    hasTables,
    hasCodeBlocks,
    takeaways,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }
}

// Simple lightweight Markdown to HTML converter for high-fidelity printing
export function convertMarkdownToPrintableHtml(md = '') {
  if (!md) return ''

  let html = md
    // Clean carriage returns
    .replace(/\r\n/g, '\n')

    // Code blocks
    .replace(/```([a-z]*)\n([\s\S]*?)```/gm, (_, lang, code) => {
      const clean = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<div class="code-block-wrapper page-break-avoid"><div class="code-header">${lang || 'Code Snippet'}</div><pre class="code-block"><code>${clean}</code></pre></div>`
    })

    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

    // Headings
    .replace(/^# (.*$)/gim, '<h1 class="doc-h1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="doc-h2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="doc-h3">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="doc-h4">$1</h4>')

    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="doc-blockquote">$1</blockquote>')

    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Horizontal rules
    .replace(/^---$/gim, '<hr class="doc-divider" />')

  // Parse Markdown Tables
  html = html.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
    const lines = match.trim().split('\n')
    if (lines.length < 2) return match
    
    let tableHtml = '<div class="table-container page-break-avoid"><table class="doc-table"><thead><tr>'
    const headers = lines[0].split('|').filter(c => c.trim() !== '')
    headers.forEach(h => {
      tableHtml += `<th>${h.trim()}</th>`
    })
    tableHtml += '</tr></thead><tbody>'

    // Skip line 1 (the separator line |---|---|)
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').filter(c => c.trim() !== '')
      if (cells.length > 0) {
        tableHtml += '<tr>'
        cells.forEach(c => {
          tableHtml += `<td>${c.trim()}</td>`
        })
        tableHtml += '</tr>'
      }
    }
    tableHtml += '</tbody></table></div>'
    return tableHtml
  })

  // Parse bullet and numbered lists
  html = html
    .replace(/^[-*+]\s+(.*$)/gim, '<li class="doc-li">$1</li>')
    .replace(/^[0-9]+\.\s+(.*$)/gim, '<li class="doc-li-num">$1</li>')

  // Wrap loose <li> in <ul> / <ol>
  html = html.replace(/(<li class="doc-li">[\s\S]*?<\/li>)+/g, '<ul class="doc-ul">$&</ul>')
  html = html.replace(/(<li class="doc-li-num">[\s\S]*?<\/li>)+/g, '<ol class="doc-ol">$&</ol>')

  // Paragraphs
  const paragraphs = html.split(/\n{2,}/)
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<hr')
      ) {
        return trimmed
      }
      return `<p class="doc-p">${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n\n')

  return html
}

// Generate the complete high-DPI HTML document for vector PDF printing
export function generatePrintableHtml({
  title = 'Untitled Document',
  content = '',
  coverImageUrl = '',
  meta = {},
  theme = 'executive', // 'executive' | 'modern' | 'minimalist'
  options = {
    includeCover: true,
    includeTakeaways: true,
    includeMetaGrid: true,
    includeWatermark: true,
  },
}) {
  const analysis = analyzeContentForPdf(content, meta)
  const bodyHtml = convertMarkdownToPrintableHtml(content)

  const isHindi = analysis.isHindi

  return `<!DOCTYPE html>
<html lang="${isHindi ? 'hi' : 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${title} - Visionary.ai</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 16mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${
        isHindi
          ? "'Noto Sans Devanagari', 'Inter', sans-serif"
          : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      };
      color: #1e293b;
      background: #ffffff;
      line-height: 1.65;
      font-size: 13.5px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .doc-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px 24px;
    }

    /* Header Letterhead */
    .doc-letterhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-logo-badge {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, ${analysis.themeColor}, #0284c7);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
    }

    .brand-text {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #0f172a;
    }

    .brand-text span {
      color: ${analysis.themeColor};
    }

    .doc-category-badge {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: ${analysis.themeColor};
      background: ${analysis.secondaryColor};
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid ${analysis.themeColor}30;
    }

    /* Cover Banner */
    .doc-cover-wrapper {
      margin-bottom: 24px;
      border-radius: 12px;
      overflow: hidden;
      max-height: 280px;
      border: 1px solid #e2e8f0;
    }

    .doc-cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Document Title */
    .doc-title-section {
      margin-bottom: 20px;
    }

    .doc-main-title {
      font-size: 26px;
      font-weight: 800;
      line-height: 1.25;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .doc-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-top: 14px;
      margin-bottom: 20px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.4px;
    }

    .meta-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 1px;
    }

    /* Key Takeaways Callout */
    .takeaway-card {
      background: ${analysis.secondaryColor}40;
      border-left: 4px solid ${analysis.themeColor};
      border-radius: 0 10px 10px 0;
      padding: 14px 18px;
      margin-bottom: 24px;
      break-inside: avoid;
    }

    .takeaway-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${analysis.themeColor};
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .takeaway-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .takeaway-item {
      font-size: 12px;
      color: #334155;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.45;
    }

    .takeaway-bullet {
      color: ${analysis.themeColor};
      font-weight: 800;
      line-height: 1;
      margin-top: 2px;
    }

    /* Typography & Content Elements */
    .doc-content {
      line-height: 1.7;
    }

    .doc-h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      break-after: avoid;
    }

    .doc-h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 10px;
      break-after: avoid;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .doc-h3 {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      margin-top: 16px;
      margin-bottom: 8px;
      break-after: avoid;
    }

    .doc-p {
      margin-bottom: 14px;
      color: #334155;
      text-align: justify;
    }

    .doc-blockquote {
      border-left: 3.5px solid ${analysis.themeColor};
      background: #f8fafc;
      padding: 10px 16px;
      font-style: italic;
      color: #475569;
      margin: 14px 0;
      border-radius: 0 8px 8px 0;
      break-inside: avoid;
    }

    .doc-ul, .doc-ol {
      margin-left: 20px;
      margin-bottom: 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .doc-li, .doc-li-num {
      color: #334155;
      line-height: 1.6;
    }

    .doc-divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }

    /* Tables */
    .table-container {
      margin: 18px 0;
      overflow-x: auto;
      break-inside: avoid;
    }

    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      border: 1px solid #cbd5e1;
    }

    .doc-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
    }

    .doc-table td {
      padding: 7px 12px;
      border: 1px solid #cbd5e1;
      color: #334155;
    }

    .doc-table tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Code Blocks */
    .code-block-wrapper {
      margin: 16px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #334155;
      background: #0f172a;
      break-inside: avoid;
    }

    .code-header {
      background: #1e293b;
      padding: 4px 12px;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
      border-bottom: 1px solid #334155;
    }

    .code-block {
      padding: 12px 14px;
      color: #f8fafc;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 11px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    .inline-code {
      background: #f1f5f9;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    /* Footer */
    .doc-footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
      break-inside: avoid;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-break-avoid {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body>
  <div class="doc-page">
    <!-- Header Letterhead -->
    <div class="doc-letterhead">
      <div class="brand-group">
        <div class="brand-logo-badge">V</div>
        <div class="brand-text">Visionary<span>.ai</span></div>
      </div>
      <div class="doc-category-badge">${analysis.badge}</div>
    </div>

    <!-- Optional Cover Banner -->
    ${
      options.includeCover && coverImageUrl
        ? `<div class="doc-cover-wrapper"><img src="${coverImageUrl}" class="doc-cover-img" alt="Cover Art" /></div>`
        : ''
    }

    <!-- Title & Meta Grid -->
    <div class="doc-title-section">
      <h1 class="doc-main-title">${title}</h1>
      
      ${
        options.includeMetaGrid
          ? `<div class="doc-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Format</span>
                <span class="meta-value">${analysis.label}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Words</span>
                <span class="meta-value">${analysis.wordCount.toLocaleString()} words</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Read Time</span>
                <span class="meta-value">~${analysis.readTime} min</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Generated</span>
                <span class="meta-value">${analysis.date}</span>
              </div>
            </div>`
          : ''
      }
    </div>

    <!-- Optional Executive Key Takeaways Callout -->
    ${
      options.includeTakeaways && analysis.takeaways.length > 0
        ? `<div class="takeaway-card">
            <div class="takeaway-title">
              <span>★ Key Strategic Insights</span>
            </div>
            <ul class="takeaway-list">
              ${analysis.takeaways
                .map(
                  (t) =>
                    `<li class="takeaway-item"><span class="takeaway-bullet">›</span><span>${t}</span></li>`
                )
                .join('')}
            </ul>
          </div>`
        : ''
    }

    <!-- Document Content Body -->
    <div class="doc-content">
      ${bodyHtml}
    </div>

    <!-- Footer -->
    ${
      options.includeWatermark
        ? `<div class="doc-footer">
            <div class="footer-left">
              <span>Visionary.ai Autonomous Intelligence Suite</span>
              <span>•</span>
              <span>Confidential & Authoritative Publication</span>
            </div>
            <div class="footer-right">
              <span>Date: ${analysis.date}</span>
            </div>
          </div>`
        : ''
    }
  </div>
</body>
</html>`
}

// Triggers native browser high-DPI vector PDF printing via isolated iframe
export function printDocumentToPdf(printableHtml) {
  return new Promise((resolve, reject) => {
    try {
      // Remove any existing print iframes
      const existingIframe = document.getElementById('visionary-print-iframe')
      if (existingIframe) existingIframe.remove()

      const iframe = document.createElement('iframe')
      iframe.id = 'visionary-print-iframe'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'

      document.body.appendChild(iframe)

      const doc = iframe.contentWindow?.document || iframe.contentDocument
      if (!doc) {
        throw new Error('Unable to create print document context')
      }

      doc.open()
      doc.write(printableHtml)
      doc.close()

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            resolve(true)
          } catch (err) {
            reject(err)
          }
        }, 500)
      }
    } catch (error) {
      reject(error)
    }
  })
}
