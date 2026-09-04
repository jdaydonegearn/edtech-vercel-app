import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runFirestoreDiagnostics } from './lib/diagnostics.ts';

// Auto-run Firestore diagnostics to verify connection and schema in the console
runFirestoreDiagnostics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
