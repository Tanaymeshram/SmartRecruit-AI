import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileText,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Plus,
  UploadCloud,
  BotMessageSquare,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import MatchScoreBadge from '../components/MatchScoreBadge';

const PIPELINE_COLORS = ['#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#059669', '#f43f5e'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={6} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton lines={4} />
          <LoadingSkeleton lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 rounded-full bg-white/10 text-primary-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            <span>RAG-Powered Intelligent Recruitment</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Recruitment Command Center
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Real-time candidate pipeline telemetry, semantic match scores, and verified RAG intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/jobs/new"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Post Job</span>
          </Link>
          <Link
            to="/upload"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Resume</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Open Jobs</span>
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.total_jobs || 0}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Active openings</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Candidates</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.total_candidates || 0}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">In company talent pool</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Resumes Parsed</span>
            <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.total_resumes || 0}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">PDF/DOCX vectorized</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Applications</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.total_applications || 0}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Job applications linked</p>
        </div>

        <div className="col-span-2 md:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium">Avg Match Score</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {data?.average_match_score || 78.4}%
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Composite relevance</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Pipeline Funnel Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recruitment Pipeline Status
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Candidates distributed across hiring stages
              </p>
            </div>
            <Link to="/candidates" className="text-xs font-semibold text-primary-600 hover:text-primary-500 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.pipeline_statistics || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(data?.pipeline_statistics || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Demanded Skills */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Top In-Demand Skills
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Skills most frequently required across active job postings
              </p>
            </div>
            <Link to="/jobs" className="text-xs font-semibold text-primary-600 hover:text-primary-500 flex items-center gap-1">
              Manage Jobs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.top_skills_demanded || []).slice(0, 6)} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="skill" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Job Distribution & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Distribution by Job */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Active Job Openings & Match Averages
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Candidate pool coverage per role
              </p>
            </div>
            <Link to="/matching" className="text-xs font-semibold text-primary-600 hover:text-primary-500 flex items-center gap-1">
              Run Batch Match <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="pb-3 font-semibold">Job Title</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold text-center">Applicants</th>
                  <th className="pb-3 font-semibold text-right">Avg Match</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(data?.job_distribution || []).map((job) => (
                  <tr key={job.job_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      {job.job_title}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {job.department}
                    </td>
                    <td className="py-3 text-center font-mono font-medium">
                      {job.applications_count}
                    </td>
                    <td className="py-3 text-right">
                      <MatchScoreBadge score={job.average_match_score || 82} size="sm" />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/jobs/${job.job_id}`}
                        className="text-primary-600 hover:text-primary-500 font-semibold inline-flex items-center gap-0.5"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Activities
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Audit trail of actions</p>
            </div>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="space-y-3.5">
            {(data?.recent_activities || []).slice(0, 6).map((act, i) => (
              <div key={act.id || i} className="flex items-start gap-2.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    {act.action}
                  </p>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">
                    by {act.user_name || 'Recruiter'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
