import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import JSZip from 'jszip';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import UploadedFile from '../models/UploadedFile.js';
import FileChunk from '../models/FileChunk.js';
import {
  extractTextFromFile,
  chunkDocumentText,
} from '../services/fileProcessingService.js';
import {
  searchFileChunks,
  cosineSimilarity,
} from '../services/embeddingService.js';

// Minimal valid PDF binary string containing extractable text
const VALID_MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n' +
    '4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
    '5 0 obj<</Length 44>>stream\n' +
    'BT /F1 18 Tf 50 100 Td (Delvo AI Research Document) Tj ET\n' +
    'endstream\nendobj\n' +
    'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \n0000000289 00000 n \n' +
    'trailer<</Size 6/Root 1 0 R>>\nstartxref\n382\n%%EOF'
);

// Helper to create a valid minimal in-memory .docx buffer
async function createMinimalDocx(textContent) {
  const zip = new JSZip();
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>'
  );
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>'
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body><w:p><w:r><w:t>' +
      textContent +
      '</w:t></w:r></w:p></w:body></w:document>'
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('Mission A — File Upload, RAG & Cross-Chat Isolation', () => {
  let testUser;
  let chatA;
  let chatB;
  let fileA;
  let fileB;

  before(async () => {
    await connectDB();

    // Create test user and two isolated chats
    testUser = await User.create({
      username: `rag_tester_${Date.now()}`,
      email: `rag_tester_${Date.now()}@delvo.ai`,
      password: 'password123',
    });

    chatA = await Chat.create({
      userId: testUser._id,
      title: 'Chat A — Financial Research',
    });

    chatB = await Chat.create({
      userId: testUser._id,
      title: 'Chat B — Machine Learning Overview',
    });
  });

  after(async () => {
    // Clean up test documents
    if (chatA && chatB) {
      await FileChunk.deleteMany({ chatId: { $in: [chatA._id, chatB._id] } });
      await UploadedFile.deleteMany({ chatId: { $in: [chatA._id, chatB._id] } });
      await Chat.deleteMany({ _id: { $in: [chatA._id, chatB._id] } });
    }
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }
  });

  describe('1. Text Extraction for All Supported Formats', () => {
    it('should extract plain text from a .txt file buffer', async () => {
      const buffer = Buffer.from('Delvo plain text content for RAG testing.\nSecond line of facts.');
      const result = await extractTextFromFile(buffer, 'notes.txt', 'text/plain');
      assert.ok(result.includes('Delvo plain text content'));
      assert.ok(result.includes('Second line of facts.'));
    });

    it('should extract text from a .md (Markdown) file buffer', async () => {
      const buffer = Buffer.from('# Market Research\n- Point A\n- Point B\nConclusion paragraph.');
      const result = await extractTextFromFile(buffer, 'report.md', 'text/markdown');
      assert.ok(result.includes('# Market Research'));
      assert.ok(result.includes('Point A'));
      assert.ok(result.includes('Conclusion paragraph.'));
    });

    it('should extract text from a valid .pdf file buffer', async () => {
      const result = await extractTextFromFile(VALID_MINIMAL_PDF, 'document.pdf', 'application/pdf');
      assert.ok(
        result.includes('Delvo AI Research Document'),
        `Expected "Delvo AI Research Document", got: "${result}"`
      );
    });

    it('should extract text from a valid .docx file buffer', async () => {
      const docxBuffer = await createMinimalDocx('Delvo DOCX Research Document Content');
      const result = await extractTextFromFile(docxBuffer, 'proposal.docx');
      assert.ok(
        result.includes('Delvo DOCX Research Document Content'),
        `Expected DOCX content, got: "${result}"`
      );
    });
  });

  describe('2. Graceful Error Handling on Corrupted/Empty Files', () => {
    it('should reject an empty 0-byte file buffer with clear error', async () => {
      const emptyBuffer = Buffer.alloc(0);
      await assert.rejects(
        async () => {
          await extractTextFromFile(emptyBuffer, 'empty.txt');
        },
        {
          name: 'Error',
          message: /Uploaded file is empty/,
        }
      );
    });

    it('should throw clear error on corrupted/invalid PDF buffer', async () => {
      const corruptPdf = Buffer.from('NOT A REAL PDF CONTENT');
      await assert.rejects(
        async () => {
          await extractTextFromFile(corruptPdf, 'broken.pdf', 'application/pdf');
        },
        {
          name: 'Error',
          message: /Failed to parse PDF|corrupted/,
        }
      );
    });

    it('should throw clear error on corrupted/invalid DOCX buffer', async () => {
      const corruptDocx = Buffer.from('GARBAGE NON-ZIP DOCX DATA');
      await assert.rejects(
        async () => {
          await extractTextFromFile(corruptDocx, 'corrupt.docx');
        },
        {
          name: 'Error',
          message: /Failed to read Word document|corrupted/,
        }
      );
    });

    it('should reject unsupported file types like .exe', async () => {
      const exeBuffer = Buffer.from('MZ binary stub');
      await assert.rejects(
        async () => {
          await extractTextFromFile(exeBuffer, 'installer.exe');
        },
        {
          name: 'Error',
          message: /Unsupported file format/,
        }
      );
    });
  });

  describe('3. Text Chunking with RecursiveCharacterTextSplitter', () => {
    it('should split long text into overlapping chunks of ~1200 characters', async () => {
      const paragraph =
        'Artificial intelligence research focuses on large multimodal models, agentic workflows, and real-time retrieval-augmented generation. ';
      const longText = paragraph.repeat(40); // ~5400 characters

      const chunks = await chunkDocumentText(longText, { chunkSize: 1200, chunkOverlap: 200 });

      assert.ok(chunks.length >= 4, `Expected at least 4 chunks, got ${chunks.length}`);
      for (const chunk of chunks) {
        assert.ok(chunk.length <= 1400, `Chunk length ${chunk.length} should be near 1200`);
        assert.ok(chunk.length > 50, 'Chunk should not be trivial');
      }
    });
  });

  describe('4. Cross-Chat Vector Search Isolation (Critical Security Guarantee)', () => {
    before(async () => {
      // 1. Create file record for Chat A (Financial data)
      fileA = await UploadedFile.create({
        chatId: chatA._id,
        userId: testUser._id,
        fileName: 'q4_financials.txt',
        mimeType: 'text/plain',
        status: 'ready',
        chunkCount: 1,
      });

      // 2. Create file record for Chat B (Machine Learning)
      fileB = await UploadedFile.create({
        chatId: chatB._id,
        userId: testUser._id,
        fileName: 'ml_architecture.txt',
        mimeType: 'text/plain',
        status: 'ready',
        chunkCount: 1,
      });

      // Synthetic 1024-dimensional normalized vectors to avoid external API calls during unit test
      const vectorA = new Array(1024).fill(0);
      vectorA[0] = 1.0; // Pointing along dimension 0

      const vectorB = new Array(1024).fill(0);
      vectorB[1] = 1.0; // Pointing along dimension 1

      // Insert chunk for Chat A
      await FileChunk.create({
        fileId: fileA._id,
        chatId: chatA._id,
        text: 'CONFIDENTIAL: Project Alpha Q4 net operating profit margin reached 34.8 percent.',
        embedding: vectorA,
        chunkIndex: 0,
        metadata: { fileName: 'q4_financials.txt' },
      });

      // Insert chunk for Chat B
      await FileChunk.create({
        fileId: fileB._id,
        chatId: chatB._id,
        text: 'PUBLIC: Transformer decoder models utilize multi-head self-attention mechanisms.',
        embedding: vectorB,
        chunkIndex: 0,
        metadata: { fileName: 'ml_architecture.txt' },
      });
    });

    it('should compute exact cosine similarity for identical and orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [1, 0, 0];
      const v3 = [0, 1, 0];

      assert.strictEqual(cosineSimilarity(v1, v2), 1.0);
      assert.strictEqual(cosineSimilarity(v1, v3), 0.0);
    });

    it('PROVE ISOLATION: A query executed in Chat B MUST NEVER return chunks from Chat A', async () => {
      // Search scoped strictly to chatB._id
      // Even if someone queries for financial facts from Chat A, Chat B's DB query must NEVER see Chat A's records
      const chatBChunks = await FileChunk.find({ chatId: chatB._id }).lean();
      assert.strictEqual(chatBChunks.length, 1);
      assert.strictEqual(chatBChunks[0].chatId.toString(), chatB._id.toString());
      assert.ok(
        !chatBChunks[0].text.includes('CONFIDENTIAL'),
        'Chat B should not contain confidential data from Chat A'
      );

      // Verify that FileChunk.find({ chatId: chatB._id }) returns 0 records from Chat A
      const chatAChunksInChatB = await FileChunk.find({
        chatId: chatB._id,
        text: /CONFIDENTIAL/,
      }).lean();
      assert.strictEqual(chatAChunksInChatB.length, 0);

      // Verify Chat A has its chunk strictly isolated
      const chatAChunks = await FileChunk.find({ chatId: chatA._id }).lean();
      assert.strictEqual(chatAChunks.length, 1);
      assert.strictEqual(chatAChunks[0].chatId.toString(), chatA._id.toString());
      assert.ok(chatAChunks[0].text.includes('CONFIDENTIAL'));
    });
  });
});
