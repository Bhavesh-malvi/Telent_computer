import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../api/axios';

export default function StudentExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('in_progress');
  const [items, setItems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/exams/attempt/${attemptId}`);
        setStatus(data.status);
        if (data.status === 'submitted') {
          setItems(data.items || []);
          setScore(data.score || 0);
          setTotal(data.total || (data.items?.length || 0));
        } else {
          setItems(data.items || []);
          const initial = {};
          (data.items || []).forEach(q => {
            if (q.selected) initial[q.questionId] = q.selected;
          });
          setAnswers(initial);
          setTotal((data.items || []).length || 0);
        }
      } catch (e) {
        navigate('/student-dashboard', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId, navigate]);

  const onSelect = (qid, opt) => {
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = Object.keys(answers).map(qid => ({ questionId: qid, selected: answers[qid] }));
      const { data } = await axios.post('/exams/submit', { attemptId, answers: payload });
      setStatus('submitted');
      // Merge result view
      // Need fetch full question data including text/options; server returns breakdown only
      // Reload attempt to get decorated items
      const res = await axios.get(`/exams/attempt/${attemptId}`);
      setItems(res.data.items || []);
      setScore(res.data.score || 0);
      setTotal(res.data.total || (res.data.items?.length || 0));
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const current = useMemo(() => items[index] || null, [items, index]);
  const progress = useMemo(() => {
    const answered = Object.keys(answers).length;
    return { answered, total: total || items.length };
  }, [answers, items.length, total]);

  const goPrev = () => setIndex(i => Math.max(0, i - 1));
  const goNext = () => setIndex(i => Math.min(items.length - 1, i + 1));
  const goTo = (i) => setIndex(() => Math.min(Math.max(0, i), items.length - 1));

  if (loading) {
    return <div style={{ padding: 20 }}>Loading exam...</div>;
  }

  if (status === 'submitted') {
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Exam Result</h2>
          <div><b>Score:</b> {score} / {total}</div>
        </div>

        {/* Current Result Question Card (pagination like exam) */}
        {current && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12, background: '#fff' }}>
            <div style={{ marginBottom: 10, fontWeight: 700 }}>
              Q{index + 1}. {current.text}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {['A', 'B', 'C', 'D'].map(k => {
                const optText = (current.options || []).find(o => o.key === k)?.text || '';
                const isCorrectOpt = current.correctAnswer === k;
                const isSelectedWrong = current.selected && current.selected === k && current.selected !== current.correctAnswer;
                const bg = isCorrectOpt ? '#d1fae5' : (isSelectedWrong ? '#fee2e2' : '#fff');
                const border = isCorrectOpt ? '#10b981' : (isSelectedWrong ? '#ef4444' : '#e5e7eb');
                return (
                  <div key={k} style={{ border: `1px solid ${border}`, background: bg, padding: '10px 12px', borderRadius: 8 }}>
                    <b>{k}:</b> {optText}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: current.isCorrect ? '#065f46' : '#991b1b' }}>
              {current.isCorrect ? 'Correct' : 'Wrong'}
            </div>
          </div>
        )}

        {/* Bottom compact pagination (like exam view) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
          <button
            onClick={goPrev}
            disabled={index === 0}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1', background: index === 0 ? '#f1f5f9' : '#ffffff', minWidth: 110, color: '#334155', fontWeight: 600 }}
          >
            Previous
          </button>
          <div style={{ color: '#0f172a', fontWeight: 600 }}>
            Page {index + 1} / {items.length || 1}
          </div>
          {index < items.length - 1 ? (
            <button
              onClick={goNext}
              style={{ padding: '10px 16px', borderRadius: 10, background: '#3b82f6', color: '#fff', border: '1px solid #2563eb', minWidth: 110, fontWeight: 600 }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => navigate('/student-dashboard')}
              style={{ padding: '10px 16px', borderRadius: 10, background: '#16a34a', color: '#fff', border: '1px solid #15803d', minWidth: 110, fontWeight: 600 }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Exam</h2>
        <div style={{ fontSize: 14, color: '#64748b' }}>
          Answered {progress.answered}/{progress.total}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, marginBottom: 12 }}>
        <div style={{ width: `${(progress.answered / (progress.total || 1)) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: 999 }} />
      </div>

      {/* Current Question Card */}
      {current && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12, background: '#fff' }}>
          <div style={{ marginBottom: 10, fontWeight: 700 }}>
            Q{index + 1}. {current.text}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {['A', 'B', 'C', 'D'].map(k => {
              const optText = (current.options || []).find(o => o.key === k)?.text || '';
              return (
                <label key={k} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: '1px solid #e5e7eb', padding: '10px 12px', borderRadius: 8,
                  background: answers[current.questionId] === k ? '#eff6ff' : '#fff'
                }}>
                  <input
                    type="radio"
                    name={`q_${current.questionId}`}
                    checked={answers[current.questionId] === k}
                    onChange={() => onSelect(current.questionId, k)}
                  />
                  <span><b>{k}:</b> {optText}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      {/* Bottom compact pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
        <button
          onClick={goPrev}
          disabled={index === 0}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1', background: index === 0 ? '#f1f5f9' : '#ffffff', minWidth: 110, color: '#334155', fontWeight: 600 }}
        >
          Previous
        </button>
        <div style={{ color: '#0f172a', fontWeight: 600 }}>
          Page {index + 1} / {items.length || 1}
        </div>
        {index < items.length - 1 ? (
          <button
            onClick={goNext}
            style={{ padding: '10px 16px', borderRadius: 10, background: '#3b82f6', color: '#fff', border: '1px solid #2563eb', minWidth: 110, fontWeight: 600 }}
          >
            Next
          </button>
        ) : (
          <button
            disabled={submitting}
            onClick={onSubmit}
            style={{ padding: '10px 16px', borderRadius: 10, background: '#16a34a', color: '#fff', border: '1px solid #15803d', minWidth: 110, fontWeight: 600 }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}


