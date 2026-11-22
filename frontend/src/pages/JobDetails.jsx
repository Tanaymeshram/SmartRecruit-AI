import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  Sparkles,
  Users,
  Trash2,
  GitCompare,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import MatchScoreBadge from '../components/MatchScoreBadge';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobAndRankings = async () => {
      try {
        const [jobRes, rankRes] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get(`/matching/rankings/${id}`)
        ]);
        setJob(jobRes.data);
        setRankings(rankRes.data);
      } catch (err) {
        console.error('Failed to load job details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobAndRankings();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await api.delete(`/jobs/${id}`);
        navigate('/jobs');
      } catch (err) {
        alert('Failed to delete job');
      }
    }
  };

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (!job) {
    return <div className="text-center p-12 text-slate-500">Job not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <Trash2 className="w-4 h-4" /> Delete Job
        </button>
      </div>

      {/* Main Job Header Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                {job.department}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {job.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {job.title}
            </h1>
          </div>

          <Link
            to={`/matching?job=${job.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Match Studio</span>
          </Link>
        </div>

        {/* Metadata badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Location</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-primary-500" /> {job.location}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Experience Target</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-primary-500" /> {job.experience_required_years}+ Years
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Contract Type</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-primary-500" /> {job.job_type}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Education Degree</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary-500" /> {job.education_required}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Job Scope & Responsibilities
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Required & Preferred Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
              Required Mandatory Skills (40% Weight)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(job.required_skills || []).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
              Preferred Bonus Skills (15% Weight)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(job.preferred_skills || []).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Ranked Candidates for this Job */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              Candidate Merit Rankings
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Ranked dynamically across core skills, semantic similarity, and verified experience.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600">
            {rankings.length} Candidates Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="pb-3 font-semibold">Rank</th>
                <th className="pb-3 font-semibold">Candidate Name</th>
                <th className="pb-3 font-semibold">Experience</th>
                <th className="pb-3 font-semibold">Matched Core Skills</th>
                <th className="pb-3 font-semibold text-right">Composite Score</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rankings.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 font-bold font-mono text-slate-600">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5">
                    <Link
                      to={`/candidates/${item.candidate_id}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-primary-600"
                    >
                      {item.candidate_name}
                    </Link>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      {item.candidate?.email}
                    </p>
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-400">
                    {item.candidate?.total_experience_years} yrs
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(item.skill_gap?.matched_skills || []).slice(0, 3).map((s) => (
                        <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {s}
                        </span>
                      ))}
                      {(item.skill_gap?.missing_required_skills || []).length > 0 && (
                        <span className="text-[10px] text-rose-500 font-medium">
                          ({item.skill_gap.missing_required_skills.length} missing)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 text-right">
                    <MatchScoreBadge score={item.scores?.overall_match_score} />
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      to={`/matching?candidate=${item.candidate_id}&job=${job.id}`}
                      className="font-semibold text-primary-600 hover:text-primary-500 inline-flex items-center gap-1"
                    >
                      Explain <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
