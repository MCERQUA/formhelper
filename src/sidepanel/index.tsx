import React from 'react';
import ReactDOM from 'react-dom/client';
import SidePanel from './SidePanel';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SidePanel />
    </React.StrictMode>
  );
}
