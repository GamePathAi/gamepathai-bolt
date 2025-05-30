import React, { useState } from 'react';
import { 
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate
} from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NetworkOptimizer } from './pages/NetworkOptimizer';
import { FpsBooster } from './pages/FpsBooster';
import { GamesLibrary } from './pages/GamesLibrary';
import { VpnManager } from './pages/VpnManager';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Pricing } from './pages/Pricing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { EmailConfirmation } from './pages/auth/EmailConfirmation';
import { ResetPassword } from './pages/auth/ResetPassword';
import { UpdatePassword } from './pages/auth/UpdatePassword';
import { Verification } from './pages/auth/Verification';
import { CheckoutSuccess } from './pages/checkout/Success';
import { CheckoutCancel } from './pages/checkout/Cancel';
import { Header } from './components/Header';
import { AuthGuard } from './components/auth/AuthGuard';
import { useMediaQuery } from './hooks/useMediaQuery';
import PerformanceReport from './components/analysis/PerformanceReport';
import { DownloadPage } from './pages/DownloadPage';
import { SystemMonitoring } from './pages/SystemMonitoring';
import { TrayManager } from './components/TrayManager';

// Providers - IMPORTANTE: Importar todos os providers necessários
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './providers/LanguageProvider';
import { AuthProvider } from './lib/auth/authContext';
import { GameDetectionProvider } from './components/GameDetection/GameDetectionProvider';
import { NetworkProvider } from './contexts/NetworkContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { FpsBoosterProvider } from './contexts/FpsBoosterContext';

// Layout do App com Sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
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
          {children}
        </main>
      </div>
    </div>
  );
};

// Configuração das rotas
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* Rotas públicas */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/download" element={<DownloadPage />} />
      
      {/* Rotas de autenticação */}
      <Route path="/auth">
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="confirm" element={<EmailConfirmation />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="update-password" element={<UpdatePassword />} />
        <Route path="verification" element={<Verification />} />
      </Route>
      
      {/* Rotas de checkout */}
      <Route path="/checkout">
        <Route path="success" element={<CheckoutSuccess />} />
        <Route path="cancel" element={<CheckoutCancel />} />
      </Route>
      
      {/* Rotas protegidas do app */}
      <Route
        path="/app"
        element={
          <AuthGuard>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/app/network"
        element={
          <AuthGuard>
            <AppLayout>
              <NetworkOptimizer />
            </AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/app/fps"
        element={
          <AuthGuard>
            <AppLayout>
              <FpsBooster />
            </AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/app/games"
        element={
          <AuthGuard>
            <AppLayout>
              <GamesLibrary />
            </AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/app/vpn"
        element={
          <AuthGuard>
            <AppLayout>
              <VpnManager />
            </AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/app/performance"
        element={
          <AuthGuard>
            <AppLayout>
              <PerformanceReport />
            </AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/app/system"
        element={
          <AuthGuard>
            <AppLayout>
              <SystemMonitoring />
            </AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/app/settings"
        element={
          <AuthGuard>
            <AppLayout>
              <Settings />
            </AppLayout>
          </AuthGuard>
        }
      />
      
      {/* Rota 404 - redireciona para home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

// Componente principal do App
function App() {
  // Verificar se estamos no ambiente Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Registrar service worker apenas em produção e fora do Electron
  React.useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' && 
      'serviceWorker' in navigator &&
      !window.location.hostname.includes('stackblitz') &&
      !isElectron
    ) {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => {
          console.warn('Service worker registration failed:', error);
        });
    }
  }, [isElectron]);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <GameDetectionProvider>
              <NetworkProvider>
                <FpsBoosterProvider>
                  {/* TrayManager apenas no Electron */}
                  {isElectron && <TrayManager />}
                  
                  {/* Router principal da aplicação */}
                  <RouterProvider router={router} />
                </FpsBoosterProvider>
              </NetworkProvider>
            </GameDetectionProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

// EXPORT DEFAULT - MUITO IMPORTANTE!
export default App;