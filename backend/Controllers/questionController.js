import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Question from '../Model/Question.js';
import StudentCourse from '../Model/studentCourse.js';

function normalizeForHash(value) {
  if (!value && value !== 0) return '';
  const str = String(value)
    .trim()
    .replace(/\s+/g, ' ') // collapse spaces
    .toLowerCase();
  return str;
}

function buildDedupeHash({ courseId, text, optionA, optionB, optionC, optionD, correctAnswer }) {
  const base = [
    String(courseId),
    normalizeForHash(text),
    normalizeForHash(optionA),
    normalizeForHash(optionB),
    normalizeForHash(optionC),
    normalizeForHash(optionD),
    normalizeForHash(correctAnswer)
  ].join('|');
  return crypto.createHash('sha256').update(base).digest('hex');
}

function getCellString(cell) {
  const val = cell?.value;
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val && typeof val.text === 'string') return val.text;
  if (val?.richText && Array.isArray(val.richText)) {
    return val.richText.map(rt => rt.text).join('');
  }
  return String(val);
}

export const downloadTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');
    sheet.columns = [
      { header: 'QuestionText', key: 'QuestionText', width: 80 },
      { header: 'OptionA', key: 'OptionA', width: 40 },
      { header: 'OptionB', key: 'OptionB', width: 40 },
      { header: 'OptionC', key: 'OptionC', width: 40 },
      { header: 'OptionD', key: 'OptionD', width: 40 },
      { header: 'CorrectAnswer', key: 'CorrectAnswer', width: 15 }
    ];
    sheet.addRow({
      QuestionText: 'What is 2 + 2?',
      OptionA: '3',
      OptionB: '4',
      OptionC: '5',
      OptionD: '6',
      CorrectAnswer: 'B'
    });
    sheet.addRow({
      QuestionText: 'HTML stands for?',
      OptionA: 'Hyper Trainer Marking Language',
      OptionB: 'Hyper Text Markup Language',
      OptionC: 'Hyper Text Marketing Language',
      OptionD: 'None',
      CorrectAnswer: 'B'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="question_template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

export const importQuestions = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid courseId' });
    }
    const course = await StudentCourse.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Excel file is required' });
    }

    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(req.file.mimetype)) {
      return res.status(400).json({ status: 'error', message: 'Only .xlsx files are allowed' });
    }

    // Parse Excel from buffer
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return res.status(400).json({ status: 'error', message: 'Excel has no sheets' });
    }

    const header = (sheet.getRow(1).values || []).map(v => {
      if (typeof v === 'string') return v.trim();
      if (v && typeof v.text === 'string') return v.text.trim();
      return v;
    });
    const canonical = (s) => String(s || '').trim().toLowerCase();
    const headerStrings = header.filter(Boolean).map(canonical);
    // Support two formats: with or without an initial ID column
    const acceptedSets = [
      ['questiontext', 'optiona', 'optionb', 'optionc', 'optiond', 'correctanswer'],
      ['id', 'questiontext', 'optiona', 'optionb', 'optionc', 'optiond', 'correctanswer']
    ];
    const matchesAny = acceptedSets.some(set => set.every(h => headerStrings.includes(h)));
    if (!matchesAny) {
      return res.status(400).json({ status: 'error', message: 'Invalid headers. Expected headers: QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer (optional leading ID column allowed).' });
    }

    // Build column index map by header name (1-based indices)
    const nameToIndex = new Map();
    const row1 = sheet.getRow(1);
    row1.eachCell((cell, colNumber) => {
      const key = canonical(getCellString(cell));
      if (key) nameToIndex.set(key, colNumber);
    });
    const idx = {
      q: nameToIndex.get('questiontext') || 1,
      a: nameToIndex.get('optiona') || 2,
      b: nameToIndex.get('optionb') || 3,
      c: nameToIndex.get('optionc') || 4,
      d: nameToIndex.get('optiond') || 5,
      ans: nameToIndex.get('correctanswer') || 6,
    };

    const maxRows = 5000;
    const errors = [];
    let totalRows = 0;

    const pendingDocs = [];
    const fileSeenHashes = new Set();

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      if (!row || row.cellCount === 0) continue;
      const QuestionText = getCellString(row.getCell(idx.q));
      const OptionA = getCellString(row.getCell(idx.a));
      const OptionB = getCellString(row.getCell(idx.b));
      const OptionC = getCellString(row.getCell(idx.c));
      const OptionD = getCellString(row.getCell(idx.d));
      const CorrectAnswer = getCellString(row.getCell(idx.ans)).toUpperCase();

      if (!QuestionText && !OptionA && !OptionB && !OptionC && !OptionD && !CorrectAnswer) {
        continue; // skip empty rows
      }

      totalRows++;
      if (totalRows > maxRows) {
        errors.push({ rowNumber: i, message: `Row limit exceeded (${maxRows})` });
        break;
      }

      // Validation
      const qText = QuestionText.trim();
      const a = OptionA.trim();
      const b = OptionB.trim();
      const c = OptionC ? OptionC.trim() : '';
      const d = OptionD ? OptionD.trim() : '';
      const ans = CorrectAnswer.trim();

      if (!qText) {
        errors.push({ rowNumber: i, message: 'QuestionText is required' });
        continue;
      }
      if (!a || !b) {
        errors.push({ rowNumber: i, message: 'OptionA and OptionB are required' });
        continue;
      }
      if (!['A', 'B', 'C', 'D'].includes(ans)) {
        errors.push({ rowNumber: i, message: 'CorrectAnswer must be A, B, C, or D' });
        continue;
      }
      if ((ans === 'C' && !c) || (ans === 'D' && !d)) {
        errors.push({ rowNumber: i, message: `Option${ans} is required when CorrectAnswer=${ans}` });
        continue;
      }

      const dedupeHash = buildDedupeHash({ courseId, text: qText, optionA: a, optionB: b, optionC: c, optionD: d, correctAnswer: ans });
      if (fileSeenHashes.has(dedupeHash)) {
        // duplicate within the same file
        continue;
      }
      fileSeenHashes.add(dedupeHash);

      const options = [
        { key: 'A', text: a },
        { key: 'B', text: b }
      ];
      if (c) options.push({ key: 'C', text: c });
      if (d) options.push({ key: 'D', text: d });

      pendingDocs.push({
        courseId,
        questionNo: totalRows, // sequential per file after empty rows skipped
        text: qText,
        options,
        correctAnswer: ans,
        marks: 1,
        isActive: true,
        source: 'Excel',
        dedupeHash
      });
    }

    // Skip if nothing valid
    if (pendingDocs.length === 0) {
      return res.status(200).json({ totalRows, insertedCount: 0, skippedCount: 0, errors });
    }

    // Check existing hashes to avoid duplicate inserts
    const hashes = pendingDocs.map(d => d.dedupeHash);
    const existing = await Question.find({ courseId, dedupeHash: { $in: hashes } }).select('dedupeHash').lean();
    const existingSet = new Set(existing.map(e => e.dedupeHash));
    const toInsert = pendingDocs.filter(d => !existingSet.has(d.dedupeHash));

    let insertedCount = 0;
    if (toInsert.length > 0) {
      try {
        const result = await Question.insertMany(toInsert, { ordered: false });
        insertedCount = Array.isArray(result) ? result.length : (result?.insertedCount || toInsert.length);
      } catch (e) {
        // With ordered:false, duplicates shouldn't abort others; count what made it
        // Fallback: recount actually inserted
        const after = await Question.countDocuments({ courseId, dedupeHash: { $in: toInsert.map(d => d.dedupeHash) } });
        insertedCount = after - existingSet.size;
      }
    }

    const skippedCount = Math.max(0, (totalRows - errors.length) - insertedCount);

    return res.status(200).json({ totalRows, insertedCount, skippedCount, errors });
  } catch (err) {
    next(err);
  }
};

export const listByCourse = async (req, res, next) => {
  try {
    const { courseId, page = 1, limit = 20, search = '' } = req.query;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid courseId' });
    }
    const q = { courseId, isActive: true };
    if (search && String(search).trim()) {
      q.text = { $regex: String(search).trim(), $options: 'i' };
    }
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const [items, total] = await Promise.all([
      Question.find(q)
        .sort({ questionNo: 1, createdAt: 1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Question.countDocuments(q)
    ]);
    res.json({ items, total, page: pageNum, limit: pageSize });
  } catch (err) {
    next(err);
  }
};

export const deleteByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid courseId' });
    }
    const result = await Question.deleteMany({ courseId });
    return res.json({ deletedCount: result.deletedCount || 0 });
  } catch (err) {
    next(err);
  }
};


