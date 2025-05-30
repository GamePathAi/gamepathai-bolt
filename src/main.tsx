import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './lib/auth/authContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './providers/LanguageProvider';
import { GameDetectionProvider } from './components/GameDetection/GameDetectionProvider';
import './i18n';
import App from './App';
import './index.css';
import './utils/initGames';

// Logs para depuração
console.log('main.tsx carregado');
const rootElement = document.getElementById('root');
console.log('Elemento root encontrado:', rootElement);

if (rootElement) {
  try {
    console.log('Tentando renderizar React');
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <GameDetectionProvider>
                <App />
              </GameDetectionProvider>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('React renderizado com sucesso');
  } catch (error) {
    console.error('Erro ao renderizar React:', error);
  }
} else {
  console.error('Elemento root não encontrado no documento');
  // Tenta criar o elemento se não existir
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  console.log('Elemento root criado manualmente');
  
  try {
    createRoot(newRoot).render(
      <StrictMode>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <GameDetectionProvider>
                <App />
              </GameDetectionProvider>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('React renderizado no elemento root criado manualmente');
  } catch (error) {
    console.error('Erro ao renderizar React no elemento criado manualmente:', error);
  }
}