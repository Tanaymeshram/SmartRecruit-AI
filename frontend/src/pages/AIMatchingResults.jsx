import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';
import MatchScoreBadge from '../components/MatchScoreBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function AIMatchingResults() {
  const [searchParams] = useSearchParams();
  const preCand = searchParams.get('candidate');
  const preJob = searchParams.get('job');

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(preCand || '');
  const [selectedJob, setSelectedJob] = useState(preJob || '');
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

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

        if (candId && jobId) {
          executeMatch(candId, jobId);
        }
      } catch (err) {
        console.error('Failed to init matching page', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, [preCand, preJob]);

  const executeMatch = async (candId, jobId) => {
    if (!candId || !jobId) return;
    setMatching(true);
    try {
      const res = await api.post(`/matching/match?candidate_id=${candId}&job_id=${jobId}`);
      setMatchData(res.data);
    } catch (err) {
      console.error('Match failed', err);
    } finally {
      setMatching(false);
    }
  };

  const handleRun = (e) => {
    e.preventDefault();
    executeMatch(selectedCandidate, selectedJob);
  };

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-600" />
          AI Resume-Job Semantic Match Studio
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Sentence Transformer cosine embedding similarity, skill overlap weighting, and explainable gap analysis.
        </p>
      </div>

      {/* Selectors Form */}
      <form onSubmit={handleRun} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-end gap-4 text-xs">
        <div className="flex-1 w-full space-y-1">
          <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Select Candidate Profile
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
            Select Job Description
          </label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={matching}
          className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-xs shrink-0 disabled:opacity-50"
        >
          {matching ? 'Calculating Vectors...' : 'Compute AI Match'}
        </button>
      </form>

      {/* Match Results Display */}
      {matchData && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-primary-300 text-xs font-semibold uppercase tracking-wider block mb-1">
                Evaluation Benchmark
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {matchData.candidate_name} &rarr; {matchData.job_title}
              </h2>
              <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
                {matchData.relevance_explanation}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shrink-0 min-w-36">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-emerald-400">
                {matchData.scores.overall_match_score}%
              </span>
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mt-1">
                Composite Relevance
              </span>
            </div>
          </div>

          {/* 4 Score Component Pillars */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
                <span>Semantic Embeddings</span>
                <Cpu className="w-4 h-4 text-primary-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {matchData.scores.semantic_similarity_score}%
              </div>
              <span className="text-[10px] text-slate-600 block mt-1">30% weighted contribution</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
                <span>Required Skills</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {matchData.scores.required_skills_score}%
              </div>
              <span className="text-[10px] text-slate-600 block mt-1">40% weighted contribution</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
                <span>Preferred Bonus Skills</span>
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {matchData.scores.preferred_skills_score}%
              </div>
              <span className="text-[10px] text-slate-600 block mt-1">15% weighted contribution</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
                <span>Experience Duration</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {matchData.scores.experience_score}%
              </div>
              <span className="text-[10px] text-slate-600 block mt-1">15% weighted contribution</span>
            </div>
          </div>

          {/* Skill Gap Analysis Deep-Dive */}
          <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Skill Gap & Transferable Experience Breakdown
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Detailed comparison of candidate capabilities vs target requisites.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Matched Skills */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matched Skills ({matchData.skill_gap.matched_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchData.skill_gap.matched_skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      {s}
                    </span>
                  ))}
                  {matchData.skill_gap.matched_skills.length === 0 && (
                    <span className="text-xs text-slate-600 italic">No direct core overlaps detected</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <XCircle className="w-4 h-4" />
                  <span>Missing Required Skills ({matchData.skill_gap.missing_required_skills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchData.skill_gap.missing_required_skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    >
                      {s}
                    </span>
                  ))}
                  {matchData.skill_gap.missing_required_skills.length === 0 && (
                    <span className="text-xs text-emerald-600 font-semibold">100% of required skills fulfilled!</span>
                  )}
                </div>
              </div>

              {/* Related Transferrable Skills */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>Adjacent Transferable Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(matchData.skill_gap.related_skills || []).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Learning Suggestions */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Upskilling & Onboarding Recommendations
              </span>
              <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                {matchData.skill_gap.learning_recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Link
                to={`/interview?candidate=${matchData.candidate_id}&job=${matchData.job_id}`}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Generate Tailored Interview Rubric</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
