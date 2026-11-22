import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Briefcase,
  User,
  Mail,
  Phone,
  Code2
} from 'lucide-react';
import api from '../services/api';

export default function ResumeUpload() {
  const [searchParams] = useSearchParams();
  const preselectedJob = searchParams.get('job');
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(preselectedJob || '');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [parsedCandidate, setParsedCandidate] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs');
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to load jobs', err);
      }
    };
    fetchJobs();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (f) => {
    setError('');
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF (.pdf) and Word documents (.docx) are supported.');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB threshold.');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file first.');
      return;
    }

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    if (selectedJob) {
      formData.append('job_id', selectedJob);
    }

    try {
      const res = await api.post('/candidates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setParsedCandidate(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Resume upload or parsing failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Resume Upload & Vector Ingestion
        </h1>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Upload PDF or DOCX candidate resumes. PyMuPDF extracts text, NLP identifies technical skills, and LangChain chunks are indexed in ChromaDB.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!parsedCandidate ? (
        <form onSubmit={handleUpload} className="space-y-6">
          {/* Target Job Selector */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Target Job Opening (Optional)
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">General Talent Pool (No Specific Job Attached)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              dragging
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400'
            }`}
            onClick={() => document.getElementById('resume-file-input').click()}
          >
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 mb-4 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {file ? file.name : 'Choose a file or drag & drop here'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
              Supports PDF and DOCX format up to 15MB. Automated parsing extracts experience, skills, and contact entities.
            </p>
            {file && (
              <span className="mt-3 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready to Process ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Parsing Text & Ingesting Vectors...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse & Ingest Resume</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Extraction Success Preview */
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Resume Successfully Vectorized
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Candidate profile stored and RAG knowledge base chunks indexed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setParsedCandidate(null);
                  setFile(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                Upload Another
              </button>
              <Link
                to={`/candidates/${parsedCandidate.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
              >
                <span>Full Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Profile Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Candidate Name</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-primary-500" />
                {parsedCandidate.full_name}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Contact Information</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 block truncate mt-0.5">
                {parsedCandidate.email || 'Email not detected'}
              </span>
              <span className="text-slate-600 dark:text-slate-400 block text-[11px]">
                {parsedCandidate.phone || 'Phone not detected'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Experience Extracted</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-4 h-4 text-primary-500" />
                {parsedCandidate.total_experience_years} Years
              </span>
            </div>
          </div>

          {/* Extracted Skills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Identified Skills ({parsedCandidate.skills?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(parsedCandidate.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Summary Preview */}
          {parsedCandidate.summary && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Professional Summary Excerpt
              </h4>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{parsedCandidate.summary}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
