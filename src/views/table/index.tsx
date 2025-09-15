import React from 'react';
import ReactDOM from 'react-dom/client';

import '../../styles/components.css';
import '../../styles/views.css';
import '../../styles/globals.css';
import TableView from './TableView';

// ルーティングの単純化：テーブル用エントリは常に App を描画
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <main className="container">
      <TableView />
    </main>
  </React.StrictMode>
);
