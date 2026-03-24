import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';
import { Outlet } from 'react-router-dom';

import fallbackRender from './error-boundary/fallbackRender';
import FooterComponent from './footer';
import HeaderComponent from './header';
import { PageLoader } from '@/components';

const LayoutComponent = () => {
  return (
    <div className="w-full h-full">
      <HeaderComponent />
      <div className="px-4 py-20 flex flex-col min-h-[calc(100vh-200px)]">
        <ErrorBoundary fallbackRender={fallbackRender}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>
      <FooterComponent />
    </div>
  );
};

export default LayoutComponent;
