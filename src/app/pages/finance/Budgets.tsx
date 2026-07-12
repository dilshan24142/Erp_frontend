import { useState, useEffect } from 'react';
import { PieChart, Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { budgetService, type Budget } from '@/services/financeService';
import { Modal, FormField, DetailRow, ModalBtn, inputCls, selectCls } from '@/app/components/ui/Modal';

// මෙතැන 'Rp' වෙනුවට 'Rs ' ලෙසත්, 'id-ID' වෙනුවට 'en-LK' ලෙසත් වෙනස් කර ඇත
const fmt = (n?: number) => n != null ? 'Rs ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 }) : '-';
const statusColor: Record<string,string> = { 
    ACTIVE: 'bg-green-100 text-green-800', 
    DRAFT: 'bg-gray-100 text-gray-800', 
    CLOSED: 'bg-red-100 text-red-800' 
};

// Backend field names වලට match වෙන විදියට - Department සහ Actual අයින් කළා
const blank = () => ({ 
    name: '',
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    accountId: 0,
    budgetedAmount: 0,
    status: 'DRAFT',
    notes: ''
});

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'view'|'edit'|'new'|null>(null);
  const [selected, setSelected] = useState<Budget|null>(null);
  const [form, setForm] = useState(blank());

  const load = () => {
    setLoading(true);
    budgetService.getAll({ size:100 }).then(p=>setBudgets(p.content)).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = budgets.filter(b => 
    (b.name?.toLowerCase()?.includes(search.toLowerCase()) || '') ||
    (b.status??'').toLowerCase().includes(search.toLowerCase())
  );
  
  const close = () => { 
    setModal(null); 
    setSelected(null); 
    setForm(blank()); 
  };

  const handleNew = () => {
    const dataToSend = { ...form };
    if (!dataToSend.name || dataToSend.name.trim() === '') {
        dataToSend.name = `Budget-${Date.now()}`;
    }
    if (!dataToSend.periodYear) {
        dataToSend.periodYear = new Date().getFullYear();
    }
    budgetService.create(dataToSend).then(()=>{load();close();}).catch(console.error);
  };

  const handleEdit = (budget: Budget) => {
    setSelected(budget);
    setForm({
        name: budget.name || '',
        periodYear: budget.periodYear || new Date().getFullYear(),
        periodMonth: budget.periodMonth || new Date().getMonth() + 1,
        accountId: budget.account?.id || 0,
        budgetedAmount: budget.budgetedAmount || 0,
        status: budget.status || 'DRAFT',
        notes: budget.notes || ''
    });
    setModal('edit');
  };

  const handleUpdate = () => {
    if (!selected) return;
    const dataToSend = { ...form };
    budgetService.update(selected.id, dataToSend).then(()=>{load();close();}).catch(console.error);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
        budgetService.delete(id).then(()=>{load();}).catch(console.error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PieChart className="w-8 h-8 text-blue-600" /> Budgets
          </h1>
          <p className="text-gray-500 mt-1">Manage department budgets</p>
        </div>
        <button onClick={()=>setModal('new')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" /> New Budget
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={search} 
              onChange={e=>setSearch(e.target.value)} 
              placeholder="Search by name or status..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5" /> Filter
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading data...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Name</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">Year</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">Month</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900">Budgeted</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No budgets found
                  </td>
                </tr>
              ) : (
                filtered.map(b=>(
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{b.name || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 text-center">{b.periodYear??'-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 text-center">{b.periodMonth??'-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">{fmt(b.budgetedAmount)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status] || 'bg-gray-100 text-gray-800'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Button */}
                        <button 
                          onClick={()=>{setSelected(b);setModal('view');}} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Edit Button */}
                        <button 
                          onClick={()=>handleEdit(b)} 
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button 
                          onClick={()=>handleDelete(b.id)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
      
      {/* View Modal */}
      <Modal open={modal==='view'} onClose={close} title="Budget Details" size="md" footer={<ModalBtn onClick={close}>Close</ModalBtn>}>
        {selected&&<div className="space-y-3">
          <DetailRow label="Name" value={selected.name || '-'}/>
          <DetailRow label="Period Year" value={String(selected.periodYear??'-')}/>
          <DetailRow label="Period Month" value={String(selected.periodMonth??'-')}/>
          <DetailRow label="Budgeted Amount" value={fmt(selected.budgetedAmount)}/>
          <DetailRow label="Status" value={<span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status] || 'bg-gray-100 text-gray-800'}`}>{selected.status}</span>}/>
          {selected.notes && <DetailRow label="Notes" value={selected.notes}/>}
        </div>}
      </Modal>
      
      {/* New Budget Modal */}
      <Modal open={modal==='new'} onClose={close} title="New Budget" size="md" footer={<><ModalBtn onClick={close}>Cancel</ModalBtn><ModalBtn variant="primary" onClick={handleNew}>Create</ModalBtn></>}>
        <BudgetForm form={form} setForm={setForm} />
      </Modal>
      
      {/* Edit Budget Modal */}
      <Modal open={modal==='edit'} onClose={close} title="Edit Budget" size="md" footer={<><ModalBtn onClick={close}>Cancel</ModalBtn><ModalBtn variant="primary" onClick={handleUpdate}>Update</ModalBtn></>}>
        <BudgetForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

// Budget Form Component (Reusable) - Department සහ Actual අයින් කළා
function BudgetForm({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Budget Name" required>
        <input 
          type="text" 
          value={form.name} 
          onChange={e=>setForm((f:any)=>({...f, name: e.target.value}))} 
          className={inputCls} 
          placeholder="e.g., Marketing Budget 2026"
        />
      </FormField>
      
      <FormField label="Period Year" required>
        <input 
          type="number" 
          value={form.periodYear} 
          onChange={e=>setForm((f:any)=>({...f, periodYear: Number(e.target.value)}))} 
          className={inputCls} 
          placeholder="e.g., 2026"
        />
      </FormField>
      
      <FormField label="Period Month">
        <input 
          type="number" 
          value={form.periodMonth||''} 
          onChange={e=>setForm((f:any)=>({...f, periodMonth: Number(e.target.value)}))} 
          className={inputCls} 
          placeholder="1-12"
          min="1"
          max="12"
        />
      </FormField>
      
      <FormField label="Budgeted Amount" required>
        <input 
          type="number" 
          value={form.budgetedAmount||''} 
          onChange={e=>setForm((f:any)=>({...f, budgetedAmount: Number(e.target.value)}))} 
          className={inputCls} 
          placeholder="0.00"
          step="0.01"
        />
      </FormField>
      
      <FormField label="Status">
        <select 
          value={form.status} 
          onChange={e=>setForm((f:any)=>({...f, status: e.target.value}))} 
          className={selectCls}
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </FormField>
      
      <FormField label="Account ID">
        <input 
          type="number" 
          value={form.accountId||''} 
          onChange={e=>setForm((f:any)=>({...f, accountId: Number(e.target.value)}))} 
          className={inputCls} 
          placeholder="Enter account ID"
        />
      </FormField>
      
      <FormField label="Notes" className="col-span-2">
        <textarea 
          value={form.notes || ''} 
          onChange={e=>setForm((f:any)=>({...f, notes: e.target.value}))} 
          className={inputCls} 
          rows={2}
          placeholder="Optional notes"
        />
      </FormField>
    </div>
  );
}