import React from 'react';
import ReactDOM from 'react-dom/client';
import AnalysisPanel from './AnalysisPanel';
import '../../styles/components.css';
import '../../styles/views.css';
import '../../styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AnalysisPanel />
  </React.StrictMode>
);
