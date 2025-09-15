import React from 'react';
import ReactDOM from 'react-dom/client';
import ResultView from './ResultView';
import '../../styles/components.css';
import '../../styles/views.css';
import '../../styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ResultView />
  </React.StrictMode>
);
