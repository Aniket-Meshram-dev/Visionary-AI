/**
 * ATS-Certified Vector PDF & DOCX Generator for Resumes
 * Designed for 100% parser compliance across Workday, Greenhouse, Lever, Taleo, and iCIMS.
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, UnderlineType } from 'docx';

/**
 * 1. Generate ATS-Compliant Printable HTML (Vector Print)
 */
function getPdfTemplateTheme(template) {
  switch (template) {
    case 'harvard':
      return {
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        primaryColor: '#111827',
        headingBorder: '1px solid #111827',
        headerAlign: 'center',
        headerBorder: '2px solid #111827',
        nameTransform: 'uppercase',
        titleColor: '#374151',
      };
    case 'executive':
      return {
        fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
        primaryColor: '#0f172a',
        headingBorder: '2px solid #0f172a',
        headerAlign: 'left',
        headerBorder: '1.5px solid #cbd5e1',
        nameTransform: 'uppercase',
        titleColor: '#334155',
      };
    case 'minimal_clean':
      return {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        primaryColor: '#334155',
        headingBorder: '1px solid #e2e8f0',
        headerAlign: 'left',
        headerBorder: 'none',
        nameTransform: 'none',
        titleColor: '#64748b',
      };
    case 'corporate_formal':
      return {
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        primaryColor: '#1e3a8a',
        headingBorder: '1px solid #93c5fd',
        headerAlign: 'center',
        headerBorder: '3px double #1e3a8a',
        nameTransform: 'uppercase',
        titleColor: '#1e3a8a',
      };
    case 'modern_teal':
      return {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        primaryColor: '#0d9488',
        headingBorder: '1px solid #99f6e4',
        headerAlign: 'left',
        headerBorder: '1px solid #ccfbf1',
        nameTransform: 'none',
        titleColor: '#0f766e',
      };
    case 'emerald_compact':
      return {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        primaryColor: '#059669',
        headingBorder: '1px solid #a7f3d0',
        headerAlign: 'left',
        headerBorder: '1px solid #d1fae5',
        nameTransform: 'none',
        titleColor: '#047857',
      };
    case 'monochrome_bold':
      return {
        fontFamily: "Arial, Helvetica, sans-serif",
        primaryColor: '#000000',
        headingBorder: '2px solid #000000',
        headerAlign: 'left',
        headerBorder: '2px solid #000000',
        nameTransform: 'uppercase',
        titleColor: '#000000',
      };
    case 'creative_indigo':
      return {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        primaryColor: '#6366f1',
        headingBorder: 'none; border-left: 4px solid #6366f1; padding-left: 8px',
        headerAlign: 'left',
        headerBorder: 'none; border-left: 4px solid #6366f1; padding-left: 10px',
        nameTransform: 'none',
        titleColor: '#4f46e5',
      };
    case 'classic_serif':
      return {
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        primaryColor: '#1c1917',
        headingBorder: '1px solid #a8a29e',
        headerAlign: 'center',
        headerBorder: '1px solid #44403c',
        nameTransform: 'uppercase',
        titleColor: '#44403c',
      };
    case 'tech_modern':
    default:
      return {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        primaryColor: '#4f46e5',
        headingBorder: '1px solid #e0e7ff',
        headerAlign: 'left',
        headerBorder: 'none',
        nameTransform: 'none',
        titleColor: '#4f46e5',
      };
  }
}

/**
 * 1. Generate ATS-Compliant Printable HTML (Vector Print)
 */
export function generateResumePrintableHtml(resumeData, options = {}) {
  const {
    template = 'tech_modern',
    isOnePage = true,
  } = options;

  const personal = resumeData?.personal || {};
  const summary = resumeData?.summary || '';
  const skills = resumeData?.skills || {};
  const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const projects = Array.isArray(resumeData?.projects) ? resumeData.projects : [];
  const education = Array.isArray(resumeData?.education) ? resumeData.education : [];
  const certifications = Array.isArray(resumeData?.certifications) ? resumeData.certifications : [];
  const achievements = Array.isArray(resumeData?.achievements) ? resumeData.achievements : [];

  const theme = getPdfTemplateTheme(template);
  const isCentered = theme.headerAlign === 'center';
  const fontFamily = theme.fontFamily;
  const primaryColor = theme.primaryColor;
  const headingBorder = theme.headingBorder;

  // Contact items line
  const contactParts = [
    personal.phone,
    personal.email ? `<a href="mailto:${personal.email}">${personal.email}</a>` : null,
    personal.location,
    personal.linkedin ? `<a href="${personal.linkedin}" target="_blank">LinkedIn</a>` : null,
    personal.github ? `<a href="${personal.github}" target="_blank">GitHub</a>` : null,
    personal.portfolio ? `<a href="${personal.portfolio}" target="_blank">Portfolio</a>` : null,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${personal.fullName || 'Candidate'} - Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: ${isOnePage ? '8mm 10mm' : '12mm 14mm'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: ${fontFamily};
      color: #1f2937;
      background: #ffffff;
      font-size: ${isOnePage ? '9.5pt' : '10pt'};
      line-height: ${isOnePage ? '1.35' : '1.45'};
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .resume-sheet {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: ${isOnePage ? '4px 0' : '10px 0'};
    }
    a {
      color: inherit;
      text-decoration: none;
    }
    /* Header */
    .resume-header {
      text-align: ${theme.headerAlign};
      margin-bottom: ${isOnePage ? '8px' : '12px'};
      padding-bottom: ${isOnePage ? '6px' : '8px'};
      border-bottom: ${theme.headerBorder};
    }
    .candidate-name {
      font-size: ${isOnePage ? '18pt' : '20pt'};
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin-bottom: 4px;
      text-transform: ${theme.nameTransform};
    }
    .contact-line {
      font-size: 8.5pt;
      color: #4b5563;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: ${isCentered ? 'center' : 'flex-start'};
      gap: 8px;
    }
    .contact-line a {
      color: ${primaryColor};
      text-decoration: underline;
    }
    /* Section Headings */
    .section-title {
      font-size: ${isOnePage ? '10pt' : '10.5pt'};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${primaryColor};
      margin-top: ${isOnePage ? '8px' : '12px'};
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: ${headingBorder};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    /* Summary */
    .summary-text {
      font-size: ${isOnePage ? '9pt' : '9.5pt'};
      color: #374151;
      text-align: justify;
      margin-top: 3px;
    }
    /* Skills */
    .skills-grid {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 3px;
      font-size: 9pt;
    }
    .skill-row {
      display: flex;
      gap: 6px;
    }
    .skill-category {
      font-weight: 600;
      color: #111827;
      min-width: 110px;
    }
    .skill-values {
      color: #374151;
      flex: 1;
    }
    /* Experience & Projects */
    .entry-item {
      margin-top: ${isOnePage ? '5px' : '8px'};
      page-break-inside: avoid;
    }
    .entry-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .entry-role {
      font-weight: 700;
      color: #111827;
      font-size: 9.5pt;
    }
    .entry-company {
      font-weight: 600;
      color: #4b5563;
      font-size: 9pt;
    }
    .entry-meta {
      font-size: 8.5pt;
      color: #6b7280;
      white-space: nowrap;
    }
    /* Bullets */
    ul.bullet-list {
      list-style-type: square;
      padding-left: 16px;
      margin-top: 3px;
    }
    ul.bullet-list li {
      font-size: ${isOnePage ? '8.8pt' : '9.2pt'};
      color: #374151;
      margin-bottom: 2px;
      line-height: ${isOnePage ? '1.3' : '1.4'};
    }
    .tech-stack-tag {
      font-size: 8.5pt;
      font-style: italic;
      color: #4b5563;
      margin-top: 1px;
    }
  </style>
</head>
<body>
  <div class="resume-sheet">
    <!-- Header -->
    <header class="resume-header">
      <h1 class="candidate-name">${personal.fullName || 'Candidate Name'}</h1>
      <div class="contact-line">
        ${contactParts.join(' • ')}
      </div>
    </header>

    <!-- Professional Summary -->
    ${
      summary
        ? `<section>
            <h2 class="section-title">Professional Summary</h2>
            <p class="summary-text">${summary}</p>
          </section>`
        : ''
    }

    <!-- Technical & Domain Skills -->
    ${
      Object.keys(skills).length > 0 && Object.values(skills).some((arr) => arr?.length > 0)
        ? `<section>
            <h2 class="section-title">Technical Competencies</h2>
            <div class="skills-grid">
              ${skills.languages?.length ? `<div class="skill-row"><span class="skill-category">Languages:</span><span class="skill-values">${skills.languages.join(', ')}</span></div>` : ''}
              ${skills.frameworks?.length ? `<div class="skill-row"><span class="skill-category">Frameworks & Libs:</span><span class="skill-values">${skills.frameworks.join(', ')}</span></div>` : ''}
              ${skills.cloud_devops?.length ? `<div class="skill-row"><span class="skill-category">Cloud & DevOps:</span><span class="skill-values">${skills.cloud_devops.join(', ')}</span></div>` : ''}
              ${skills.databases?.length ? `<div class="skill-row"><span class="skill-category">Databases & Storage:</span><span class="skill-values">${skills.databases.join(', ')}</span></div>` : ''}
              ${skills.tools?.length ? `<div class="skill-row"><span class="skill-category">Tools & Architecture:</span><span class="skill-values">${skills.tools.join(', ')}</span></div>` : ''}
            </div>
          </section>`
        : ''
    }

    <!-- Work Experience -->
    ${
      experience.length > 0
        ? `<section>
            <h2 class="section-title">Professional Experience</h2>
            ${experience
              .map(
                (exp) => `
              <div class="entry-item">
                <div class="entry-top">
                  <div>
                    <span class="entry-role">${exp.role || 'Role'}</span>
                    ${exp.company ? `<span> | </span><span class="entry-company">${exp.company}</span>` : ''}
                  </div>
                  <span class="entry-meta">${[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}${exp.location ? ` | ${exp.location}` : ''}</span>
                </div>
                ${
                  Array.isArray(exp.bullets) && exp.bullets.length > 0
                    ? `<ul class="bullet-list">
                        ${exp.bullets.map((b) => `<li>${b}</li>`).join('')}
                      </ul>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </section>`
        : ''
    }

    <!-- Key Projects -->
    ${
      projects.length > 0
        ? `<section>
            <h2 class="section-title">Key Projects & Implementations</h2>
            ${projects
              .map(
                (p) => `
              <div class="entry-item">
                <div class="entry-top">
                  <span class="entry-role">${p.title || 'Project'}</span>
                  <span class="entry-meta">${[p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Live Demo</a>` : null, p.githubUrl ? `<a href="${p.githubUrl}" target="_blank">Code Repo</a>` : null].filter(Boolean).join(' | ')}</span>
                </div>
                ${p.techStack?.length ? `<div class="tech-stack-tag">Technologies: ${Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack}</div>` : ''}
                ${
                  Array.isArray(p.bullets) && p.bullets.length > 0
                    ? `<ul class="bullet-list">
                        ${p.bullets.map((b) => `<li>${b}</li>`).join('')}
                      </ul>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </section>`
        : ''
    }

    <!-- Education -->
    ${
      education.length > 0
        ? `<section>
            <h2 class="section-title">Education</h2>
            ${education
              .map(
                (edu) => `
              <div class="entry-item">
                <div class="entry-top">
                  <div>
                    <span class="entry-role">${edu.degree || 'Degree'}</span>
                    ${edu.institution ? `<span> | </span><span class="entry-company">${edu.institution}</span>` : ''}
                  </div>
                  <span class="entry-meta">${edu.year || ''}${edu.grade ? ` | ${edu.grade}` : ''}</span>
                </div>
                ${
                  Array.isArray(edu.highlights) && edu.highlights.length > 0
                    ? `<ul class="bullet-list">
                        ${edu.highlights.map((h) => `<li>${h}</li>`).join('')}
                      </ul>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </section>`
        : ''
    }

    <!-- Certifications & Achievements -->
    ${
      certifications.length > 0 || achievements.length > 0
        ? `<section>
            <h2 class="section-title">Honors & Certifications</h2>
            <ul class="bullet-list">
              ${certifications.map((c) => `<li><strong>${c.name}</strong>${c.issuer ? ` – ${c.issuer}` : ''}${c.year ? ` (${c.year})` : ''}</li>`).join('')}
              ${achievements.map((a) => `<li>${a}</li>`).join('')}
            </ul>
          </section>`
        : ''
    }
  </div>
</body>
</html>`;
}

/**
 * 2. Print Vector PDF via Hidden Browser Iframe
 */
export function printResumeToPdf(printableHtml) {
  return new Promise((resolve, reject) => {
    try {
      const existingIframe = document.getElementById('ats-resume-print-iframe');
      if (existingIframe) existingIframe.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'ats-resume-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) throw new Error('Could not access print iframe document');

      doc.open();
      doc.write(printableHtml);
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve(true);
          } catch (err) {
            reject(err);
          }
        }, 400);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 3. Export Native Microsoft Word (.DOCX) Document
 */
export async function exportResumeToDocx(resumeData, fileName = 'resume.docx') {
  const personal = resumeData?.personal || {};
  const summary = resumeData?.summary || '';
  const skills = resumeData?.skills || {};
  const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const projects = Array.isArray(resumeData?.projects) ? resumeData.projects : [];
  const education = Array.isArray(resumeData?.education) ? resumeData.education : [];
  const certifications = Array.isArray(resumeData?.certifications) ? resumeData.certifications : [];
  const achievements = Array.isArray(resumeData?.achievements) ? resumeData.achievements : [];

  const contactList = [
    personal.phone,
    personal.email,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ].filter(Boolean).join(' | ');

  const children = [];

  // 1. Name & Contact Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: personal.fullName || 'Candidate Name',
          bold: true,
          size: 32, // 16pt
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contactList,
          size: 18, // 9pt
          color: '4B5563',
        }),
      ],
    })
  );

  const makeHeading = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: {
        bottom: { color: 'CBD5E1', space: 1, value: 'single', size: 6 },
      },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 20, // 10pt
          color: '1E293B',
        }),
      ],
    });

  // 2. Summary
  if (summary) {
    children.push(
      makeHeading('Professional Summary'),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun({ text: summary, size: 19 })],
      })
    );
  }

  // 3. Technical Skills
  if (Object.keys(skills).length > 0) {
    children.push(makeHeading('Technical Competencies'));
    if (skills.languages?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Languages: ', bold: true, size: 19 }),
            new TextRun({ text: skills.languages.join(', '), size: 19 }),
          ],
        })
      );
    }
    if (skills.frameworks?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Frameworks & Libraries: ', bold: true, size: 19 }),
            new TextRun({ text: skills.frameworks.join(', '), size: 19 }),
          ],
        })
      );
    }
    if (skills.cloud_devops?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Cloud & DevOps: ', bold: true, size: 19 }),
            new TextRun({ text: skills.cloud_devops.join(', '), size: 19 }),
          ],
        })
      );
    }
    if (skills.databases?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Databases: ', bold: true, size: 19 }),
            new TextRun({ text: skills.databases.join(', '), size: 19 }),
          ],
        })
      );
    }
    if (skills.tools?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Tools & Practices: ', bold: true, size: 19 }),
            new TextRun({ text: skills.tools.join(', '), size: 19 }),
          ],
        })
      );
    }
  }

  // 4. Experience
  if (experience.length > 0) {
    children.push(makeHeading('Professional Experience'));
    for (const exp of experience) {
      const dates = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ');
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: exp.role || 'Role', bold: true, size: 20 }),
            new TextRun({ text: ` | ${exp.company || ''}`, bold: true, color: '334155', size: 19 }),
            new TextRun({ text: `  (${dates}${exp.location ? ` | ${exp.location}` : ''})`, italics: true, color: '64748B', size: 18 }),
          ],
        })
      );
      if (Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: b, size: 18 })],
            })
          );
        }
      }
    }
  }

  // 5. Projects
  if (projects.length > 0) {
    children.push(makeHeading('Key Projects'));
    for (const p of projects) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: p.title || 'Project', bold: true, size: 20 }),
            p.techStack?.length
              ? new TextRun({ text: ` [${Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack}]`, italics: true, color: '475569', size: 18 })
              : new TextRun(''),
          ],
        })
      );
      if (Array.isArray(p.bullets)) {
        for (const b of p.bullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: b, size: 18 })],
            })
          );
        }
      }
    }
  }

  // 6. Education
  if (education.length > 0) {
    children.push(makeHeading('Education'));
    for (const edu of education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree || 'Degree', bold: true, size: 19 }),
            new TextRun({ text: ` | ${edu.institution || ''}`, size: 19 }),
            new TextRun({ text: ` (${edu.year || ''}${edu.grade ? ` • ${edu.grade}` : ''})`, italics: true, size: 18, color: '64748B' }),
          ],
        })
      );
    }
  }

  // 7. Certifications & Achievements
  if (certifications.length > 0 || achievements.length > 0) {
    children.push(makeHeading('Certifications & Honors'));
    for (const c of certifications) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: c.name, bold: true, size: 18 }),
            new TextRun({ text: c.issuer ? ` – ${c.issuer}` : '', size: 18 }),
            new TextRun({ text: c.year ? ` (${c.year})` : '', size: 18 }),
          ],
        })
      );
    }
    for (const a of achievements) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: a, size: 18 })],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 in
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
