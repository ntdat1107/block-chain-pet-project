import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// ThemeProvider removed — app uses the default soft palette in CSS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
