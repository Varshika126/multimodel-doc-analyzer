const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Document = require('../models/Document');
const Analysis = require('../models/Analysis');
const Report = require('../models/Report');

const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// @desc    Generate PDF report
// @route   POST /api/reports/pdf/:documentId
exports.generatePDFReport = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    const analysis = await Analysis.findOne({ document: doc._id });
    if (!analysis) return res.status(404).json({ success: false, error: 'Analysis not found' });

    const fileName = `report-${doc._id}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const pdfDoc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    pdfDoc.pipe(writeStream);

    // Header
    pdfDoc.fontSize(24).fillColor('#6366f1').text('Document Analysis Report', { align: 'center' });
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(12).fillColor('#64748b').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    pdfDoc.moveDown(1);

    // Document Info
    pdfDoc.fontSize(16).fillColor('#1e293b').text('Document Information');
    pdfDoc.moveTo(50, pdfDoc.y).lineTo(550, pdfDoc.y).stroke('#e2e8f0');
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(11).fillColor('#334155');
    pdfDoc.text(`File Name: ${doc.originalName}`);
    pdfDoc.text(`File Type: ${doc.fileType.toUpperCase()}`);
    pdfDoc.text(`File Size: ${(doc.fileSize / 1024).toFixed(2)} KB`);
    pdfDoc.text(`Upload Date: ${doc.createdAt.toLocaleDateString()}`);
    pdfDoc.text(`Category: ${analysis.category}`);
    pdfDoc.moveDown(1);

    // Statistics
    pdfDoc.fontSize(16).fillColor('#1e293b').text('Text Statistics');
    pdfDoc.moveTo(50, pdfDoc.y).lineTo(550, pdfDoc.y).stroke('#e2e8f0');
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(11).fillColor('#334155');
    const stats = analysis.statistics || {};
    pdfDoc.text(`Word Count: ${stats.wordCount || 0}`);
    pdfDoc.text(`Character Count: ${stats.charCount || 0}`);
    pdfDoc.text(`Sentence Count: ${stats.sentenceCount || 0}`);
    pdfDoc.text(`Paragraph Count: ${stats.paragraphCount || 0}`);
    pdfDoc.text(`Reading Time: ${stats.readingTime || 0} minutes`);
    pdfDoc.text(`Unique Words: ${stats.uniqueWords || 0}`);
    pdfDoc.moveDown(1);

    // Summary
    pdfDoc.fontSize(16).fillColor('#1e293b').text('AI Summary');
    pdfDoc.moveTo(50, pdfDoc.y).lineTo(550, pdfDoc.y).stroke('#e2e8f0');
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(11).fillColor('#334155').text(analysis.summary || 'No summary available.', { align: 'justify' });
    pdfDoc.moveDown(1);

    // Sentiment
    pdfDoc.fontSize(16).fillColor('#1e293b').text('Sentiment Analysis');
    pdfDoc.moveTo(50, pdfDoc.y).lineTo(550, pdfDoc.y).stroke('#e2e8f0');
    pdfDoc.moveDown(0.5);
    const sentiment = analysis.sentiment || {};
    pdfDoc.fontSize(11).fillColor('#334155');
    pdfDoc.text(`Overall Sentiment: ${(sentiment.label || 'neutral').toUpperCase()}`);
    pdfDoc.text(`Positive: ${sentiment.positive || 0}%`);
    pdfDoc.text(`Negative: ${sentiment.negative || 0}%`);
    pdfDoc.text(`Neutral: ${sentiment.neutral || 0}%`);
    pdfDoc.moveDown(1);

    // Keywords
    pdfDoc.fontSize(16).fillColor('#1e293b').text('Top Keywords');
    pdfDoc.moveTo(50, pdfDoc.y).lineTo(550, pdfDoc.y).stroke('#e2e8f0');
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(11).fillColor('#334155');
    const keywords = (analysis.keywords || []).slice(0, 15);
    keywords.forEach((kw, i) => {
      pdfDoc.text(`${i + 1}. ${kw.word} (frequency: ${kw.frequency})`);
    });
    pdfDoc.moveDown(1);

    // Entities
    if (analysis.entities && analysis.entities.length > 0) {
      pdfDoc.fontSize(16).fillColor('#1e293b').text('Named Entities');
      pdfDoc.moveTo(50, pdfDoc.y).lineTo(550, pdfDoc.y).stroke('#e2e8f0');
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(11).fillColor('#334155');
      analysis.entities.slice(0, 10).forEach(entity => {
        pdfDoc.text(`${entity.text} (${entity.type}) - mentioned ${entity.count} time(s)`);
      });
    }

    pdfDoc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const stats2 = fs.statSync(filePath);
    await Report.create({
      document: doc._id,
      user: req.user.id,
      analysis: analysis._id,
      reportType: 'pdf',
      fileName,
      filePath,
      fileSize: stats2.size
    });

    res.download(filePath, `analysis-${doc.originalName}.pdf`, (err) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate TXT report
// @route   POST /api/reports/txt/:documentId
exports.generateTXTReport = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    const analysis = await Analysis.findOne({ document: doc._id });
    if (!analysis) return res.status(404).json({ success: false, error: 'Analysis not found' });

    const stats = analysis.statistics || {};
    const sentiment = analysis.sentiment || {};
    const keywords = (analysis.keywords || []).slice(0, 15);

    let content = `DOCUMENT ANALYSIS REPORT\n`;
    content += `${'='.repeat(50)}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    content += `DOCUMENT INFORMATION\n${'-'.repeat(30)}\n`;
    content += `File Name: ${doc.originalName}\nFile Type: ${doc.fileType.toUpperCase()}\n`;
    content += `File Size: ${(doc.fileSize / 1024).toFixed(2)} KB\nCategory: ${analysis.category}\n\n`;
    content += `TEXT STATISTICS\n${'-'.repeat(30)}\n`;
    content += `Word Count: ${stats.wordCount || 0}\nCharacter Count: ${stats.charCount || 0}\n`;
    content += `Sentence Count: ${stats.sentenceCount || 0}\nReading Time: ${stats.readingTime || 0} min\n\n`;
    content += `AI SUMMARY\n${'-'.repeat(30)}\n${analysis.summary || 'N/A'}\n\n`;
    content += `SENTIMENT\n${'-'.repeat(30)}\n`;
    content += `Label: ${(sentiment.label || 'neutral').toUpperCase()}\n`;
    content += `Positive: ${sentiment.positive || 0}% | Negative: ${sentiment.negative || 0}% | Neutral: ${sentiment.neutral || 0}%\n\n`;
    content += `TOP KEYWORDS\n${'-'.repeat(30)}\n`;
    keywords.forEach((kw, i) => { content += `${i + 1}. ${kw.word} (${kw.frequency})\n`; });

    const fileName = `report-${doc._id}-${Date.now()}.txt`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, content, 'utf8');

    await Report.create({
      document: doc._id,
      user: req.user.id,
      analysis: analysis._id,
      reportType: 'txt',
      fileName,
      filePath,
      fileSize: Buffer.byteLength(content)
    });

    res.download(filePath, `analysis-${doc.originalName}.txt`, (err) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
};
