import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NetworkOptimizer } from './pages/NetworkOptimizer';
import { FpsBooster } from './pages/FpsBooster';
import { GamesLibrary } from './pages/GamesLibrary';
import { VpnManager } from './pages/VpnManager';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { CheckoutSuccess } from './pages/checkout/Success';
import { CheckoutCancel } from './pages/checkout/Cancel';
import { Header } from './components/Header';
import { AuthGuard } from './components/auth/AuthGuard';
import { useMediaQuery } from './hooks/useMediaQuery';
import { PerformanceReport } from './components/analysis/PerformanceReport';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'network':
        return <NetworkOptimizer />;
      case 'fps':
        return <FpsBooster />;
      case 'games':
        return <GamesLibrary />;
      case 'vpn':
        return <VpnManager />;
      case 'settings':
        return <Settings />;
      case 'performance':
        return <PerformanceReport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="/app/*" element={
          <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isOpen={isDesktop || sidebarOpen}
                setIsOpen={setSidebarOpen}
              />
              <div className="flex-1 flex flex-col overflow-hidden relative bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="absolute inset-0 z-0 grid-bg opacity-10"></div>
                <div className="absolute inset-0 z-0 cyberpunk-circuit opacity-5"></div>
                
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 overflow-y-auto p-4">
                  {renderContent()}
                </main>
              </div>
            </div>
          </AuthGuard>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;