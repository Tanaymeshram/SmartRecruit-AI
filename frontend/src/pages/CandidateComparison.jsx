import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GitCompare, Sparkles, CheckCircle2, XCircle, Users, Briefcase } from 'lucide-react';
import api from '../services/api';
import MatchScoreBadge from '../components/MatchScoreBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function CandidateComparison() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedCandIds, setSelectedCandIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [cRes, jRes] = await Promise.all([
          api.get('/candidates'),
          api.get('/jobs')
        ]);
        setCandidates(cRes.data);
        setJobs(jRes.data);
        if (cRes.data.length >= 2) {
          setSelectedCandIds([cRes.data[0].id, cRes.data[1].id]);
        }
      } catch (err) {
        console.error('Failed to load comparison data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleToggleCandidate = (id) => {
    if (selectedCandIds.includes(id)) {
      if (selectedCandIds.length > 2) {
        setSelectedCandIds(selectedCandIds.filter((cid) => cid !== id));
      }
    } else {
      if (selectedCandIds.length < 4) {
        setSelectedCandIds([...selectedCandIds, id]);
      } else {
        alert('You can compare a maximum of 4 candidates simultaneously.');
      }
    }
  };

  const handleRunComparison = async () => {
    if (selectedCandIds.length < 2) return;
    setComparing(true);
    try {
      const res = await api.post('/matching/compare', {
        candidate_ids: selectedCandIds,
        job_id: selectedJob || null
      });
      setComparisonData(res.data);
    } catch (err) {
      alert('Comparison failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    if (selectedCandIds.length >= 2) {
      handleRunComparison();
    }
  }, [selectedCandIds, selectedJob]);

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-primary-600" />
          Side-by-Side Candidate Comparison
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Objective, non-discriminatory multi-candidate evaluation matrix benchmarked against role requirements.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
            1. Select Candidates to Compare (2 to 4)
          </label>
          <div className="flex flex-wrap gap-2">
            {candidates.map((c) => {
              const isSelected = selectedCandIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggleCandidate(c.id)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{c.full_name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({c.total_experience_years}y)</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
            2. Benchmark Against Target Job (Optional)
          </label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full md:w-96 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="">General Comparison (No Job Target)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {comparisonData && (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Target Benchmark: {comparisonData.job_title}
            </span>
            <span className="text-xs text-slate-500">
              {comparisonData.comparison_matrix?.length} Candidates Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold w-40">Attribute</th>
                  {comparisonData.comparison_matrix.map((c) => (
                    <th key={c.candidate_id} className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <Link to={`/candidates/${c.candidate_id}`} className="hover:text-primary-600 underline">
                        {c.candidate_name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Composite Match */}
                {selectedJob && (
                  <tr className="bg-primary-50/20 dark:bg-primary-950/20 font-semibold">
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">Overall Job Match</td>
                    {comparisonData.comparison_matrix.map((c) => (
                      <td key={c.candidate_id} className="py-3.5 px-4">
                        <MatchScoreBadge score={c.match_scores?.overall_match_score} size="md" />
                      </td>
                    ))}
                  </tr>
                )}

                {/* Experience */}
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Total Experience</td>
                  {comparisonData.comparison_matrix.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {c.experience_years} Years
                    </td>
                  ))}
                </tr>

                {/* Matched Required Skills */}
                {selectedJob && (
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Matched Skills</td>
                    {comparisonData.comparison_matrix.map((c) => (
                      <td key={c.candidate_id} className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(c.skill_gap?.matched_skills || []).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}

                {/* Missing Skills */}
                {selectedJob && (
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Missing Core Skills</td>
                    {comparisonData.comparison_matrix.map((c) => (
                      <td key={c.candidate_id} className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(c.skill_gap?.missing_required_skills || []).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              {s}
                            </span>
                          ))}
                          {(!c.skill_gap?.missing_required_skills || c.skill_gap.missing_required_skills.length === 0) && (
                            <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> None
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}

                {/* All Skills */}
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">All Candidate Skills</td>
                  {comparisonData.comparison_matrix.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(c.skills || []).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Projects Count */}
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Verified Projects</td>
                  {comparisonData.comparison_matrix.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-4 font-mono font-medium">
                      {c.projects_count} documented
                    </td>
                  ))}
                </tr>

                {/* Pipeline Status */}
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">Pipeline Stage</td>
                  {comparisonData.comparison_matrix.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-4 capitalize font-semibold">
                      {c.status}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
