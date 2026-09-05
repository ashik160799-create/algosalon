import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffAvatar } from '../common/StaffAvatar';
import {
  TrendingUp,
  Scissors,
  Download,
  ShieldCheck,
  CheckCircle2,
  Box,
  CreditCard,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  BarChart3,
  Check,
  Package,
  Layers,
  X,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  price: number;
  category: string;
}

export const BusinessReports: React.FC = () => {
  const {
    businessUser,
    salons,
    services,
    staffMembers,
    appointments,
    currentThemeConfig,
    colorThemeMode,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const salonAppointments = appointments.filter(a => a.salonId === salon.id);
  const salonServices = services.filter(s => s.salonId === salon.id);
  const salonStaff = staffMembers.filter(s => s.salonId === salon.id);

  // Sub-Tab State: 'financial' | 'inventory' | 'payroll'
  const [activeSubTab, setActiveSubTab] = useState<'financial' | 'inventory' | 'payroll'>('financial');

  // Financial Tab State
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [currency] = useState<'AED' | 'USD' | 'SAR' | 'EUR'>('AED');
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Inventory Tab State
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('all');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { id: 'inv-1', sku: 'SKU-POM-01', name: 'Matte Finish Pomade 100ml', stock: 24, price: 85, category: 'Hair Styling' },
    { id: 'inv-2', sku: 'SKU-OIL-02', name: 'Argan Beard Oil 50ml', stock: 12, price: 65, category: 'Beard Care' },
    { id: 'inv-3', sku: 'SKU-SHP-03', name: 'Clarifying Tea Tree Shampoo 250ml', stock: 8, price: 95, category: 'Hair Care' },
    { id: 'inv-4', sku: 'SKU-CLP-04', name: 'Replacement Clipper Blades #000', stock: 4, price: 140, category: 'Equipment' },
    { id: 'inv-5', sku: 'SKU-COL-05', name: 'Ash Blonde Bleach Powder 500g', stock: 18, price: 120, category: 'Coloring' },
    { id: 'inv-6', sku: 'SKU-WAX-06', name: 'Hot Film Wax Beads 1kg', stock: 6, price: 110, category: 'Spa & Wax' },
  ]);

  const [addInventoryModalOpen, setAddInventoryModalOpen] = useState(false);
  const [newInvName, setNewInvName] = useState('');
  const [newInvSku, setNewInvSku] = useState('');
  const [newInvCategory, setNewInvCategory] = useState('Hair Care');
  const [newInvStock, setNewInvStock] = useState(10);
  const [newInvPrice, setNewInvPrice] = useState(50);

  // Payroll / Stylist Commission State
  const [payrollTimeframe, setPayrollTimeframe] = useState<'current_month' | 'last_month' | 'ytd'>('current_month');

  // Completed Appointments for Revenue Calculation
  const completedAppointments = useMemo(() => {
    return salonAppointments.filter(a => a.status === 'completed');
  }, [salonAppointments]);

  // Financial Stats Calculation
  const stats = useMemo(() => {
    const grossRevenue = completedAppointments.reduce((sum, a) => sum + (a.price || 0), 0);
    const totalBookings = salonAppointments.length;
    const completedCount = completedAppointments.length;
    const cancelledCount = salonAppointments.filter(a => a.status === 'cancelled').length;
    const avgTicket = completedCount > 0 ? Math.round(grossRevenue / completedCount) : 0;

    // Commission payout estimates (averaging 40%)
    const estimatedPayroll = Math.round(grossRevenue * 0.4);
    const estimatedNetProfit = grossRevenue - estimatedPayroll;

    return {
      grossRevenue,
      totalBookings,
      completedCount,
      cancelledCount,
      avgTicket,
      estimatedPayroll,
      estimatedNetProfit,
    };
  }, [salonAppointments, completedAppointments]);

  // Service Performance Breakdown
  const serviceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    completedAppointments.forEach(appt => {
      const sName = appt.serviceName || 'Standard Cut';
      if (!map[sName]) {
        map[sName] = { count: 0, revenue: 0 };
      }
      map[sName].count += 1;
      map[sName].revenue += appt.price || 0;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
    }));
  }, [completedAppointments]);

  // Stylist Commission Breakdown
  const stylistPayrollData = useMemo(() => {
    return salonStaff.map(staff => {
      const staffAppts = completedAppointments.filter(a => a.staffId === staff.id || a.staffName === staff.name);
      const staffGross = staffAppts.reduce((sum, a) => sum + (a.price || 0), 0);
      const splitRate = staff.commissionRate || 40;
      const commissionEarned = Math.round((staffGross * splitRate) / 100);

      return {
        id: staff.id,
        name: staff.name,
        role: staff.roleTitle || 'Stylist',
        avatar: staff.avatar,
        appointmentsCount: staffAppts.length,
        grossGenerated: staffGross,
        splitRate,
        commissionEarned,
      };
    });
  }, [salonStaff, completedAppointments]);

  const handleStockAdjust = (id: string, delta: number) => {
    setInventoryItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, stock: Math.max(0, item.stock + delta) };
        }
        return item;
      })
    );
  };

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: newInvSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      name: newInvName.trim(),
      category: newInvCategory,
      stock: Number(newInvStock) || 0,
      price: Number(newInvPrice) || 0,
    };

    setInventoryItems(prev => [newItem, ...prev]);
    setNewInvName('');
    setNewInvSku('');
    setNewInvStock(10);
    setNewInvPrice(50);
    setAddInventoryModalOpen(false);
  };

  const handleExportCsv = (reportName: string) => {
    setExportToast(`Generating & Exporting ${reportName} CSV...`);
    setTimeout(() => {
      setExportToast(`${reportName} CSV downloaded successfully.`);
      setTimeout(() => setExportToast(null), 3000);
    }, 800);
  };

  const filteredInventory = inventoryItems.filter(item => {
    const matchSearch =
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchCat = selectedInventoryCategory === 'all' || item.category === selectedInventoryCategory;
    return matchSearch && matchCat;
  });

  return (
    <div id="business-reports-root" className="space-y-6">
      {/* Header Banner & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Financial & Business Reports</h2>
          <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Audit revenue, inventory stocks, commission payroll, and export tax summaries
          </p>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={() => handleExportCsv(activeSubTab.toUpperCase())}
          className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-2 self-start sm:self-auto active:scale-95"
          style={{ backgroundColor: currentThemeConfig.primaryHex }}
        >
          <Download className="w-4 h-4" />
          <span>Export Summary CSV</span>
        </button>
      </div>

      {/* Export Toast Banner */}
      {exportToast && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportToast}</span>
        </div>
      )}

      {/* Sub-Tabs Switcher */}
      <div
        className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto no-scrollbar ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('financial')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'financial'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <span>Financials & Revenue</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'inventory'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Box className="w-4 h-4 text-blue-500" />
          <span>Product Inventory & Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'payroll'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-500" />
          <span>Stylist Commission Payroll</span>
        </button>
      </div>

      {/* SUB-TAB 1: FINANCIALS */}
      {activeSubTab === 'financial' && (
        <div className="space-y-6">
          {/* Timeframe Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(['today', 'week', 'month', 'year', 'all'] as const).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                    timeframe === tf
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : isLight
                      ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                  }`}
                  style={timeframe === tf ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
                >
                  {tf === 'today' ? 'Today' : tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : tf === 'year' ? 'This Year' : 'All Time'}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-400">Currency: {currency}</span>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-4 sm:p-5 rounded-3xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                <span>GROSS REVENUE</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {currency} {stats.grossRevenue.toLocaleString()}
              </h3>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                From {stats.completedCount} completed appointments
              </p>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-3xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                <span>ESTIMATED NET (60%)</span>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                {currency} {stats.estimatedNetProfit.toLocaleString()}
              </h3>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                After 40% stylist commissions
              </p>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-3xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                <span>AVERAGE TICKET</span>
                <Scissors className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                {currency} {stats.avgTicket.toLocaleString()}
              </h3>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Per customer checkout
              </p>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-3xl border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                <span>TOTAL BOOKINGS</span>
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                {stats.totalBookings}
              </h3>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {stats.cancelledCount} cancelled / declined
              </p>
            </div>
          </div>

          {/* Service Revenue Ranking Table */}
          <div
            className={`rounded-3xl border p-4 sm:p-6 space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold">Revenue by Service Treatment</h3>
              <span className="text-xs text-slate-400">{serviceBreakdown.length} Services Ranked</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b ${isLight ? 'border-slate-100 text-slate-400' : 'border-slate-800 text-slate-500'}`}>
                    <th className="pb-3 font-semibold">Service Name</th>
                    <th className="pb-3 font-semibold">Completed Bookings</th>
                    <th className="pb-3 font-semibold">Revenue Share</th>
                    <th className="pb-3 font-semibold text-right">Total Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {serviceBreakdown.map((item, idx) => {
                    const pct = stats.grossRevenue > 0 ? Math.round((item.revenue / stats.grossRevenue) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-bold">{item.name}</td>
                        <td className="py-3 text-slate-500">{item.count} sessions</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2 max-w-xs">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: currentThemeConfig.primaryHex }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                          {currency} {item.revenue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  {serviceBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No completed appointments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INVENTORY */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Inventory Search */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border flex-1 max-w-md ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
                placeholder="Search product name or SKU..."
                className="w-full bg-transparent text-xs focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Add Product Button */}
            <button
              type="button"
              onClick={() => setAddInventoryModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-2 self-start sm:self-auto active:scale-95"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </button>
          </div>

          {/* Inventory Table Card */}
          <div
            className={`rounded-3xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold">Salon Products & Retail Catalog</h3>
              <span className="text-xs text-slate-400">{filteredInventory.length} Items Listed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b ${isLight ? 'border-slate-100 bg-slate-50 text-slate-500' : 'border-slate-800 bg-slate-950/60 text-slate-400'}`}>
                    <th className="p-3.5 font-semibold">SKU</th>
                    <th className="p-3.5 font-semibold">Product Name</th>
                    <th className="p-3.5 font-semibold">Category</th>
                    <th className="p-3.5 font-semibold">Unit Price</th>
                    <th className="p-3.5 font-semibold">Stock Status</th>
                    <th className="p-3.5 font-semibold text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredInventory.map(item => {
                    const isLowStock = item.stock <= 5;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono text-slate-400">{item.sku}</td>
                        <td className="p-3.5 font-bold">{item.name}</td>
                        <td className="p-3.5 text-slate-500">{item.category}</td>
                        <td className="p-3.5 font-mono font-bold">AED {item.price}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isLowStock
                                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                            <span>{item.stock} in stock {isLowStock ? '(Low)' : ''}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(item.id, -1)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="Decrease stock"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold w-6 text-center">{item.stock}</span>
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(item.id, 1)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="Increase stock"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PAYROLL / STYLIST COMMISSIONS */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm sm:text-base font-bold">Stylist Earnings & Commissions</h3>
            </div>

            <div className="flex items-center gap-1.5">
              {(['current_month', 'last_month', 'ytd'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPayrollTimeframe(p)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all border ${
                    payrollTimeframe === p
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : isLight
                      ? 'bg-white text-slate-600 border-slate-200'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                  style={payrollTimeframe === p ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
                >
                  {p === 'current_month' ? 'Current Month' : p === 'last_month' ? 'Last Month' : 'YTD'}
                </button>
              ))}
            </div>
          </div>

          {/* Stylist Commission Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stylistPayrollData.map(st => (
              <div
                key={st.id}
                className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <StaffAvatar avatarUrl={st.avatar} name={st.name} size="md" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate">{st.name}</h4>
                      <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {st.role} • {st.splitRate}% Commission Split
                      </p>
                    </div>
                  </div>

                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Completed Sessions</span>
                      <span className="font-bold">{st.appointmentsCount} bookings</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Gross Revenue Produced</span>
                      <span className="font-mono font-bold">AED {st.grossGenerated.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-600 dark:text-slate-300">Net Commission Payout</span>
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        AED {st.commissionEarned.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportCsv(`PAYROLL_${st.name.replace(/\s+/g, '_')}`)}
                  className="w-full mt-2 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Payslip</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
      {addInventoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setAddInventoryModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 animate-slideUp ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold">Add Product Inventory</h3>
              <button
                type="button"
                onClick={() => setAddInventoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInventory} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newInvName}
                  onChange={e => setNewInvName(e.target.value)}
                  placeholder="e.g. Keratin Serum 100ml"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={newInvSku}
                    onChange={e => setNewInvSku(e.target.value)}
                    placeholder="SKU-KER-01"
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Category</label>
                  <select
                    value={newInvCategory}
                    onChange={e => setNewInvCategory(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Hair Styling">Hair Styling</option>
                    <option value="Beard Care">Beard Care</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Coloring">Coloring</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Spa & Wax">Spa & Wax</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={newInvStock}
                    onChange={e => setNewInvStock(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Price (AED)</label>
                  <input
                    type="number"
                    min={0}
                    value={newInvPrice}
                    onChange={e => setNewInvPrice(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:border-primary ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddInventoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
