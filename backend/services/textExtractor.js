const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * Extract text from a PDF file
 */
const extractFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return { text: data.text || '', pages: data.numpages, info: data.info };
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    // Try OCR as fallback
    return { text: '', pages: 0, info: {} };
  }
};

/**
 * Extract text from a DOCX file
 */
const extractFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: result.value || '', messages: result.messages };
  } catch (error) {
    console.error('DOCX extraction error:', error.message);
    return { text: '' };
  }
};

/**
 * Extract text from a TXT file
 */
const extractFromTXT = (filePath) => {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return { text };
  } catch (error) {
    console.error('TXT extraction error:', error.message);
    return { text: '' };
  }
};

/**
 * Preprocess image for better OCR results
 */
const preprocessImage = async (filePath) => {
  try {
    const processedPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '_processed.png');
    await sharp(filePath)
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toFile(processedPath);
    return processedPath;
  } catch (error) {
    console.error('Image preprocessing error:', error.message);
    return filePath;
  }
};

/**
 * Extract text from an image using Tesseract OCR
 */
const extractFromImage = async (filePath, language = 'eng') => {
  let processedPath = filePath;
  try {
    processedPath = await preprocessImage(filePath);
    const result = await Tesseract.recognize(processedPath, language, {
      logger: () => {}
    });
    const text = result.data.text || '';
    const confidence = result.data.confidence || 0;

    // Cleanup processed file
    if (processedPath !== filePath && fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
    }

    return { text, confidence, language };
  } catch (error) {
    console.error('OCR extraction error:', error.message);
    if (processedPath !== filePath && fs.existsSync(processedPath)) {
      try { fs.unlinkSync(processedPath); } catch (e) {}
    }
    return { text: '', confidence: 0, language };
  }
};

/**
 * Main extraction function - routes to appropriate extractor
 */
const extractText = async (filePath, fileType, language = 'eng') => {
  const startTime = Date.now();
  let result = { text: '', metadata: {} };

  try {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        const pdfResult = await extractFromPDF(filePath);
        result.text = pdfResult.text;
        result.metadata = { pages: pdfResult.pages, info: pdfResult.info };
        // If PDF has no text (scanned), try OCR
        if (!result.text.trim()) {
          console.log('PDF appears to be scanned, attempting OCR...');
          const ocrResult = await extractFromImage(filePath, language);
          result.text = ocrResult.text;
          result.metadata.ocrUsed = true;
          result.metadata.confidence = ocrResult.confidence;
        }
        break;

      case 'docx':
        const docxResult = await extractFromDOCX(filePath);
        result.text = docxResult.text;
        break;

      case 'txt':
        const txtResult = extractFromTXT(filePath);
        result.text = txtResult.text;
        break;

      case 'png':
      case 'jpg':
      case 'jpeg':
        const imgResult = await extractFromImage(filePath, language);
        result.text = imgResult.text;
        result.metadata = { confidence: imgResult.confidence, ocrUsed: true };
        break;

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error.message);
    result.error = error.message;
  }

  result.processingTime = Date.now() - startTime;
  result.text = cleanText(result.text);
  return result;
};

/**
 * Clean extracted text
 */
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

module.exports = { extractText, extractFromPDF, extractFromDOCX, extractFromTXT, extractFromImage };
