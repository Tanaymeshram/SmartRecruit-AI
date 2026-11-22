import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Filter, Sparkles, ArrowUpRight, UploadCloud, CheckCircle2, ChevronRight, User } from 'lucide-react';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } catch (err) {
      console.error('Failed to load candidates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      await api.patch(`/candidates/${candidateId}/status?status=${newStatus}`);
      setCandidates(candidates.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c)));
    } catch (err) {
      alert('Failed to update candidate status');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSkill = !skillFilter || (c.skills || []).some((s) => s.toLowerCase() === skillFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesSkill;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Candidate Profiles
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Access vectorized candidate records, skills breakdown, and pipeline status.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs"
          >
            Compare Candidates
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Resume</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name, email, or skill..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-full md:w-auto"
        >
          <option value="all">All Pipeline Stages</option>
          <option value="new">New</option>
          <option value="screened">Screened</option>
          <option value="interviewing">Interviewing</option>
          <option value="offered">Offered</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Candidates Table */}
      {loading ? (
        <LoadingSkeleton lines={8} />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          description="Upload resumes in PDF or DOCX format to populate your talent database."
          actionLabel="Upload Resume"
          onAction={() => (window.location.href = '/upload')}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-4 font-semibold">Candidate</th>
                  <th className="py-3.5 px-4 font-semibold">Experience</th>
                  <th className="py-3.5 px-4 font-semibold">Core Skills</th>
                  <th className="py-3.5 px-4 font-semibold">Pipeline Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center shrink-0">
                          {cand.full_name ? cand.full_name[0] : 'C'}
                        </div>
                        <div>
                          <Link
                            to={`/candidates/${cand.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-primary-600 block"
                          >
                            {cand.full_name}
                          </Link>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            {cand.email || 'Email not available'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {cand.total_experience_years} Years
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(cand.skills || []).slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                        {(cand.skills || []).length > 4 && (
                          <span className="text-[10px] text-slate-600 font-medium self-center">
                            +{cand.skills.length - 4}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={cand.status}
                        onChange={(e) => handleStatusChange(cand.id, e.target.value)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 capitalize focus:outline-none"
                      >
                        <option value="new">New</option>
                        <option value="screened">Screened</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offered">Offered</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/matching?candidate=${cand.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-500"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Match</span>
                      </Link>
                      <Link
                        to={`/candidates/${cand.id}`}
                        className="inline-flex items-center gap-0.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
