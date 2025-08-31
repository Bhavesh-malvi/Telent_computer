import React, { useState, useEffect } from 'react';
import '../styles/IssueDialog.css';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const IssueDialog = ({ studentId, onClose }) => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [studentId]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/issues/student/${studentId}`);
      // Find the first active issue (pending or in-progress)
      const activeIssue = response.data.find(i => i.status !== 'solved');
      setIssue(activeIssue || null);
    } catch (err) {
      toast.error('Failed to fetch issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/issues/${issueId}/status`, { status: newStatus });
      toast.success(`Issue marked as ${newStatus}`);
      await fetchIssues();
      if (newStatus === 'solved') {
        onClose();
      }
    } catch (err) {
      toast.error('Failed to update issue status');
      console.error('Error updating issue status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="issue-dialog-overlay">
        <div className="issue-dialog">
          <div className="loading-spinner">
            <FaSpinner className="spinner" />
            <p>Loading issues...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="issue-dialog-overlay" onClick={onClose}>
        <div className="issue-dialog" onClick={e => e.stopPropagation()}>
          <div className="issue-dialog-header">
            <h3>No Active Issues</h3>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="issue-dialog-content">
            <p>There are no active issues for this student.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-dialog-overlay" onClick={onClose}>
      <div className="issue-dialog" onClick={e => e.stopPropagation()}>
        <div className="issue-dialog-header">
          <h3>Issue Details</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="issue-dialog-content">
          <div className="issue-detail">
            <strong>Description:</strong>
            <p>{issue.description}</p>
          </div>
          <div className="issue-detail">
            <strong>Status:</strong>
            <span className={`issue-status ${issue.status}`}>{issue.status}</span>
          </div>
          <div className="issue-detail">
            <strong>Reported On:</strong>
            <p>{new Date(issue.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="issue-dialog-actions">
          {issue.status === 'pending' && (
            <button 
              className="action-button progress"
              onClick={() => handleStatusUpdate(issue._id, 'in-progress')}
              disabled={updatingStatus}
            >
              {updatingStatus ? <FaSpinner className="spinner" /> : 'Mark In Progress'}
            </button>
          )}
          {issue.status === 'in-progress' && (
            <button 
              className="action-button solved"
              onClick={() => handleStatusUpdate(issue._id, 'solved')}
              disabled={updatingStatus}
            >
              {updatingStatus ? <FaSpinner className="spinner" /> : 'Mark as Solved'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDialog; 