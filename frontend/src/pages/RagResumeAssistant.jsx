import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';
import api from '../services/api';
import CitationCard from '../components/CitationCard';

const SAMPLE_PROMPTS = [
  'Which candidates have extensive experience with FastAPI and PostgreSQL?',
  'Compare the technical project experience of Alex Rivera and Elena Rostova.',
  'Does any candidate mention production experience with Kubernetes and Terraform?',
  'Summarize the backgrounds of candidates with Machine Learning and NLP expertise.'
];

export default function RagResumeAssistant() {
  const [searchParams] = useSearchParams();
  const initialCandidate = searchParams.get('candidate');

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your RAG Recruitment Knowledge Assistant. I can search across all uploaded candidate resumes using hybrid semantic & BM25 retrieval to find specific skills, projects, and qualifications. Ask me anything about candidate backgrounds!',
      citations: []
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(initialCandidate || '');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get('/candidates');
        setCandidates(res.data);
      } catch (err) {
        console.error('Failed to load candidates for RAG scope', err);
      }
    };
    fetchCandidates();
  }, []);

  const handleSend = async (questionText) => {
    const q = (questionText || query).trim();
    if (!q || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: q
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/rag/query', {
        query: q,
        scope: 'resumes',
        candidate_ids: selectedCandidate ? [selectedCandidate] : null,
        top_k: 5
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.data.answer,
        citations: res.data.citations || [],
        confidence: res.data.confidence,
        modelUsed: res.data.model_used
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Error querying the knowledge base: ' + (err.response?.data?.detail || err.message),
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
            <BotMessageSquare className="w-6 h-6 text-primary-600" />
            RAG-Powered Resume Knowledge Assistant
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Grounded answers derived exclusively from verified resume chunks with source citations and anti-hallucination guardrails.
          </p>
        </div>

        {/* Scope selector */}
        <select
          value={selectedCandidate}
          onChange={(e) => setSelectedCandidate(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
        >
          <option value="">Search Across All Resumes</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              Scoped to: {c.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Suggested Queries Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt, i) => (
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

              {/* Citations Grid */}
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
              <span>Searching vector space and synthesizing grounded response...</span>
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
            placeholder="Ask a question about candidate skills, experience, or projects..."
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
