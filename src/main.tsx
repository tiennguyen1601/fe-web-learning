import React from 'react';

import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';

import './index.css';
import QueryProvider from './provider/query-provider.tsx';
import LayoutConfigProvider from './provider/theme-config-provider.tsx';
import Routes from './routes/index.tsx';
import { ToasterConfig } from '@/components';

const googleClientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const app = (
  <LayoutConfigProvider>
    <QueryProvider>
      <ToasterConfig />
      <Routes />
    </QueryProvider>
  </LayoutConfigProvider>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    ) : app}
  </React.StrictMode>,
);
