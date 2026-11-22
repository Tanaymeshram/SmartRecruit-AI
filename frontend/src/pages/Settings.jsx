import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Key, Database, Cpu, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [provider, setProvider] = useState('demo');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [demoMode, setDemoMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data);
        setProvider(res.data.llm_provider || 'demo');
        setDemoMode(res.data.demo_mode);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.post('/settings', {
        llm_provider: provider,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        demo_mode: demoMode
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary-600" />
          System & AI Configuration
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Manage AI providers, vector embedding indices, and organization tenant privacy settings.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>System settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* LLM Provider Selection */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary-600" />
            RAG Synthesis & Generation Provider
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Choose which LLM performs candidate grounding and synthesis for RAG queries.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                provider === 'demo'
                  ? 'border-primary-600 bg-primary-50/40 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="provider"
                value="demo"
                checked={provider === 'demo'}
                onChange={() => setProvider('demo')}
                className="hidden"
              />
              <span className="font-bold block text-sm">Deterministic Demo Engine</span>
              <span className="text-[11px] opacity-80 block mt-1">
                Zero API keys required. Strict factual citations extracted directly from vectors.
              </span>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                provider === 'gemini'
                  ? 'border-primary-600 bg-primary-50/40 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="provider"
                value="gemini"
                checked={provider === 'gemini'}
                onChange={() => setProvider('gemini')}
                className="hidden"
              />
              <span className="font-bold block text-sm">Google Gemini 1.5</span>
              <span className="text-[11px] opacity-80 block mt-1">
                Fast, grounded responses with Google DeepMind generative AI.
              </span>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                provider === 'openai'
                  ? 'border-primary-600 bg-primary-50/40 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="provider"
                value="openai"
                checked={provider === 'openai'}
                onChange={() => setProvider('openai')}
                className="hidden"
              />
              <span className="font-bold block text-sm">OpenAI GPT-4o</span>
              <span className="text-[11px] opacity-80 block mt-1">
                Standard OpenAI API integration with guardrail prompts.
              </span>
            </label>
          </div>

          {/* Conditional API Keys */}
          {provider === 'gemini' && (
            <div className="pt-3">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          )}

          {provider === 'openai' && (
            <div className="pt-3">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Database & Embeddings Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-600" />
            Database & Vector Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Primary Database</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                MongoDB Document Model (with Local Storage Resilience)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Vector Database</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                ChromaDB (Cosine Similarity + Hybrid BM25 Fusion)
              </span>
            </div>
          </div>
        </div>

        {/* Company Organization Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Company Data Isolation
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Current Company: <strong className="text-slate-900 dark:text-white">{user?.company_name || 'TechCorp AI Solutions'}</strong> (ID: {user?.company_id})
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            All ChromaDB embeddings, candidate files, and resume text are strictly isolated by company_id to prevent cross-tenant data leaks.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-md shadow-primary-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
