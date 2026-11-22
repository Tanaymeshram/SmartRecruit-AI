import React, { useState, useEffect } from 'react';
import {
  BookOpenText,
  UploadCloud,
  Send,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import CitationCard from '../components/CitationCard';

const SAMPLE_POLICY_PROMPTS = [
  'What are the core technical competency weights for engineering hiring?',
  'What is the company policy regarding non-discrimination and equal opportunity in candidate ranking?',
  'What is the structured interview procedure outlined in the technical interviewer SOP?',
  'How should interviewers evaluate problem-solving and architectural thinking?'
];

export default function RagKnowledgeAssistant() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Welcome to the Recruitment Policy & Knowledge Assistant. Ask questions regarding company hiring standards, interview rubrics, and non-discrimination mandates.',
      citations: []
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('policy');
  const [file, setFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/rag/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load company knowledge docs', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', docTitle || file.name);
    formData.append('doc_type', docType);

    try {
      await api.post('/rag/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      setFile(null);
      setDocTitle('');
      fetchDocuments();
    } catch (err) {
      alert('Failed to upload document: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (qText) => {
    const q = (qText || query).trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: q }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/rag/query', {
        query: q,
        scope: 'company_knowledge',
        top_k: 4
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: res.data.answer,
          citations: res.data.citations || [],
          confidence: res.data.confidence,
          modelUsed: res.data.model_used
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Error querying HR knowledge base: ' + (err.response?.data?.detail || err.message),
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpenText className="w-6 h-6 text-primary-600" />
            Recruitment Policy & Knowledge Assistant
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Grounded Q&A on company hiring guidelines, evaluation rubrics, and interviewer SOPs.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload HR Document</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Company HR Knowledge Document
            </h3>
            <form onSubmit={handleUploadDoc} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. 2026 Engineering Interview Rubric"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
                >
                  <option value="policy">Company Hiring Policy</option>
                  <option value="interview_guideline">Interview Rubric / SOP</option>
                  <option value="assessment">Technical Assessment Guidelines</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select File (PDF, DOCX, TXT)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 rounded-lg bg-primary-600 text-white font-semibold"
                >
                  {uploading ? 'Ingesting Vectors...' : 'Upload & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggested Inquiries */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Suggested Policy Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_POLICY_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 text-xs text-left rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-400 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-all shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs min-h-[460px] flex flex-col justify-between space-y-4">
        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.modelUsed && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>Engine: {msg.modelUsed}</span>
                    {msg.confidence > 0 && <span>Confidence: {Math.round(msg.confidence * 100)}%</span>}
                  </div>
                )}
              </div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="w-full max-w-2xl mt-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Verified Document Citations ({msg.citations.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {msg.citations.map((c, idx) => (
                      <CitationCard key={idx} citation={c} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-4 text-xs text-slate-500">
              <div className="w-4 h-4 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
              <span>Consulting policy vector index...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about hiring criteria, interview guidelines, scoring rubrics..."
            className="flex-1 px-4 py-2.5 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
