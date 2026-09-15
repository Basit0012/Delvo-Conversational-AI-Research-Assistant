import path from 'path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import mammoth from 'mammoth';
import UploadedFile from '../models/UploadedFile.js';
import FileChunk from '../models/FileChunk.js';
import { getEmbeddings } from './embeddingService.js';

/**
 * Extract clean plain text from an uploaded file buffer.
 * Gracefully throws informative user-facing errors on corrupted files or empty/scanned PDFs.
 * 
 * @param {Buffer} buffer - File buffer from Multer
 * @param {string} fileName - Original filename
 * @param {string} [mimeType] - Mime type from request
 * @returns {Promise<string>}
 */
export const extractTextFromFile = async (buffer, fileName, mimeType = '') => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty (0 bytes).');
  }

  const ext = path.extname(fileName || '').toLowerCase();
  let extractedText = '';

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      extractedText = result?.text || '';
    } catch (pdfErr) {
      console.error(`[PDF Extraction Error] ${fileName}:`, pdfErr);
      throw new Error(`Failed to parse PDF "${fileName}". The file may be password-protected or corrupted.`);
    }

    if (!extractedText || !extractedText.trim()) {
      throw new Error(
        `No extractable text found in "${fileName}". Scanned, image-only, or encrypted PDFs cannot be read without OCR.`
      );
    }
  } else if (
    ext === '.docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const mammothModule = await import('mammoth');
      const mammothFn = mammothModule.default?.extractRawText || mammothModule.extractRawText;
      const result = await mammothFn({ buffer });
      extractedText = result?.value || '';
    } catch (docxErr) {
      console.error(`[DOCX Extraction Error] ${fileName}:`, docxErr);
      throw new Error(`Failed to read Word document "${fileName}". The file appears to be corrupted.`);
    }

    if (!extractedText || !extractedText.trim()) {
      throw new Error(`No extractable text found in Word document "${fileName}".`);
    }
  } else if (
    ext === '.txt' ||
    ext === '.md' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/octet-stream'
  ) {
    try {
      extractedText = buffer.toString('utf-8');
    } catch (txtErr) {
      throw new Error(`Failed to decode text file "${fileName}". Ensure it is UTF-8 encoded.`);
    }

    if (!extractedText || !extractedText.trim()) {
      throw new Error(`Text file "${fileName}" is empty or contains no readable characters.`);
    }
  } else {
    throw new Error(`Unsupported file format "${ext}". Supported types are .pdf, .docx, .txt, .md.`);
  }

  return extractedText.trim();
};

/**
 * Split extracted document text into semantic chunks using LangChain text splitter.
 * @param {string} text - Extracted document text
 * @param {Object} [options]
 * @returns {Promise<string[]>}
 */
export const chunkDocumentText = async (text, options = {}) => {
  const chunkSize = options.chunkSize || 1200; // ~500-800 tokens
  const chunkOverlap = options.chunkOverlap || 200;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc) => doc.pageContent.trim()).filter(Boolean);
};

/**
 * High-level pipeline:
 * 1. Extract text
 * 2. Chunk text
 * 3. Generate embeddings
 * 4. Store FileChunk docs
 * 5. Update UploadedFile status
 * 
 * @param {Object} params
 * @param {UploadedFile} params.fileRecord
 * @param {Buffer} params.buffer
 * @returns {Promise<{ chunkCount: number, status: string }>}
 */
export const processAndIndexFile = async ({ fileRecord, buffer }) => {
  try {
    // 1. Extract text
    const text = await extractTextFromFile(buffer, fileRecord.fileName, fileRecord.mimeType);

    // 2. Chunk text
    const chunks = await chunkDocumentText(text);
    if (chunks.length === 0) {
      throw new Error('Document produced no text chunks after splitting.');
    }

    // 3. Generate embeddings in batches of 16 to respect rate limits
    const BATCH_SIZE = 16;
    const allEmbeddings = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchVectors = await getEmbeddings(batch);
      allEmbeddings.push(...batchVectors);
    }

    // 4. Prepare FileChunk documents for bulk insert
    const chunkDocs = chunks.map((chunkText, index) => ({
      fileId: fileRecord._id,
      chatId: fileRecord.chatId,
      text: chunkText,
      embedding: allEmbeddings[index],
      chunkIndex: index,
      metadata: {
        fileName: fileRecord.fileName,
      },
    }));

    await FileChunk.insertMany(chunkDocs);

    // 5. Update file status to ready
    fileRecord.status = 'ready';
    fileRecord.chunkCount = chunkDocs.length;
    fileRecord.errorMessage = null;
    await fileRecord.save();

    console.log(
      `[RAG File Processor]: Successfully indexed "${fileRecord.fileName}" into ${chunkDocs.length} chunks for chat ${fileRecord.chatId}`
    );

    return {
      chunkCount: chunkDocs.length,
      status: 'ready',
    };
  } catch (error) {
    console.error(`[RAG File Processor Error] ${fileRecord.fileName}:`, error.message);
    fileRecord.status = 'failed';
    fileRecord.errorMessage = error.message;
    await fileRecord.save();
    throw error;
  }
};

export default {
  extractTextFromFile,
  chunkDocumentText,
  processAndIndexFile,
};
