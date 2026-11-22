import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Plus, X } from 'lucide-react';
import api from '../services/api';

export default function CreateJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote',
    job_type: 'Full-time',
    experience_required_years: 3.0,
    education_required: "Bachelor's in Computer Science or related",
    description: '',
    required_skills: ['Python', 'FastAPI', 'Docker'],
    preferred_skills: ['Kubernetes', 'PostgreSQL'],
    status: 'open'
  });

  const [reqSkillInput, setReqSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddReqSkill = () => {
    if (reqSkillInput.trim() && !formData.required_skills.includes(reqSkillInput.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, reqSkillInput.trim()]
      });
      setReqSkillInput('');
    }
  };

  const handleRemoveReqSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter((s) => s !== skillToRemove)
    });
  };

  const handleAddPrefSkill = () => {
    if (prefSkillInput.trim() && !formData.preferred_skills.includes(prefSkillInput.trim())) {
      setFormData({
        ...formData,
        preferred_skills: [...formData.preferred_skills, prefSkillInput.trim()]
      });
      setPrefSkillInput('');
    }
  };

  const handleRemovePrefSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      preferred_skills: formData.preferred_skills.filter((s) => s !== skillToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/jobs', formData);
      navigate(`/jobs/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs
      </button>

      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Job Description
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Specify technical prerequisites, experience parameters, and evaluation criteria for AI matching.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Machine Learning Engineer"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Engineering">Engineering</option>
                <option value="AI Research">AI Research</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Data & Analytics">Data & Analytics</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Remote / San Francisco"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Experience (Years)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                name="experience_required_years"
                value={formData.experience_required_years}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Type
              </label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Education Requirements
            </label>
            <input
              type="text"
              name="education_required"
              value={formData.education_required}
              onChange={handleChange}
              placeholder="Bachelor's in Computer Science or equivalent"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Description & Responsibilities *
            </label>
            <textarea
              name="description"
              required
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Outline mission, key responsibilities, and expected outcomes..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Required Skills Management */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required Mandatory Skills (Weighted 40% in Matching)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={reqSkillInput}
                onChange={(e) => setReqSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddReqSkill())}
                placeholder="Type skill & press Enter or Add (e.g. React, Python)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddReqSkill}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700"
              >
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReqSkill(skill)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preferred Bonus Skills (Weighted 15% in Matching)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={prefSkillInput}
                onChange={(e) => setPrefSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPrefSkill())}
                placeholder="Type bonus skill & press Enter"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddPrefSkill}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.preferred_skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrefSkill(skill)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Job Description'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
