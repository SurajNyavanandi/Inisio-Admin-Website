import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { frontendConfig } from './config/env.ts';
import './index.css';
import App from './App.tsx';

if (frontendConfig.apiBaseUrl) {
  axios.defaults.baseURL = frontendConfig.apiBaseUrl;
}

axios.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('inisio_admin_token') : null;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

