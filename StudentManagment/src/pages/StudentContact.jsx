import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import './StudentContact.css';

const StudentContact = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch contacts data
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contacts');
      setContacts(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch contact messages. Please try again.');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete contact
  const handleDelete = async (id) => {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    const isSuperAdmin = role.includes('superadmin');
    if (!isSuperAdmin) {
      setError('Only SuperAdmin can delete contact messages');
      return;
    }
    try {
      await api.delete(`/contacts/${id}`);
      setContacts(contacts.filter(contact => contact._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete contact message. Please try again.');
      console.error('Error deleting contact:', err);
    }
  };

  // View contact details
  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedContact(null);
  };

  // Filter and sort contacts
  const filteredAndSortedContacts = contacts
    .filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  useEffect(() => {
    fetchContacts();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message, maxLength = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          <p className="text-blue-700 font-semibold">Loading contact messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2 md:px-8">
      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Contact Messages</h1>
            <p className="text-blue-100">Manage and respond to all incoming contact form submissions</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or message content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white shadow-sm"
            />
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="createdAt">Date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm text-lg font-bold text-blue-700 hover:bg-blue-50 transition"
            title="Toggle sort order"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-5xl mx-auto mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          <span>⚠️ {error}</span>
          <button onClick={fetchContacts} className="ml-auto px-4 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition">Retry</button>
        </div>
      )}

      {/* Contacts Grid */}
      <div className="max-w-5xl mx-auto">
        {filteredAndSortedContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-5xl mb-2">💬</div>
            <h3 className="text-lg font-bold mb-1">No contact messages found</h3>
            <p className="text-sm">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'No contact messages have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredAndSortedContacts.map((contact) => (
              <div key={contact._id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3 min-w-[340px]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shadow">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{contact.name}</h3>
                      <p className="text-blue-600 text-sm leading-tight">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleViewContact(contact)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition shadow-sm"
                      title="View full message"
                    >
                      <span className="text-lg">👁️</span>
                    </button>
                    { (localStorage.getItem('role')||'').toLowerCase().includes('superadmin') && (
                      <button
                        onClick={() => handleDelete(contact._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition shadow-sm"
                        title="Delete message"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-gray-700 text-sm flex-1 min-h-[48px] mt-1 mb-2">{truncateMessage(contact.message)}</div>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1">📅 {formatDate(contact.createdAt)}</span>
                  <a 
                    href={`mailto:${contact.email}?subject=Re: Your Contact Message`}
                    className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
                  >
                    Reply
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing full message */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeModal}>
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-2 p-8"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
              onClick={closeModal}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">Contact Message</h3>
            <div className="mb-4">
              <div className="font-semibold text-gray-700">Name:</div>
              <div className="mb-2">{selectedContact.name}</div>
              <div className="font-semibold text-gray-700">Email:</div>
              <div className="mb-2">{selectedContact.email}</div>
              <div className="font-semibold text-gray-700">Message:</div>
              <div className="mb-2 whitespace-pre-line">{selectedContact.message}</div>
              <div className="font-semibold text-gray-700">Date:</div>
              <div>{formatDate(selectedContact.createdAt)}</div>
            </div>
            <div className="flex justify-end gap-3">
              <a
                href={`mailto:${selectedContact.email}?subject=Re: Your Contact Message`}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                Reply
              </a>
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentContact;
