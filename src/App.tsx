/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/splash/SplashScreen';
import { LocationPermissionScreen } from './components/splash/LocationPermissionScreen';

// Customer Components (Immediate)
import { CustomerNavbar } from './components/customer/CustomerNavbar';
import { CustomerHome } from './components/customer/CustomerHome';
import { CustomerBottomNav } from './components/customer/CustomerBottomNav';
import { CustomerBookingsView } from './components/customer/CustomerBookingsView';
import { CustomerSavedView } from './components/customer/CustomerSavedView';
import { CustomerProfileView } from './components/customer/CustomerProfileView';

// Customer Modals (Code-split)
const SalonDetailModal = lazy(() => import('./components/customer/SalonDetailModal').then(m => ({ default: m.SalonDetailModal })));
const BookingFlowModal = lazy(() => import('./components/customer/BookingFlowModal').then(m => ({ default: m.BookingFlowModal })));
const AuthModal = lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));
const RoleSwitchPinModal = lazy(() => import('./components/auth/RoleSwitchPinModal').then(m => ({ default: m.RoleSwitchPinModal })));

// Business Components (Code-split for customer users)
const BusinessNavbar = lazy(() => import('./components/business/BusinessNavbar').then(m => ({ default: m.BusinessNavbar })));
const BusinessOverview = lazy(() => import('./components/business/BusinessOverview').then(m => ({ default: m.BusinessOverview })));
const BusinessAppointments = lazy(() => import('./components/business/BusinessAppointments').then(m => ({ default: m.BusinessAppointments })));
const BusinessCustomersManager = lazy(() => import('./components/business/BusinessCustomersManager').then(m => ({ default: m.BusinessCustomersManager })));
const BusinessServicesManager = lazy(() => import('./components/business/BusinessServicesManager').then(m => ({ default: m.BusinessServicesManager })));
const BusinessStaffManager = lazy(() => import('./components/business/BusinessStaffManager').then(m => ({ default: m.BusinessStaffManager })));
const BusinessHoursManager = lazy(() => import('./components/business/BusinessHoursManager').then(m => ({ default: m.BusinessHoursManager })));
const BusinessReviewsManager = lazy(() => import('./components/business/BusinessReviewsManager').then(m => ({ default: m.BusinessReviewsManager })));
const BusinessProfileManager = lazy(() => import('./components/business/BusinessProfileManager').then(m => ({ default: m.BusinessProfileManager })));
const BusinessReports = lazy(() => import('./components/business/BusinessReports').then(m => ({ default: m.BusinessReports })));
const BusinessBottomNav = lazy(() => import('./components/business/BusinessBottomNav').then(m => ({ default: m.BusinessBottomNav })));

const MainAppContent: React.FC = () => {
  const {
    showSplash,
    currentRole,
    activeCustomerTab,
    activeBusinessTab,
    colorThemeMode,
    roleSwitchModalOpen,
    roleSwitchTarget,
    roleSwitchAccount,
    closeRoleSwitchModal,
    confirmRoleSwitch,
    setAuthMode,
    setCurrentRole,
    setAuthModalOpen,
    setAuthTargetRole,
  } = useApp();

  const [locationPrompted, setLocationPrompted] = useState<boolean>(true);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 ${
        colorThemeMode === 'light' ? 'bg-theme-main text-slate-900' : 'bg-theme-main text-slate-100'
      }`}
      style={{
        backgroundColor: 'var(--canvas-bg)',
      }}
    >
      <Suspense fallback={null}>
        {currentRole === 'customer' ? <CustomerNavbar /> : <BusinessNavbar />}
      </Suspense>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 lg:pb-8 min-w-0">
        <Suspense fallback={null}>
          {currentRole === 'customer' ? (
            <>
              {!locationPrompted ? (
                <div className="w-full min-h-[72vh] flex flex-col items-center justify-center py-6">
                  <LocationPermissionScreen
                    onAllow={() => {
                      setLocationPrompted(true);
                    }}
                    onSkip={() => {
                      setLocationPrompted(true);
                    }}
                    targetRole="customer"
                    actionType="explore"
                  />
                </div>
              ) : (
                <>
                  {activeCustomerTab === 'discover' && <CustomerHome />}
                  {activeCustomerTab === 'bookings' && <CustomerBookingsView />}
                  {activeCustomerTab === 'saved' && <CustomerSavedView />}
                  {activeCustomerTab === 'profile' && <CustomerProfileView />}

                  <SalonDetailModal />
                  <BookingFlowModal />
                  <CustomerBottomNav />
                </>
              )}
            </>
          ) : (
            <>
              {activeBusinessTab === 'overview' && <BusinessOverview />}
              {activeBusinessTab === 'customers' && <BusinessCustomersManager />}
              {activeBusinessTab === 'calendar' && <BusinessAppointments />}
              {activeBusinessTab === 'services' && <BusinessServicesManager />}
              {activeBusinessTab === 'staff' && <BusinessStaffManager />}
              {activeBusinessTab === 'reports' && <BusinessReports />}
              {activeBusinessTab === 'hours' && <BusinessHoursManager />}
              {activeBusinessTab === 'reviews' && <BusinessReviewsManager />}
              {(activeBusinessTab === 'profile' || activeBusinessTab === 'settings') && <BusinessProfileManager />}

              <BusinessBottomNav />
            </>
          )}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <AuthModal />
        {roleSwitchModalOpen && roleSwitchTarget && roleSwitchAccount && (
          <RoleSwitchPinModal
            isOpen={roleSwitchModalOpen}
            targetRole={roleSwitchTarget}
            targetAccount={roleSwitchAccount}
            onClose={closeRoleSwitchModal}
            onSuccess={confirmRoleSwitch}
            onRedirectToAuth={(mode) => {
              closeRoleSwitchModal();
              setAuthMode(mode);
              if (roleSwitchTarget) setAuthTargetRole(roleSwitchTarget);
              setAuthModalOpen(true);
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
