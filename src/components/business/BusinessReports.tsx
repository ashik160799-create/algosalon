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
    { id: '1', sku: 'SKU-OIL-01', name: 'Argan Beard & Scalp Oil 50ml', stock: 18, price: 65, category: 'Hair Care' },
    { id: '2', sku: 'SKU-POM-02', name: 'Matte Clay High Hold Pomade', stock: 24, price: 45, category: 'Styling' },
    { id: '3', sku: 'SKU-SHP-03', name: 'Keratin Nourish Shampoo 250ml', stock: 12, price: 80, category: 'Care' },
    { id: '4', sku: 'SKU-BLD-04', name: 'Japanese Barber Razor Blades 100pk', stock: 8, price: 110, category: 'Equipment' },
    { id: '5', sku: 'SKU-SER-05', name: 'Royal Scalp Rejuvenating Serum', stock: 5, price: 120, category: 'Care' },
    { id: '6', sku: 'SKU-SPR-06', name: 'Sea Salt Texturizing Spray 150ml', stock: 30, price: 55, category: 'Styling' },
  ]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Hair Care');
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdPrice, setNewProdPrice] = useState(50);

  // Payroll Tab State
  const [settledPayouts, setSettledPayouts] = useState<Record<string, boolean>>({});

  // Financial Calculations
  const filteredAppointments = useMemo(() => {
    return salonAppointments;
  }, [salonAppointments, timeframe]);

  const grossRevenue = useMemo(() => {
    return filteredAppointments
      .filter(a => a.status === 'completed' || a.status === 'confirmed')
      .reduce((acc, curr) => acc + curr.servicePrice, 0);
  }, [filteredAppointments]);

  const vatRate = 0.05;
  const vatAmount = Math.round(grossRevenue * (vatRate / (1 + vatRate)));
  const netRevenue = grossRevenue - vatAmount;
  const staffCommissionEst = Math.round(netRevenue * 0.40);
  const netSalonProfit = netRevenue - staffCommissionEst;

  const totalBookings = filteredAppointments.length;
  const completedBookings = filteredAppointments.filter(a => a.status === 'completed').length;
  const confirmedBookings = filteredAppointments.filter(a => a.status === 'confirmed').length;
  const avgOrderValue = totalBookings > 0 ? Math.round(grossRevenue / totalBookings) : 0;
  const occupancyRate = 84;

  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    salonServices.forEach(s => {
      if (!map.has(s.category)) {
        map.set(s.category, { count: 0, revenue: 0 });
      }
    });

    filteredAppointments.forEach(apt => {
      const srv = salonServices.find(s => s.id === apt.serviceId);
      const cat = srv ? srv.category : 'Haircut';
      const existing = map.get(cat) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += apt.servicePrice;
      map.set(cat, existing);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
        percentage: grossRevenue > 0 ? Math.round((data.revenue / grossRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [salonServices, filteredAppointments, grossRevenue]);

  // Inventory Handlers
  const handleStockChange = (id: string, delta: number) => {
    setInventoryItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedStock = Math.max(0, item.stock + delta);
          return { ...item, stock: updatedStock };
        }
        return item;
      })
    );
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      sku: `SKU-PRD-${Math.floor(10 + Math.random() * 89)}`,
      name: newProdName.trim(),
      category: newProdCategory,
      stock: Number(newProdStock) || 0,
      price: Number(newProdPrice) || 0,
    };

    setInventoryItems(prev => [newItem, ...prev]);
    setNewProdName('');
    setShowAddProductModal(false);
    setExportToast('New product added to inventory!');
    setTimeout(() => setExportToast(null), 3000);
  };

  const filteredInventory = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesCat =
        selectedInventoryCategory === 'all' || item.category === selectedInventoryCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventoryItems, inventorySearch, selectedInventoryCategory]);

  const inventoryCategories = useMemo(() => {
    const cats = Array.from(new Set(inventoryItems.map(i => i.category)));
    return ['all', ...cats];
  }, [inventoryItems]);

  const totalInventoryValue = useMemo(() => {
    return inventoryItems.reduce((acc, item) => acc + item.stock * item.price, 0);
  }, [inventoryItems]);

  const lowStockCount = useMemo(() => {
    return inventoryItems.filter(i => i.stock <= 10).length;
  }, [inventoryItems]);

  // Export CSV
  const handleExportCSV = () => {
    let headers = '';
    let rows = '';
    let fileName = '';

    if (activeSubTab === 'financial') {
      headers = 'Booking ID,Customer Name,Customer Phone,Service,Stylist,Date,Time,Price (AED),Status\n';
      rows = filteredAppointments
        .map(
          a =>
            `"${a.id}","${a.customerName}","${a.customerPhone}","${a.serviceName}","${a.staffName}","${a.date}","${a.timeSlot}","${a.servicePrice}","${a.status}"`
        )
        .join('\n');
      fileName = `ALGO_${salon.name.replace(/\s+/g, '_')}_Financial_Report_${timeframe.toUpperCase()}.csv`;
    } else if (activeSubTab === 'inventory') {
      headers = 'SKU,Product Name,Category,Stock,Price (AED),Total Value (AED)\n';
      rows = inventoryItems
        .map(i => `"${i.sku}","${i.name}","${i.category}","${i.stock}","${i.price}","${i.stock * i.price}"`)
        .join('\n');
      fileName = `ALGO_${salon.name.replace(/\s+/g, '_')}_Inventory_Statement.csv`;
    } else {
      headers = 'Stylist Name,Role,Completed Slots,Gross Revenue (AED),Commission Rate,Net Payout (AED),Status\n';
      rows = salonStaff
        .map(s => {
          const slots = salonAppointments.filter(a => a.staffId === s.id);
          const rev = slots.reduce((acc, curr) => acc + curr.servicePrice, 0);
          const payout = Math.round(rev * 0.4);
          const isPaid = settledPayouts[s.id] ? 'Settled' : 'Pending';
          return `"${s.name}","${s.role}","${slots.length}","${rev}","40%","${payout}","${isPaid}"`;
        })
        .join('\n');
      fileName = `ALGO_${salon.name.replace(/\s+/g, '_')}_Staff_Payroll.csv`;
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`${activeSubTab.toUpperCase()} report exported successfully.`);
    setTimeout(() => setExportToast(null), 3500);
  };

  const togglePayoutSettled = (staffId: string) => {
    setSettledPayouts(prev => ({
      ...prev,
      [staffId]: !prev[staffId],
    }));
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-in fade-in duration-200">
      {exportToast && (
        <div className="fixed top-[58px] sm:top-[68px] left-3 sm:left-auto right-3 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600/95 backdrop-blur-md text-white text-xs font-bold shadow-xl border border-emerald-500/40 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{exportToast}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Financial & Business Reports
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Centralized hub for financial statements, inventory stock management, and staff payrolls.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className={`self-start md:self-auto flex items-center gap-1.5 px-4 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-95 shadow-sm ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5" style={{ color: currentThemeConfig.primaryHex }} />
          <span>Export {activeSubTab === 'financial' ? 'Financial' : activeSubTab === 'inventory' ? 'Inventory' : 'Payroll'} CSV</span>
        </button>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div
        className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto ${
          isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('financial')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'financial'
              ? 'text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          style={{
            backgroundColor: activeSubTab === 'financial' ? currentThemeConfig.primaryHex : undefined,
          }}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial & Tax</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('inventory')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          style={{
            backgroundColor: activeSubTab === 'inventory' ? currentThemeConfig.primaryHex : undefined,
          }}
        >
          <Box className="w-4 h-4" />
          <span>Inventory & Stock ({inventoryItems.length})</span>
          {lowStockCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('payroll')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'payroll'
              ? 'text-white shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          style={{
            backgroundColor: activeSubTab === 'payroll' ? currentThemeConfig.primaryHex : undefined,
          }}
        >
          <CreditCard className="w-4 h-4" />
          <span>Staff Payroll ({salonStaff.length})</span>
        </button>
      </div>

      {/* ----------------- SUB-TAB 1: FINANCIAL & TAX REPORTS ----------------- */}
      {activeSubTab === 'financial' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Financial Performance & Tax Settlement
            </h2>

            {/* Timeframe Selector */}
            <div
              className={`flex items-center p-1 rounded-2xl border text-xs font-bold ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              {(['today', 'week', 'month', 'year', 'all'] as const).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'text-white shadow-xs font-extrabold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={{
                    backgroundColor: timeframe === tf ? currentThemeConfig.primaryHex : undefined,
                  }}
                >
                  {tf === 'all' ? 'All Time' : tf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              className={`p-4 sm:p-5 rounded-3xl border relative overflow-hidden transition-all ${
                isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Gross Revenue
                </span>
                <span className="flex items-center text-[11px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +18.4%
                </span>
              </div>
              <div className="mt-2">
                <div className={`text-2xl sm:text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currency} {grossRevenue.toLocaleString()}
                </div>
                <p className={`text-[11px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Total service billing ({timeframe})
                </p>
              </div>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-3xl border relative overflow-hidden transition-all ${
                isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Net Salon Profit
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">
                  Post VAT & Payouts
                </span>
              </div>
              <div className="mt-2">
                <div
                  className="text-2xl sm:text-3xl font-black font-mono"
                  style={{ color: currentThemeConfig.primaryHex }}
                >
                  {currency} {netSalonProfit.toLocaleString()}
                </div>
                <p className={`text-[11px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  VAT: {currency} {vatAmount} • Staff: {currency} {staffCommissionEst}
                </p>
              </div>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-3xl border relative overflow-hidden transition-all ${
                isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Bookings Volume
                </span>
                <span className="flex items-center text-[11px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                  {confirmedBookings} active
                </span>
              </div>
              <div className="mt-2">
                <div className={`text-2xl sm:text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {totalBookings}
                </div>
                <p className={`text-[11px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {completedBookings} completed appointments
                </p>
              </div>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-3xl border relative overflow-hidden transition-all ${
                isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Avg Order Value
                </span>
                <span className="text-[11px] font-bold text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                  {occupancyRate}% occupancy
                </span>
              </div>
              <div className="mt-2">
                <div className={`text-2xl sm:text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currency} {avgOrderValue}
                </div>
                <p className={`text-[11px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Per customer booking basket
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div
              className={`lg:col-span-2 p-5 rounded-3xl border ${
                isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Revenue by Service Category
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Breakdown of top generating treatment lines
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Scissors className="w-4 h-4" />
                  <span>{salonServices.length} Services</span>
                </div>
              </div>

              <div className="space-y-3.5">
                {categoryStats.map((cat, idx) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                          {idx + 1}
                        </span>
                        <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({cat.count} bookings)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                          {currency} {cat.revenue.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(cat.percentage, 4)}%`,
                          backgroundColor: idx === 0 ? currentThemeConfig.primaryHex : `${currentThemeConfig.primaryHex}80`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`p-5 rounded-3xl border flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Tax & Payment Settlement
                  </h2>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Gross Sales</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{currency} {grossRevenue}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Tax Base (Net)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{currency} {netRevenue}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-rose-500 font-bold">
                    <span>VAT 5% (Federal Tax)</span>
                    <span className="font-mono">-{currency} {vatAmount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-indigo-400 font-bold">
                    <span>Staff Commission Pool</span>
                    <span className="font-mono">-{currency} {staffCommissionEst}</span>
                  </div>
                  <div className="flex justify-between py-2 text-emerald-500 font-extrabold text-sm">
                    <span>Net Disbursed to Salon</span>
                    <span className="font-mono">{currency} {netSalonProfit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 2: INVENTORY & SUPPLIES MANAGEMENT ----------------- */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Inventory Overview Stat Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold">Total Products</p>
                <p className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {inventoryItems.length} Items
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold">Total Inventory Valuation</p>
                <p className={`text-lg font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currency} {totalInventoryValue.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  lowStockCount > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold">Low Stock Warning</p>
                <p
                  className={`text-lg font-black ${
                    lowStockCount > 0 ? 'text-amber-500 animate-pulse' : isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {lowStockCount} Products Low
                </p>
              </div>
            </div>
          </div>

          {/* Search, Filter & Add Product Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div
                className={`flex-1 flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search inventory by name or SKU..."
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter Pills */}
              <div
                className={`flex items-center p-1 rounded-2xl border text-xs font-bold ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                {inventoryCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedInventoryCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl capitalize transition-all text-[11px] cursor-pointer ${
                      selectedInventoryCategory === cat
                        ? 'text-white shadow-xs font-black'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      backgroundColor: selectedInventoryCategory === cat ? currentThemeConfig.primaryHex : undefined,
                    }}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredInventory.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.sku}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">{item.category}</span>
                    </div>
                    <h3 className={`text-sm font-bold mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      item.stock <= 10
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}
                  >
                    {item.stock <= 10 ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Unit Price</span>
                    <p className="text-sm font-black font-mono text-emerald-500">
                      {currency} {item.price}
                    </p>
                  </div>

                  {/* Stock Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 mr-1">Qty:</span>
                    <button
                      type="button"
                      onClick={() => handleStockChange(item.id, -1)}
                      className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold active:scale-90 transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                      {item.stock}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStockChange(item.id, 1)}
                      className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold active:scale-90 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Product Modal */}
          {showAddProductModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setShowAddProductModal(false)}
            >
              <div
                className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 my-auto ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Add New Product
                  </h3>
                  <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="py-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Scalp Nourishing Tonic 100ml"
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      className={`w-full p-3 rounded-xl border outline-none font-semibold ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={e => setNewProdCategory(e.target.value)}
                      className={`w-full p-3 rounded-xl border outline-none font-semibold ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    >
                      <option value="Hair Care">Hair Care</option>
                      <option value="Styling">Styling</option>
                      <option value="Care">Care</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Supplies">Supplies</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Initial Stock</label>
                      <input
                        type="number"
                        min={0}
                        value={newProdStock}
                        onChange={e => setNewProdStock(Number(e.target.value))}
                        className={`w-full p-3 rounded-xl border outline-none font-mono font-semibold ${
                          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Price ({currency})</label>
                      <input
                        type="number"
                        min={0}
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(Number(e.target.value))}
                        className={`w-full p-3 rounded-xl border outline-none font-mono font-semibold ${
                          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow transition-all active:scale-95"
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
      )}

      {/* ----------------- SUB-TAB 3: STAFF PAYROLL & COMMISSION ----------------- */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold">Total Staff Payroll Pool</p>
                <p className="text-lg font-black font-mono text-purple-500">
                  {currency} {staffCommissionEst.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold">Commission Standard Rate</p>
                <p className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  40% Gross Revenue
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold">Completed Slots Served</p>
                <p className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {completedBookings} Completed
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Staff Payroll & Commission Statements
              </h2>
              <span className="text-xs text-slate-400 font-bold">{salonStaff.length} Active Stylists</span>
            </div>

            <div className="space-y-3">
              {salonStaff.map(staff => {
                const staffBookings = salonAppointments.filter(
                  a => a.staffId === staff.id && (a.status === 'completed' || a.status === 'confirmed')
                );
                const grossGen = staffBookings.reduce((acc, curr) => acc + curr.servicePrice, 0);
                const commissionPayout = Math.round(grossGen * 0.40);
                const isSettled = !!settledPayouts[staff.id];

                return (
                  <div
                    key={staff.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StaffAvatar name={staff.name} photoUrl={staff.photoUrl} size="md" />
                      <div>
                        <h3 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {staff.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold">
                          {staff.role} • {staffBookings.length} completed slots
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Gross Revenue
                        </span>
                        <p className={`text-xs font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {currency} {grossGen.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          40% Payout
                        </span>
                        <p className="text-sm font-mono font-extrabold text-emerald-500">
                          {currency} {commissionPayout.toLocaleString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePayoutSettled(staff.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          isSettled
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                            : isLight
                            ? 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                        }`}
                      >
                        {isSettled ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Paid</span>
                          </>
                        ) : (
                          <span>Mark Settled</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
