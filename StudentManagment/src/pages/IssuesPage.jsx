import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaSpinner, FaCheckCircle, FaClock, FaHourglass } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/IssuesPage.css';

const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/issues');
      // Filter out solved issues
      const activeIssues = response.data.filter(issue => issue.status !== 'solved');
      setIssues(activeIssues);
    } catch (err) {
      toast.error('Failed to fetch issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      await api.put(`/issues/${issueId}/status`, { status: newStatus });
      
      if (newStatus === 'solved') {
        // Remove the solved issue from the state immediately
        setIssues(prevIssues => prevIssues.filter(issue => issue._id !== issueId));
        toast.success('Issue marked as solved and removed from list');
      } else {
        // Update the issue status in the state
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue._id === issueId ? { ...issue, status: newStatus } : issue
          )
        );
        toast.success(`Issue marked as ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update issue status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'in-progress':
        return <FaHourglass className="status-icon in-progress" />;
      case 'solved':
        return <FaCheckCircle className="status-icon solved" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="issues-loading">
        <FaSpinner className="spinner" />
        <p>Loading issues...</p>
      </div>
    );
  }

  return (
    <div className="issues-page">
      <h2>Active Student Issues</h2>
      <div className="issues-container">
        {issues.length === 0 ? (
          <div className="no-issues">
            <p>No active issues found</p>
          </div>
        ) : (
          <div className="issues-grid">
            {issues.map((issue) => (
              <div key={issue._id} className={`issue-card ${issue.status}`}>
                <div className="issue-header">
                  <div className="student-info">
                    <h3>{issue.student?.name || 'Unknown Student'}</h3>
                    <p className="student-id">ID: {issue.student?.studentId}</p>
                  </div>
                  {getStatusIcon(issue.status)}
                </div>
                <div className="issue-content">
                  <p>{issue.description}</p>
                  <div className="issue-details">
                    <span>Reported: {new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span className="student-email">{issue.student?.email}</span>
                  </div>
                </div>
                <div className="issue-actions">
                  {issue.status === 'pending' && (
                    <button
                      className="action-button progress"
                      onClick={() => handleStatusUpdate(issue._id, 'in-progress')}
                    >
                      Mark In Progress
                    </button>
                  )}
                  {issue.status === 'in-progress' && (
                    <button
                      className="action-button solved"
                      onClick={() => handleStatusUpdate(issue._id, 'solved')}
                    >
                      Mark as Solved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuesPage; 