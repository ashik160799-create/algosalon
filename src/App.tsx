/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/splash/SplashScreen';
import { AuthModal } from './components/auth/AuthModal';
import { RoleSwitchPinModal } from './components/auth/RoleSwitchPinModal';

// Customer Components
import { CustomerNavbar } from './components/customer/CustomerNavbar';
import { CustomerHome } from './components/customer/CustomerHome';
import { CustomerBottomNav } from './components/customer/CustomerBottomNav';
import { SalonDetailModal } from './components/customer/SalonDetailModal';
import { BookingFlowModal } from './components/customer/BookingFlowModal';
import { CustomerBookingsView } from './components/customer/CustomerBookingsView';
import { CustomerSavedView } from './components/customer/CustomerSavedView';
import { CustomerProfileView } from './components/customer/CustomerProfileView';

// Business Components
import { BusinessNavbar } from './components/business/BusinessNavbar';
import { BusinessOverview } from './components/business/BusinessOverview';
import { BusinessAppointments } from './components/business/BusinessAppointments';
import { BusinessCustomersManager } from './components/business/BusinessCustomersManager';
import { BusinessServicesManager } from './components/business/BusinessServicesManager';
import { BusinessStaffManager } from './components/business/BusinessStaffManager';
import { BusinessHoursManager } from './components/business/BusinessHoursManager';
import { BusinessReviewsManager } from './components/business/BusinessReviewsManager';
import { BusinessProfileManager } from './components/business/BusinessProfileManager';
import { BusinessReports } from './components/business/BusinessReports';
import { BusinessBottomNav } from './components/business/BusinessBottomNav';

const MainAppContent: React.FC = () => {
  const {
    showSplash,
    currentRole,
    activeCustomerTab,
    activeBusinessTab,
    currentThemeConfig,
    colorThemeMode,
    roleSwitchModalOpen,
    roleSwitchTarget,
    roleSwitchAccount,
    closeRoleSwitchModal,
    confirmRoleSwitch,
    setAuthMode,
    setCurrentRole,
    setAuthModalOpen,
  } = useApp();

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
      {currentRole === 'customer' ? <CustomerNavbar /> : <BusinessNavbar />}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 lg:pb-8 min-w-0">
        {currentRole === 'customer' ? (
          <>
            {activeCustomerTab === 'discover' && <CustomerHome />}
            {activeCustomerTab === 'bookings' && <CustomerBookingsView />}
            {activeCustomerTab === 'saved' && <CustomerSavedView />}
            {activeCustomerTab === 'profile' && <CustomerProfileView />}

            <SalonDetailModal />
            <BookingFlowModal />
            <CustomerBottomNav />
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
      </main>

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
            setCurrentRole(roleSwitchTarget);
            setAuthModalOpen(true);
          }}
        />
      )}
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
