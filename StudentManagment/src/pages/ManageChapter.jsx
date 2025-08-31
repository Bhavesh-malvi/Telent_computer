import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChapterForm from '../components/ChapterForm';
import AddTopicDialog from '../components/AddTopicDialog';
import { BookOpen, Plus, ChevronDown, ChevronRight, Edit3, Trash2, FileText, Loader } from 'react-feather';
import { getChaptersByCourse, addChapter, editChapter, deleteChapter, editTopicInChapter, deleteTopicFromChapter, getStudentCourseById } from '../services/api';
// import '../styles/ManageChapter.css'; // Removed custom CSS

const ManageChapter = () => {
  const { courseId } = useParams();
  const [chapters, setChapters] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [showAddTopicDialog, setShowAddTopicDialog] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [editTopicData, setEditTopicData] = useState(null);
  const [editTopicIdx, setEditTopicIdx] = useState(null);
  const [courseName, setCourseName] = useState('');
  
  // Loading states for different actions
  const [addingChapter, setAddingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(null);
  
  const roleLower = (localStorage.getItem('role') || '').toLowerCase();
  const isClerk = roleLower.includes('clerk');
  const isManager = roleLower.includes('manager');

  useEffect(() => {
    fetchChapters();
    fetchCourseName();
  }, [courseId]);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const res = await getChaptersByCourse(courseId);
      setChapters(res.data);
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setChapters([]);
      toast.error('Failed to load chapters');
    }
    setLoading(false);
  };

  const fetchCourseName = async () => {
    try {
      const res = await getStudentCourseById(courseId);
      setCourseName(res.course?.name || '');
    } catch (err) {
      console.error('Error fetching course name:', err);
      setCourseName('');
    }
  };

  const handleAddChapter = async (chapter) => {
    setAddingChapter(true);
    try {
      await addChapter(courseId, chapter);
      await fetchChapters();
      setShowDialog(false);
      toast.success('Chapter added successfully!');
    } catch (err) {
      console.error('Error adding chapter:', err);
      toast.error('Failed to add chapter');
    } finally {
      setAddingChapter(false);
    }
  };

  const handleEditChapter = (chapter) => {
    setEditData(chapter);
    setShowDialog(true);
  };

  const handleDeleteChapter = async (chapterId) => {
    setDeletingChapter(chapterId);
    try {
      await deleteChapter(chapterId);
      await fetchChapters();
      toast.success('Chapter deleted successfully!');
    } catch (err) {
      console.error('Error deleting chapter:', err);
      toast.error('Failed to delete chapter');
    } finally {
      setDeletingChapter(null);
    }
  };

  const handleSaveChapter = async (chapter) => {
    if (editData) {
      setEditingChapter(true);
    } else {
      setAddingChapter(true);
    }
    
    try {
      if (editData) {
        await editChapter(editData._id, chapter);
        toast.success('Chapter updated successfully!');
      } else {
        await addChapter(courseId, chapter);
        toast.success('Chapter added successfully!');
      }
      await fetchChapters();
      setShowDialog(false);
      setEditData(null);
    } catch (err) {
      console.error('Error saving chapter:', err);
      toast.error(editData ? 'Failed to update chapter' : 'Failed to add chapter');
    } finally {
      setEditingChapter(false);
      setAddingChapter(false);
    }
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  // Placeholder handlers for topic edit/delete
  const handleEditTopic = (chapterId, topicIdx) => {
    const chapter = chapters.find(c => c._id === chapterId);
    if (!chapter) return;
    const topic = chapter.topics[topicIdx];
    setSelectedChapterId(chapterId);
    setEditTopicData({ ...topic });
    setEditTopicIdx(topicIdx);
    setShowAddTopicDialog(true);
  };
  const handleDeleteTopic = async (chapterId, topicIdx) => {
    setDeletingTopic(`${chapterId}-${topicIdx}`);
    try {
      await deleteTopicFromChapter(chapterId, topicIdx);
      await fetchChapters();
      toast.success('Topic deleted successfully!');
    } catch (err) {
      console.error('Error deleting topic:', err);
      toast.error('Failed to delete topic');
    } finally {
      setDeletingTopic(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Course Name at Top */}
        <div className="text-blue-700 font-semibold text-lg mb-2">{courseName && `Course: ${courseName}`}</div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Chapter Management</h1>
            </div>
            {!isClerk && (
              <button
                onClick={() => setShowDialog(true)}
                disabled={addingChapter || editingChapter}
                className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl ${
                  addingChapter || editingChapter 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-700'
                }`}
              >
                {addingChapter || editingChapter ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {addingChapter ? 'Adding...' : editingChapter ? 'Saving...' : 'Add New Chapter'}
              </button>
            )}
          </div>
          <p className="text-gray-600 mt-2">Manage your course chapters and topics</p>
        </div>
        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                    Chapter Info
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chapters.map((chapter) => (
                  <React.Fragment key={chapter._id}>
                    {/* Chapter Row */}
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleChapter(chapter._id)}
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors duration-150"
                          >
                            {expandedChapters.has(chapter._id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                              {chapter.order}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{chapter.name}</h3>
                              <p className="text-sm text-gray-500">
                                {chapter.topics.length} topics
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {!isClerk && (
                            <button
                              onClick={() => handleEditChapter(chapter)}
                              disabled={addingChapter || editingChapter}
                              className={`p-2 text-blue-600 rounded-lg transition-colors duration-150 ${
                                addingChapter || editingChapter 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:bg-blue-50'
                              }`}
                              title="Edit Chapter"
                            >
                              {editingChapter ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Edit3 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {!isClerk && !isManager && (
                            <button
                              onClick={() => handleDeleteChapter(chapter._id)}
                              disabled={deletingChapter === chapter._id || addingChapter || editingChapter}
                              className={`p-2 text-red-600 rounded-lg transition-colors duration-150 ${
                                deletingChapter === chapter._id || addingChapter || editingChapter
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:bg-red-50'
                              }`}
                              title="Delete Chapter"
                            >
                              {deletingChapter === chapter._id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {!isClerk && (
                            <button
                              onClick={() => { setSelectedChapterId(chapter._id); setShowAddTopicDialog(true); }}
                              disabled={addingChapter || editingChapter}
                              className={`p-2 text-green-600 rounded-lg transition-colors duration-150 ${
                                addingChapter || editingChapter 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:bg-green-50'
                              }`}
                              title="Add Topic"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Topics Section */}
                    {expandedChapters.has(chapter._id) && (
                      <tr>
                        <td colSpan={2} className="p-0">
                          <div className="bg-gray-50 border-t border-gray-200">
                            <div className="p-6">
                              <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Topics in Chapter {chapter.order}
                              </h4>
                              {chapter.topics.length > 0 ? (
                                <div className="space-y-3">
                                  {chapter.topics.map((topic, tIdx) => (
                                    <div
                                      key={topic._id || tIdx}
                                      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-150"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="font-medium text-gray-900">
                                          {topic.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {!isClerk && (
                                          <button
                                            onClick={() => handleEditTopic(chapter._id, tIdx)}
                                            disabled={deletingTopic === `${chapter._id}-${tIdx}`}
                                            className={`p-2 text-blue-600 rounded-lg transition-colors duration-150 ${
                                              deletingTopic === `${chapter._id}-${tIdx}` 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'hover:bg-blue-50'
                                            }`}
                                            title="Edit Topic"
                                          >
                                            <Edit3 className="w-4 h-4" />
                                          </button>
                                        )}
                                        {!isClerk && !isManager && (
                                          <button
                                            onClick={() => handleDeleteTopic(chapter._id, tIdx)}
                                            disabled={deletingTopic === `${chapter._id}-${tIdx}`}
                                            className={`p-2 text-red-600 rounded-lg transition-colors duration-150 ${
                                              deletingTopic === `${chapter._id}-${tIdx}` 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'hover:bg-red-50'
                                            }`}
                                            title="Delete Topic"
                                          >
                                            {deletingTopic === `${chapter._id}-${tIdx}` ? (
                                              <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="w-4 h-4" />
                                            )}
                                          </button>
                                        )}
                                        {topic.pdf && (
                                          <a
                                            href={topic.pdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-150"
                                            title="View PDF"
                                          >
                                            <FileText className="w-4 h-4" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-500">No topics in this chapter yet</p>
                                  {!isClerk && (
                                    <button
                                      onClick={() => { setSelectedChapterId(chapter._id); setShowAddTopicDialog(true); }}
                                      disabled={addingChapter || editingChapter}
                                      className={`mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors duration-200 ${
                                        addingChapter || editingChapter 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : 'hover:bg-blue-700'
                                      }`}
                                    >
                                      Add First Topic
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Empty State */}
        {chapters.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first chapter</p>
            <button
              onClick={() => setShowDialog(true)}
              disabled={addingChapter || editingChapter}
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg transition-colors duration-200 ${
                addingChapter || editingChapter 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'
              }`}
            >
              Add Your First Chapter
            </button>
          </div>
        )}
        {/* Dialogs */}
        {showDialog && (
          <ChapterForm
            onClose={() => { setShowDialog(false); setEditData(null); }}
            onSave={handleSaveChapter}
            nextOrder={chapters.length + 1}
            editData={editData}
            loading={addingChapter || editingChapter}
          />
        )}
        {showAddTopicDialog && selectedChapterId && (
          <AddTopicDialog
            chapterId={selectedChapterId}
            onClose={() => { setShowAddTopicDialog(false); setEditTopicData(null); setEditTopicIdx(null); }}
            onTopicAdded={fetchChapters}
            editData={editTopicData}
            editIdx={editTopicIdx}
          />
        )}
      </div>
    </div>
  );
};

export default ManageChapter; 