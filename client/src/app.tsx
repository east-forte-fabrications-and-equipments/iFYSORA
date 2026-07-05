import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Shared/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
import MeasurementCapture from './components/Measurements/CaptureWizard';
import MeasurementHistory from './components/Measurements/HistoryList';
import MeasurementDetails from './components/Measurements/ResultsDisplay';
import OrganizationDashboard from './components/Organizations/OrgDashboard';
import EcosystemNotice from './components/Shared/EcosystemNotice';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Toaster position="top-right" />
          <EcosystemNotice />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/measure/capture" element={<MeasurementCapture />} />
            <Route path="/measure/history" element={<MeasurementHistory />} />
            <Route path="/measure/:id" element={<MeasurementDetails />} />
            <Route path="/organization" element={<OrganizationDashboard />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
