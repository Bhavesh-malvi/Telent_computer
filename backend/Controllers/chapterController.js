import Chapter from '../Model/Chapter.js';

// Add a new chapter to a course
const addChapter = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, order } = req.body;
    if (!name || !order) return res.status(400).json({ message: 'Name and order are required' });
    // Shift chapters with order >= new order
    await Chapter.updateMany(
      { course: courseId, order: { $gte: order } },
      { $inc: { order: 1 } }
    );
    const chapter = await Chapter.create({ course: courseId, name, order });
    res.status(201).json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all chapters for a course, sorted by order
const getChaptersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const chapters = await Chapter.find({ course: courseId }).sort({ order: 1 });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit a chapter
const editChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { name, order } = req.body;
    const chapter = await Chapter.findByIdAndUpdate(
      chapterId,
      { name, order },
      { new: true }
    );
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a chapter
const deleteChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findByIdAndDelete(chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    // Decrement order of chapters with higher order in the same course
    await Chapter.updateMany(
      { course: chapter.course, order: { $gt: chapter.order } },
      { $inc: { order: -1 } }
    );
    res.json({ message: 'Chapter deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a topic to a chapter
const addTopicToChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { name, pdf } = req.body;
    let pdfUrl = '';
    if (pdf && typeof pdf === 'string' && pdf.startsWith('http')) {
      pdfUrl = pdf; // Google Drive link
    } else if (req.file) {
      pdfUrl = `/uploads/${req.file.filename}`;
    }
    if (!name) return res.status(400).json({ message: 'Topic name is required' });
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    chapter.topics.push({ name, pdf: pdfUrl });
    await chapter.save();
    res.status(201).json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit a topic in a chapter
const editTopicInChapter = async (req, res) => {
  try {
    const { chapterId, topicIdx } = req.params;
    const { name, pdf } = req.body;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    if (!chapter.topics[topicIdx]) return res.status(404).json({ message: 'Topic not found' });
    if (name) chapter.topics[topicIdx].name = name;
    if (pdf) chapter.topics[topicIdx].pdf = pdf;
    await chapter.save();
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a topic from a chapter
const deleteTopicFromChapter = async (req, res) => {
  try {
    const { chapterId, topicIdx } = req.params;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    if (!chapter.topics[topicIdx]) return res.status(404).json({ message: 'Topic not found' });
    chapter.topics.splice(topicIdx, 1);
    await chapter.save();
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const chapterController = {
  addChapter,
  getChaptersByCourse,
  editChapter,
  deleteChapter,
  addTopicToChapter,
  editTopicInChapter,
  deleteTopicFromChapter
};

export default chapterController;