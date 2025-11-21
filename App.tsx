import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateReport from './pages/CreateReport';
import ReportDetail from './pages/ReportDetail';
import MyContributions from './pages/MyContributions';
import { User } from './types';
import { api } from './services/mockService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session (simulated)
    const currentUser = api.getUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
          <Route path="/registro" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/crear-reporte" element={user ? <CreateReport /> : <Navigate to="/login" />} />
          <Route path="/editar-reporte/:id" element={user ? <CreateReport /> : <Navigate to="/login" />} />
          <Route path="/reporte/:id" element={user ? <ReportDetail /> : <Navigate to="/login" />} />
          <Route path="/mis-aportes" element={user ? <MyContributions user={user} /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;