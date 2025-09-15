import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../App';

// ルーティングの単純化：テーブル用エントリは常に App を描画
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
