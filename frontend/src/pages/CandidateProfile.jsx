import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  BotMessageSquare,
  HelpCircle,
  FileText,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRawResume, setShowRawResume] = useState(false);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await api.get(`/candidates/${id}`);
        setCandidate(res.data);
      } catch (err) {
        console.error('Failed to load candidate', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Delete this candidate and remove their document vectors?')) {
      try {
        await api.delete(`/candidates/${id}`);
        navigate('/candidates');
      } catch (err) {
        alert('Failed to delete candidate');
      }
    }
  };

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (!candidate) {
    return <div className="text-center p-12 text-slate-500">Candidate profile not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/candidates')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidates
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50"
        >
          <Trash2 className="w-4 h-4" /> Delete Profile
        </button>
      </div>

      {/* Header Profile Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {candidate.full_name ? candidate.full_name[0] : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {candidate.full_name}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {candidate.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {candidate.total_experience_years} Years Professional Experience • Vectorized Document
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={`/matching?candidate=${candidate.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Job Match</span>
            </Link>
            <Link
              to={`/interview?candidate=${candidate.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Questions</span>
            </Link>
            <Link
              to={`/rag-resume?candidate=${candidate.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <BotMessageSquare className="w-4 h-4" />
              <span>RAG Chat</span>
            </Link>
          </div>
        </div>

        {/* Contact Links */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          {candidate.email && (
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-primary-500" /> {candidate.email}
            </span>
          )}
          {candidate.phone && (
            <span className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-primary-500" /> {candidate.phone}
            </span>
          )}
          {candidate.location && (
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary-500" /> {candidate.location}
            </span>
          )}
          {candidate.linkedin && (
            <a
              href={candidate.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-medium text-primary-600 hover:underline"
            >
              <Globe className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {candidate.github && (
            <a
              href={candidate.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-medium text-primary-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> GitHub
            </a>
          )}
        </div>

        {/* Summary */}
        {candidate.summary && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Professional Summary
            </h3>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              "{candidate.summary}"
            </p>
          </div>
        )}

        {/* Categorized Skills */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
            Technical & Professional Competencies
          </h3>
          <div className="space-y-3">
            {Object.entries(candidate.skills_by_category || {}).map(([cat, skills]) => (
              <div key={cat} className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {cat}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Timeline */}
        {candidate.experiences?.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">
              Work Experience Timeline
            </h3>
            <div className="space-y-4">
              {candidate.experiences.map((exp, idx) => (
                <div key={idx} className="relative pl-6 pb-4 border-l-2 border-primary-200 dark:border-primary-800 last:pb-0">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary-600" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {exp.title}
                  </h4>
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                    {exp.company} • {exp.duration}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {candidate.projects?.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              Key Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {proj.name}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proj.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(proj.technologies || []).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 text-[10px] rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Education
            </h3>
            <div className="space-y-2">
              {(candidate.educations || []).map((edu, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{edu.degree}</p>
                  <p className="text-slate-600 dark:text-slate-400">{edu.institution} • {edu.year}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Certifications & Honors
            </h3>
            <ul className="text-xs space-y-1 list-disc list-inside text-slate-700 dark:text-slate-300">
              {(candidate.certifications || []).map((cert, idx) => (
                <li key={idx}>{cert}</li>
              ))}
              {(!candidate.certifications || candidate.certifications.length === 0) && (
                <span className="text-slate-600 italic">None documented</span>
              )}
            </ul>
          </div>
        </div>

        {/* Raw Text Toggle */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={() => setShowRawResume(!showRawResume)}
            className="text-xs font-semibold text-primary-600 hover:text-primary-500 inline-flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showRawResume ? 'Hide Raw Resume Text' : 'View Raw Extracted Resume Text'}</span>
          </button>
          {showRawResume && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 text-left font-mono text-[11px] max-h-96 overflow-y-auto whitespace-pre-wrap">
              {candidate.resume_text || 'No raw text stored.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
