import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import API_CONFIG from '../config/apiConfig';
import { BookOpen, Search, Download, Upload, X, FileText, AlertCircle } from 'react-feather';

export default function QuestionBank() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [file, setFile] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/studentcourses');
        setCourses(res.data || []);
      } catch {
        toast.error('Failed to load courses');
      }
    };
    fetchCourses();
  }, []);

  const fetchQuestions = async () => {
    if (!courseId) return;
    try {
      const query = new URLSearchParams({ courseId, page: String(page), limit: String(limit), ...(search ? { search } : {}) }).toString();
      const res = await api.get(`/questions?${query}`);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load questions');
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, page, limit]);

  // Auto-hide summary after 5s
  useEffect(() => {
    if (summary) {
      const t = setTimeout(() => setSummary(null), 5000);
      return () => clearTimeout(t);
    }
  }, [summary]);

  // Template download removed per request

  const onImport = async () => {
    if (!courseId) { toast.warn('Please select a course'); return; }
    if (!file) { toast.warn('Please choose an .xlsx file'); return; }
    if (!file.name.endsWith('.xlsx')) { toast.warn('Only .xlsx files are allowed'); return; }
    setLoading(true);
    setSummary(null);
    try {
      const form = new FormData();
      form.append('courseId', courseId);
      form.append('file', file);
      const res = await api.post('/questions/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSummary(res.data);
      toast.success('Import completed');
      setPage(1);
      await fetchQuestions();
      setIsDialogOpen(false);
      setFile(null);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Import failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const onDeleteAll = async () => {
    if (!courseId) { toast.warn('Please select a course'); return; }
    const confirm = window.confirm('Delete ALL questions for this course? This action cannot be undone.');
    if (!confirm) return;
    try {
      await api.delete(`/questions/course/${courseId}`);
      toast.success('All questions deleted for this course');
      setItems([]);
      setTotal(0);
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (!courseId) { toast.warn('Please select a course first'); return; }
                setIsDialogOpen(true);
              }} className="mt-1 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Upload className="w-4 h-4" />
                Add Questions
              </button>
              <button onClick={onDeleteAll} className="mt-1 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">Select course</option>
                {courses.map(c => (
                  <option value={c._id} key={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchQuestions(); } }} placeholder="Search question text..." />
              </div>
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-lg shadow-md bg-white border flex items-center gap-3">
            <span className="text-sm">Total: <b>{summary.totalRows}</b></span>
            <span className="text-sm">Inserted: <b className="text-green-700">{summary.insertedCount}</b></span>
            <span className="text-sm">Skipped: <b className="text-yellow-700">{summary.skippedCount}</b></span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 border-b w-16">#</th>
              <th className="p-3 border-b">Text</th>
              <th className="p-3 border-b">A</th>
              <th className="p-3 border-b">B</th>
              <th className="p-3 border-b">C</th>
              <th className="p-3 border-b">D</th>
              <th className="p-3 border-b">Answer</th>
            </tr>
          </thead>
          <tbody>
            {items.map(q => (
              <tr key={q._id} className="border-t hover:bg-gray-50">
                <td className="p-3 align-top text-gray-600">{q.questionNo || '-'}</td>
                <td className="p-3 align-top font-semibold">{q.text}</td>
                <td className="p-3 align-top">{q.options?.find(o => o.key === 'A')?.text || ''}</td>
                <td className="p-3 align-top">{q.options?.find(o => o.key === 'B')?.text || ''}</td>
                <td className="p-3 align-top">{q.options?.find(o => o.key === 'C')?.text || ''}</td>
                <td className="p-3 align-top">{q.options?.find(o => o.key === 'D')?.text || ''}</td>
                <td className="p-3 align-top font-semibold">{q.correctAnswer}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">{courseId ? 'No questions found' : 'Please select a course'}</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 mt-3 flex items-center gap-2">
        <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
        <span className="text-sm text-gray-700">Page {page} / {totalPages}</span>
        <button disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        <select value={limit} onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }} className="ml-4 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsDialogOpen(false); }}>
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl p-5 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Add Questions (Excel)</h3>
              </div>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                Course: <b>{courses.find(c => c._id === courseId)?.name || 'None'}</b>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                <p>Use the Template to fill questions. Supported file type: <b>.xlsx</b>. Max ~5,000 rows per upload.</p>
              </div>

              <div
                className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const f = e.dataTransfer.files[0];
                    if (!f.name.endsWith('.xlsx')) { toast.warn('Only .xlsx files are allowed'); return; }
                    setFile(f);
                  }
                }}
              >
                <p className="text-sm text-gray-600 mb-3">Drag & drop your .xlsx here, or choose a file</p>
                <label className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded border cursor-pointer hover:bg-gray-200">
                  <Upload className="w-4 h-4" /> Choose .xlsx
                  <input type="file" accept=".xlsx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </label>
                {file && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                    <FileText className="w-4 h-4" /> {file.name}
                    <button className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => setFile(null)} title="Remove file"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-600">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <span>Duplicate questions (same text/options/answer) are auto-skipped.</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button disabled={loading || !file} onClick={onImport} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-60">{loading ? 'Importing...' : 'Upload & Import'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


