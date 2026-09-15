import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider } from './context/AppStateContext';

import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { CitizenUpload } from './pages/citizen/CitizenUpload';
import { CitizenDocuments } from './pages/citizen/CitizenDocuments';
import { CitizenExtraction } from './pages/citizen/CitizenExtraction';
import { CitizenAnalysis } from './pages/citizen/CitizenAnalysis';
import { CitizenEvidence } from './pages/citizen/CitizenEvidence';
import { CitizenMyLand } from './pages/citizen/CitizenMyLand';
import { CitizenLandDetail } from './pages/citizen/CitizenLandDetail';
import { AuthorityDashboard } from './pages/authority/AuthorityDashboard';
import { AuthorityDocumentRepository } from './pages/authority/AuthorityDocumentRepository';
import { AuthorityCases } from './pages/authority/AuthorityCases';
import { AuthorityCaseDetail } from './pages/authority/AuthorityCaseDetail';
import { AuthorityGISView } from './pages/authority/AuthorityGISView';
import { AuthorityAccessRequests } from './pages/authority/AuthorityAccessRequests';

export const App: React.FC = () => {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Citizen Portal Routes */}
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/citizen/land" element={<CitizenMyLand />} />
          <Route path="/citizen/land/:id" element={<CitizenLandDetail />} />
          <Route path="/citizen/upload" element={<CitizenUpload />} />
          <Route path="/citizen/documents" element={<CitizenDocuments />} />
          <Route path="/citizen/documents/:id/extraction" element={<CitizenExtraction />} />
          <Route path="/citizen/analysis" element={<CitizenAnalysis />} />
          <Route path="/citizen/evidence" element={<CitizenEvidence />} />

          {/* Authority Portal Routes */}
          <Route path="/authority" element={<AuthorityDashboard />} />
          <Route path="/authority/documents" element={<AuthorityDocumentRepository />} />
          <Route path="/authority/cases" element={<AuthorityCases />} />
          <Route path="/authority/cases/:id" element={<AuthorityCaseDetail />} />
          <Route path="/authority/gis" element={<AuthorityGISView />} />
          <Route path="/authority/access-requests" element={<AuthorityAccessRequests />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
};

export default App;
