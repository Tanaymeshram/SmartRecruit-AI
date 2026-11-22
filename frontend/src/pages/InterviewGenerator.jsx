import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Layers,
  Code2,
  Brain,
  Lightbulb,
  Cpu
} from 'lucide-react';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function InterviewGenerator() {
  const [searchParams] = useSearchParams();
  const preCand = searchParams.get('candidate');
  const preJob = searchParams.get('job');

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(preCand || '');
  const [selectedJob, setSelectedJob] = useState(preJob || '');
  const [difficulty, setDifficulty] = useState('Mid');
  const [questionsData, setQuestionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [cRes, jRes] = await Promise.all([
          api.get('/candidates'),
          api.get('/jobs')
        ]);
        setCandidates(cRes.data);
        setJobs(jRes.data);

        const candId = preCand || (cRes.data[0]?.id || '');
        const jobId = preJob || (jRes.data[0]?.id || '');
        setSelectedCandidate(candId);
        setSelectedJob(jobId);

        if (candId) {
          generateQuestions(candId, jobId, 'Mid');
        }
      } catch (err) {
        console.error('Failed to load interview generator data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, [preCand, preJob]);

  const generateQuestions = async (candId, jobId, diff) => {
    if (!candId) return;
    setGenerating(true);
    try {
      const res = await api.post('/interview/generate', {
        candidate_id: candId,
        job_id: jobId || null,
        difficulty: diff,
        include_categories: ['Technical', 'Conceptual', 'Project-Based', 'Problem-Solving']
      });
      setQuestionsData(res.data);
    } catch (err) {
      alert('Failed to generate interview questions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleRun = (e) => {
    e.preventDefault();
    generateQuestions(selectedCandidate, selectedJob, difficulty);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Technical':
        return <Code2 className="w-4 h-4 text-primary-500" />;
      case 'Conceptual':
        return <Brain className="w-4 h-4 text-indigo-500" />;
      case 'Project-Based':
        return <Layers className="w-4 h-4 text-emerald-500" />;
      case 'Problem-Solving':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary-600" />
          AI Interview Question Generator & Rubrics
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Evidence-based interview prompts formulated strictly from the candidate's verified resume projects and job requisites.
        </p>
      </div>

      {/* Selectors Bar */}
      <form onSubmit={handleRun} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-end gap-3 text-xs">
        <div className="flex-1 w-full space-y-1">
          <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Target Candidate
          </label>
          <select
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.total_experience_years}y exp)
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full space-y-1">
          <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Target Job Role
          </label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="">General Assessment (No Job)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-36 space-y-1">
          <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Target Seniority
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="Junior">Junior</option>
            <option value="Mid">Mid-Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead / Architect</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-xs shrink-0 disabled:opacity-50"
        >
          {generating ? 'Formulating...' : 'Generate Questions'}
        </button>
      </form>

      {/* Generated Questions List */}
      {questionsData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              Targeted Interview Packet for: <strong className="text-slate-900 dark:text-white">{questionsData.candidate_name}</strong>
              {questionsData.job_title && ` (${questionsData.job_title})`}
            </span>
            <span className="font-mono">{questionsData.questions?.length} Questions Formulated</span>
          </div>

          <div className="space-y-4">
            {(questionsData.questions || []).map((q, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                      {getCategoryIcon(q.category)}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      {q.category} Question
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                      {q.difficulty}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(`${q.question}\n\nExpected Summary:\n${q.expected_answer_summary}`, idx)}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors flex items-center gap-1"
                    title="Copy question and rubric"
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  "{q.question}"
                </h3>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] block">
                    Expected Key Concepts & Answer Summary:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {q.expected_answer_summary}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Evaluator Scoring Criteria:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                    {q.evaluation_criteria.map((crit, cIdx) => (
                      <li key={cIdx}>{crit}</li>
                    ))}
                  </ul>
                </div>

                {q.context_source && (
                  <div className="pt-2 text-[10px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    Source: {q.context_source}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
