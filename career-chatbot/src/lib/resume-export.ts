import type { ResumeData } from '@/hooks/use-chat-stream';

export async function generateResumePDF(data: ResumeData): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const marginX = 18;
  const maxW = pageW - marginX * 2;
  let y = 22;

  const checkPageBreak = (needed = 10) => {
    if (y + needed > pageH - 15) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionHeader = (title: string) => {
    checkPageBreak(14);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 82, 118);
    doc.text(title.toUpperCase(), marginX, y);
    y += 2;
    doc.setDrawColor(26, 82, 118);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageW - marginX, y);
    y += 5;
    doc.setTextColor(40, 40, 40);
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(26, 82, 118);
  doc.text(data.personalInfo?.name || 'Resume', pageW / 2, y, { align: 'center' });
  y += 7;

  const contactParts = [
    data.personalInfo?.email,
    data.personalInfo?.phone,
    data.personalInfo?.location,
    data.personalInfo?.linkedin,
    data.personalInfo?.github,
  ].filter(Boolean).join('  |  ');

  if (contactParts) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    const contactLines = doc.splitTextToSize(contactParts, maxW);
    doc.text(contactLines, pageW / 2, y, { align: 'center' });
    y += contactLines.length * 4.5;
  }

  y += 2;
  doc.setDrawColor(26, 82, 118);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  if (data.summary) {
    sectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 55, 55);
    const lines = doc.splitTextToSize(data.summary, maxW);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, marginX, y);
    y += lines.length * 5 + 2;
  }

  if (data.education?.length > 0) {
    sectionHeader('Education');
    for (const edu of data.education) {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`${edu.degree} in ${edu.field}`, marginX, y);
      const dateStr = `${edu.startYear} – ${edu.endYear}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(dateStr, pageW - marginX, y, { align: 'right' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(65, 65, 65);
      const subtitle = [edu.institution, edu.grade].filter(Boolean).join('  ·  ');
      doc.text(subtitle, marginX, y);
      y += 6;
    }
  }

  if (data.experience?.length > 0) {
    sectionHeader('Work Experience');
    for (const exp of data.experience) {
      checkPageBreak(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(exp.role, marginX, y);
      const dates = `${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(dates, pageW - marginX, y, { align: 'right' });
      y += 5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(75, 75, 75);
      doc.text(exp.company, marginX, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      const descLines = exp.description.split('\n').filter(Boolean);
      for (const line of descLines) {
        const cleaned = `• ${line.replace(/^[-•*]\s*/, '')}`;
        const wrapped = doc.splitTextToSize(cleaned, maxW - 4);
        checkPageBreak(wrapped.length * 4.5 + 2);
        doc.text(wrapped, marginX + 2, y);
        y += wrapped.length * 4.5 + 1;
      }
      y += 2;
    }
  }

  if (data.skills && (data.skills.technical?.length > 0 || data.skills.soft?.length > 0)) {
    sectionHeader('Skills');
    doc.setFontSize(10);

    if (data.skills.technical?.length > 0) {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Technical:', marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const techLines = doc.splitTextToSize(data.skills.technical.join(', '), maxW - 24);
      doc.text(techLines, marginX + 24, y);
      y += Math.max(techLines.length * 5, 5) + 2;
    }

    if (data.skills.soft?.length > 0) {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Soft Skills:', marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const softLines = doc.splitTextToSize(data.skills.soft.join(', '), maxW - 24);
      doc.text(softLines, marginX + 24, y);
      y += Math.max(softLines.length * 5, 5) + 2;
    }
  }

  if (data.projects?.length > 0) {
    sectionHeader('Projects');
    for (const proj of data.projects) {
      checkPageBreak(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const titleLines = doc.splitTextToSize(proj.name, maxW);
      doc.text(titleLines, marginX, y);
      y += titleLines.length * 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(proj.description, maxW);
      checkPageBreak(descLines.length * 4.5 + 4);
      doc.text(descLines, marginX, y);
      y += descLines.length * 4.5 + 1;

      if (proj.link) {
        doc.setTextColor(26, 82, 118);
        doc.text(proj.link, marginX, y);
        y += 4.5;
      }

      if (proj.technologies?.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(`Tech: ${proj.technologies.join(', ')}`, marginX, y);
        y += 5;
      }
      y += 2;
    }
  }

  if (data.certifications?.length > 0) {
    sectionHeader('Certifications');
    for (const cert of data.certifications) {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(cert.name, marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(`${cert.issuer}  ·  ${cert.year}`, pageW - marginX, y, { align: 'right' });
      y += 6;
    }
  }

  if (data.achievements?.length > 0) {
    sectionHeader('Achievements');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    for (const ach of data.achievements) {
      const lines = doc.splitTextToSize(`• ${ach}`, maxW - 2);
      checkPageBreak(lines.length * 5 + 2);
      doc.text(lines, marginX, y);
      y += lines.length * 5 + 1;
    }
  }

  const filename = `${(data.personalInfo?.name || 'resume').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

export async function generateResumeDocx(data: ResumeData): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, BorderStyle } = await import('docx');
  const { saveAs } = await import('file-saver');

  const sectionLine = (label: string) =>
    new Paragraph({
      children: [new TextRun({ text: label.toUpperCase(), bold: true, size: 24, color: '1a5276' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a5276' } },
      spacing: { before: 240, after: 80 },
    });

  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: data.personalInfo?.name || 'Resume', bold: true, size: 36 })],
      alignment: 'center' as const,
      spacing: { after: 80 },
    })
  );

  const contactParts = [
    data.personalInfo?.email,
    data.personalInfo?.phone,
    data.personalInfo?.location,
    data.personalInfo?.linkedin,
    data.personalInfo?.github,
  ].filter(Boolean).join('  |  ');

  if (contactParts) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts, size: 18, color: '555555' })],
        alignment: 'center' as const,
        spacing: { after: 160 },
      })
    );
  }

  if (data.summary) {
    children.push(sectionLine('Professional Summary'));
    children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 20 })], spacing: { after: 80 } }));
  }

  if (data.education?.length > 0) {
    children.push(sectionLine('Education'));
    for (const edu of data.education) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${edu.degree} in ${edu.field}`, bold: true, size: 20 }),
          new TextRun({ text: `  |  ${edu.institution}`, size: 20, color: '333333' }),
        ],
        spacing: { after: 40 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${edu.startYear} – ${edu.endYear}${edu.grade ? `  |  ${edu.grade}` : ''}`, size: 18, color: '777777' })],
        spacing: { after: 80 },
      }));
    }
  }

  if (data.experience?.length > 0) {
    children.push(sectionLine('Work Experience'));
    for (const exp of data.experience) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.role, bold: true, size: 20 }),
          new TextRun({ text: `  –  ${exp.company}`, size: 20, color: '333333' }),
        ],
        spacing: { after: 40 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}`, size: 18, color: '777777' })],
        spacing: { after: 60 },
      }));
      for (const line of exp.description.split('\n').filter(Boolean)) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `• ${line.replace(/^[-•*]\s*/, '')}`, size: 19 })],
          spacing: { after: 40 },
        }));
      }
    }
  }

  if (data.skills) {
    children.push(sectionLine('Skills'));
    if (data.skills.technical?.length) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Technical: ', bold: true, size: 20 }),
          new TextRun({ text: data.skills.technical.join(', '), size: 20 }),
        ],
        spacing: { after: 60 },
      }));
    }
    if (data.skills.soft?.length) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Soft Skills: ', bold: true, size: 20 }),
          new TextRun({ text: data.skills.soft.join(', '), size: 20 }),
        ],
        spacing: { after: 60 },
      }));
    }
  }

  if (data.projects?.length > 0) {
    children.push(sectionLine('Projects'));
    for (const proj of data.projects) {
      children.push(new Paragraph({ children: [new TextRun({ text: proj.name, bold: true, size: 20 })], spacing: { after: 40 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: proj.description, size: 19 })], spacing: { after: 40 } }));
      if (proj.technologies?.length) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: 'Tech: ', bold: true, size: 18 }),
            new TextRun({ text: proj.technologies.join(', '), size: 18, color: '555555' }),
          ],
          spacing: { after: 80 },
        }));
      }
    }
  }

  if (data.certifications?.length) {
    children.push(sectionLine('Certifications'));
    for (const cert of data.certifications) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20 }),
          new TextRun({ text: `  |  ${cert.issuer}  |  ${cert.year}`, size: 19, color: '555555' }),
        ],
        spacing: { after: 60 },
      }));
    }
  }

  if (data.achievements?.length) {
    children.push(sectionLine('Achievements'));
    for (const ach of data.achievements) {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${ach}`, size: 19 })], spacing: { after: 40 } }));
    }
  }

  const docFile = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(docFile);
  saveAs(blob, `${data.personalInfo?.name || 'resume'}.docx`);
}
