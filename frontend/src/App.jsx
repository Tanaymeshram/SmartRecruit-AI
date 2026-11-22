import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import JobDetails from './pages/JobDetails';
import ResumeUpload from './pages/ResumeUpload';
import Candidates from './pages/Candidates';
import CandidateProfile from './pages/CandidateProfile';
import CandidateComparison from './pages/CandidateComparison';
import AIMatchingResults from './pages/AIMatchingResults';
import RagResumeAssistant from './pages/RagResumeAssistant';
import RagKnowledgeAssistant from './pages/RagKnowledgeAssistant';
import InterviewGenerator from './pages/InterviewGenerator';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/new" element={<CreateJob />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="upload" element={<ResumeUpload />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="candidates/:id" element={<CandidateProfile />} />
            <Route path="compare" element={<CandidateComparison />} />
            <Route path="matching" element={<AIMatchingResults />} />
            <Route path="rag-resume" element={<RagResumeAssistant />} />
            <Route path="rag-knowledge" element={<RagKnowledgeAssistant />} />
            <Route path="interview" element={<InterviewGenerator />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
