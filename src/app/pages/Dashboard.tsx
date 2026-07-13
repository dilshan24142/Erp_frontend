import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DollarSign, ShoppingCart, Package, Users, Factory,
  Clock, ArrowUpRight, ArrowDownRight, TrendingDown, TrendingUp,
  Boxes, FolderKanban, UserCircle, FileBox, Settings,
  ChevronRight, Activity, BarChart2, Truck, Receipt,
  AlertCircle, RefreshCw, Zap,
} from 'lucide-react';
import dashboardService, { type DashboardSummary } from '@/services/dashboardService';
import { useAuth } from '@/context/AuthContext';

// LKR formatting
const lkr = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;
const lkrFull = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Good Morning';
  if (h < 15) return 'Good Afternoon';
  if (h < 18) return 'Good Evening';
  return 'Good Night';
};

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-1 h-4 bg-blue-600 rounded-full" />
      <span className="text-gray-400">{icon}</span>
      <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">{title}</h2>
    </div>
  );
}

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = (user as any)?.name ?? (user as any)?.username ?? 'User';

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowStr, setNowStr] = useState('');

  // Live clock
  useEffect(() => {
    const tick = () => setNowStr(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const load = (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    dashboardService.getSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  // ── Derived data ─────────────────────────────────────────────────
  const recentOrders = summary?.recentSalesOrders ?? [];
  const recentPO     = summary?.recentPurchaseOrders ?? [];

  const soRevenue = recentOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const poSpend   = recentPO.reduce((s, p) => s + (p.total ?? 0), 0);
  const netFlow   = soRevenue - poSpend;

  const soStatusGroups = recentOrders.reduce<Record<string, number>>((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {});
  const poStatusGroups = recentPO.reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {});
  const soTotal = recentOrders.length || 1;
  const poTotal = recentPO.length || 1;

  // Pending alerts
  const pendingSO = soStatusGroups['Pending'] ?? 0;
  const draftSO   = soStatusGroups['Draft'] ?? 0;
  const draftPO   = poStatusGroups['Draft'] ?? 0;
  const hasAlerts = pendingSO > 0 || draftSO > 0 || draftPO > 0;

  // Activity feed
  type FeedItem = { id: string; label: string; sub: string; status: string; date?: string; type: 'so' | 'po' };
  const feed: FeedItem[] = [
    ...recentOrders.map(o => ({ id: `so-${o.id}`, label: o.orderNumber, sub: o.customer?.companyName ?? '-', status: o.status, date: o.date, type: 'so' as const })),
    ...recentPO.map(p => ({ id: `po-${p.id}`, label: p.poNumber, sub: p.vendor?.companyName ?? '-', status: p.status, date: p.date, type: 'po' as const })),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 10);

  // ── KPI cards ─────────────────────────────────────────────────────
  const stats = summary ? [
    { label: 'Sales Orders',     value: summary.totalSalesOrders,    sub: `${summary.totalCustomers} customers`, icon: <ShoppingCart className="w-5 h-5" />, accent: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-l-blue-500',   path: '/sales/orders' },
    { label: 'Purchase Orders',  value: summary.totalPurchaseOrders, sub: `${summary.totalVendors} vendors`,      icon: <Package className="w-5 h-5" />,      accent: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-l-violet-500', path: '/purchasing/orders' },
    { label: 'Active Employees', value: summary.activeEmployees,     sub: `${summary.totalEmployees} registered`, icon: <Users className="w-5 h-5" />,         accent: 'bg-teal-600',   light: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-l-teal-500',   path: '/hr/employees' },
    { label: 'Total Products',   value: summary.totalProducts,       sub: 'products available',                  icon: <Boxes className="w-5 h-5" />,         accent: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-l-orange-500', path: '/inventory/products' },
    { label: 'Total Customers',  value: summary.totalCustomers,      sub: 'active customers',                    icon: <UserCircle className="w-5 h-5" />,    accent: 'bg-pink-500',   light: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-l-pink-500',   path: '/sales/customers' },
    { label: 'Total Projects',   value: summary.totalProjects,       sub: 'ongoing projects',                    icon: <FolderKanban className="w-5 h-5" />,  accent: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-l-indigo-500', path: '/projects/all' },
  ] : [];

  const soStatusColor: Record<string, string> = {
    Delivered: 'bg-emerald-50 text-emerald-700', Shipped: 'bg-blue-50 text-blue-700',
    Confirmed: 'bg-indigo-50 text-indigo-700',   Pending: 'bg-amber-50 text-amber-700',
    Draft: 'bg-gray-100 text-gray-600',           Cancelled: 'bg-red-50 text-red-600',
  };
  const poStatusColor: Record<string, string> = {
    Received: 'bg-emerald-50 text-emerald-700', Acknowledged: 'bg-blue-50 text-blue-700',
    Sent: 'bg-indigo-50 text-indigo-700',        Draft: 'bg-gray-100 text-gray-600',
    Cancelled: 'bg-red-50 text-red-600',
  };
  const soBar: Record<string, string> = { Delivered: 'bg-emerald-500', Shipped: 'bg-blue-500', Confirmed: 'bg-indigo-500', Pending: 'bg-amber-400', Draft: 'bg-gray-300', Cancelled: 'bg-red-400' };
  const soTxt: Record<string, string> = { Delivered: 'text-emerald-700', Shipped: 'text-blue-700', Confirmed: 'text-indigo-700', Pending: 'text-amber-700', Draft: 'text-gray-500', Cancelled: 'text-red-600' };
  const poBar: Record<string, string> = { Received: 'bg-emerald-500', Acknowledged: 'bg-blue-500', Sent: 'bg-indigo-500', Draft: 'bg-gray-300', Cancelled: 'bg-red-400' };
  const poTxt: Record<string, string> = { Received: 'text-emerald-700', Acknowledged: 'text-blue-700', Sent: 'text-indigo-700', Draft: 'text-gray-500', Cancelled: 'text-red-600' };

  const modules = [
    { label: 'Finance',         desc: 'Journal & Reports',       icon: <DollarSign className="w-4 h-4" />,    accent: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:bg-emerald-100', path: '/finance' },
    { label: 'HR',              desc: 'Employees & Payroll',     icon: <Users className="w-4 h-4" />,          accent: 'text-teal-600',    bg: 'bg-teal-50',    hover: 'hover:bg-teal-100',    path: '/hr' },
    { label: 'Inventory',       desc: 'Stock & Products',        icon: <Boxes className="w-4 h-4" />,          accent: 'text-orange-600',  bg: 'bg-orange-50',  hover: 'hover:bg-orange-100',  path: '/inventory' },
    { label: 'Manufacturing',   desc: 'Production & WO',         icon: <Factory className="w-4 h-4" />,        accent: 'text-cyan-700',    bg: 'bg-cyan-50',    hover: 'hover:bg-cyan-100',    path: '/manufacturing' },
    { label: 'CRM',             desc: 'Leads & Pipeline',        icon: <UserCircle className="w-4 h-4" />,     accent: 'text-pink-600',    bg: 'bg-pink-50',    hover: 'hover:bg-pink-100',    path: '/crm' },
    { label: 'Projects',        desc: 'Projects & Tasks',        icon: <FolderKanban className="w-4 h-4" />,   accent: 'text-indigo-600',  bg: 'bg-indigo-50',  hover: 'hover:bg-indigo-100',  path: '/projects' },
    { label: 'Assets',          desc: 'Assets & Maintenance',    icon: <FileBox className="w-4 h-4" />,        accent: 'text-sky-600',     bg: 'bg-sky-50',     hover: 'hover:bg-sky-100',     path: '/assets' },
    { label: 'System',          desc: 'Users & Config',          icon: <Settings className="w-4 h-4" />,       accent: 'text-gray-600',    bg: 'bg-gray-100',   hover: 'hover:bg-gray-200',    path: '/system' },
  ];

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 pt-8 pb-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{todayLabel}</p>
            <h1 className="text-2xl font-bold text-white">{greeting()}, {userName} 👋</h1>
            <p className="text-blue-200 text-sm mt-1 opacity-80">Today's business overview</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm px-3.5 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-blue-200" />
              <span className="font-mono font-semibold tracking-widest">{nowStr}</span>
            </div>
            <button
              onClick={() => navigate('/hr/clock-in')}
              className="flex items-center gap-2 bg-white text-blue-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" /> Attendance
            </button>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh data"
              className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-sm px-3 py-2 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4">

        {/* Pending Alerts */}
        {!loading && hasAlerts && (
          <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm shadow-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="font-semibold">Needs attention:</span>
            <div className="flex gap-3 flex-wrap">
              {pendingSO > 0 && <button onClick={() => navigate('/sales/orders')} className="underline underline-offset-2 hover:text-amber-900">{pendingSO} SO Pending</button>}
              {draftSO  > 0 && <button onClick={() => navigate('/sales/orders')} className="underline underline-offset-2 hover:text-amber-900">{draftSO} SO Draft</button>}
              {draftPO  > 0 && <button onClick={() => navigate('/purchasing/orders')} className="underline underline-offset-2 hover:text-amber-900">{draftPO} PO Draft</button>}
            </div>
          </div>
        )}

        {/* KPI Stats */}
        <div className="mb-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map((s, i) => (
                <button
                  key={i}
                  onClick={() => navigate(s.path)}
                  className={`group bg-white rounded-2xl border border-gray-100 border-l-4 ${s.border} p-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                >
                  <div className={`inline-flex p-2 rounded-xl ${s.light} mb-3`}>
                    <span className={s.text}>{s.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{Number(s.value).toLocaleString()}</p>
                  <p className={`text-xs font-semibold ${s.text} mb-0.5`}>{s.label}</p>
                  <p className="text-xs text-gray-400 truncate">{s.sub}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Revenue + Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Revenue Snapshot */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Financial Summary" icon={<TrendingUp className="w-3.5 h-3.5" />} />
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm"><Receipt className="w-4 h-4 text-blue-600" /></div>
                    <div>
                      <p className="text-xs text-blue-500 font-medium">Sales Value</p>
                      <p className="text-base font-bold text-blue-900">{lkr(soRevenue)}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-center justify-between p-3.5 bg-violet-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm"><Truck className="w-4 h-4 text-violet-600" /></div>
                    <div>
                      <p className="text-xs text-violet-500 font-medium">Purchase Value</p>
                      <p className="text-base font-bold text-violet-900">{lkr(poSpend)}</p>
                    </div>
                  </div>
                  <ArrowDownRight className="w-4 h-4 text-violet-400" />
                </div>
                <div className={`flex items-center justify-between p-3.5 rounded-xl ${netFlow >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {netFlow >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Net Difference</p>
                      <p className={`text-base font-bold ${netFlow >= 0 ? 'text-emerald-900' : 'text-red-700'}`}>
                        {netFlow < 0 ? '− ' : ''}{lkr(Math.abs(netFlow))}
                      </p>
                    </div>
                  </div>
                  <BarChart2 className={`w-4 h-4 ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
              </div>
            )}
          </div>

          {/* SO Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Sales Order Status" icon={<ShoppingCart className="w-3.5 h-3.5" />} />
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-9 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3.5">
                {Object.entries(soStatusGroups).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-xs font-semibold ${soTxt[status] ?? 'text-gray-500'}`}>{status}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{count} · {Math.round((count / soTotal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${soBar[status] ?? 'bg-gray-400'} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.round((count / soTotal) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">{recentOrders.length} orders shown</p>
              </div>
            )}
          </div>

          {/* PO Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Purchase Order Status" icon={<Package className="w-3.5 h-3.5" />} />
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-9 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : recentPO.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3.5">
                {Object.entries(poStatusGroups).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-xs font-semibold ${poTxt[status] ?? 'text-gray-500'}`}>{status}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{count} · {Math.round((count / poTotal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${poBar[status] ?? 'bg-gray-400'} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.round((count / poTotal) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">{recentPO.length} orders shown</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* Sales Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="Recent Sales Orders" icon={<ShoppingCart className="w-3.5 h-3.5" />} />
              <button onClick={() => navigate('/sales/orders')} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold -mt-5">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Order No.</th>
                    <th className="text-left pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Customer</th>
                    <th className="text-right pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Value</th>
                    <th className="text-right pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/sales/orders')}>
                      <td className="py-3 font-mono text-xs text-gray-500">{o.orderNumber}</td>
                      <td className="py-3 text-sm text-gray-800 font-medium max-w-[120px] truncate">{o.customer?.companyName ?? '-'}</td>
                      <td className="py-3 text-right text-xs text-gray-600 whitespace-nowrap tabular-nums">{o.total ? lkrFull(o.total) : '-'}</td>
                      <td className="py-3 text-right"><StatusBadge status={o.status} map={soStatusColor} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Purchase Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="Recent Purchase Orders" icon={<Package className="w-3.5 h-3.5" />} />
              <button onClick={() => navigate('/purchasing/orders')} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold -mt-5">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : recentPO.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">PO No.</th>
                    <th className="text-left pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Vendor</th>
                    <th className="text-right pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Value</th>
                    <th className="text-right pb-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentPO.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/purchasing/orders')}>
                      <td className="py-3 font-mono text-xs text-gray-500">{p.poNumber}</td>
                      <td className="py-3 text-sm text-gray-800 font-medium max-w-[120px] truncate">{p.vendor?.companyName ?? '-'}</td>
                      <td className="py-3 text-right text-xs text-gray-600 whitespace-nowrap tabular-nums">{p.total ? lkrFull(p.total) : '-'}</td>
                      <td className="py-3 text-right"><StatusBadge status={p.status} map={poStatusColor} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Activity Feed + Module Nav */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pb-8">

          {/* Activity Feed */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Recent Activities" icon={<Activity className="w-3.5 h-3.5" />} />
            {loading ? (
              <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : feed.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No activities yet</p>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-blue-200 via-gray-200 to-transparent" />
                <div className="space-y-3">
                  {feed.map((item) => {
                    const isSO = item.type === 'so';
                    const dotColor = isSO ? 'bg-blue-500 ring-blue-100' : 'bg-violet-500 ring-violet-100';
                    const badgeMap = isSO ? soStatusColor : poStatusColor;
                    return (
                      <div key={item.id} className="flex items-start gap-3 group">
                        <div className={`absolute -left-0.5 mt-1.5 w-3 h-3 rounded-full ${dotColor} ring-4 ring-white shadow-sm flex-shrink-0`} />
                        <div className="flex-1 flex items-center justify-between min-w-0 bg-gray-50 group-hover:bg-slate-100 rounded-xl px-3 py-2.5 transition-colors">
                          <div className="min-w-0 mr-3">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              <span className={`font-semibold ${isSO ? 'text-blue-500' : 'text-violet-500'}`}>{isSO ? 'Sales' : 'Purchase'}</span>
                              {' · '}{item.sub}
                              {item.date && (
                                <span className="ml-1.5 text-gray-300">
                                  {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </p>
                          </div>
                          <StatusBadge status={item.status} map={badgeMap} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Module Navigator */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="Module Navigation" icon={<Zap className="w-3.5 h-3.5" />} />
            <div className="grid grid-cols-2 gap-2">
              {modules.map((m, i) => (
                <button
                  key={i}
                  onClick={() => navigate(m.path)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl ${m.bg} ${m.hover} transition-colors text-left`}
                >
                  <div className={`flex-shrink-0 p-1.5 bg-white rounded-lg shadow-sm ${m.accent}`}>{m.icon}</div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${m.accent} leading-tight truncate`}>{m.label}</p>
                    <p className="text-xs text-gray-400 leading-tight truncate mt-0.5">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}