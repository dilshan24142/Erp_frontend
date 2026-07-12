import { useState, useEffect } from 'react';
import { Wallet, Plus, Search, Filter } from 'lucide-react';
import { accountsReceivableService, type AccountsReceivable } from '@/services/financeService';
import { Modal, DetailRow, ModalBtn, FormField, inputCls, selectCls } from '@/app/components/ui/Modal';

// මෙතැන 'Rp' වෙනුවට 'Rs ' ලෙසත්, 'id-ID' වෙනුවට 'en-LK' ලෙසත් වෙනස් කර ඇත
const fmt = (n?: number) => n != null ? 'Rs ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 }) : '-';
const statusColor: Record<string,string> = { OPEN:'bg-yellow-100 text-yellow-800', PARTIAL:'bg-blue-100 text-blue-800', PAID:'bg-green-100 text-green-800', OVERDUE:'bg-red-100 text-red-800' };

const blank = () => ({ referenceNumber:'', dueDate:'', amount:'', paidAmount:'', status:'OPEN' });

export function AccountsReceivable() {
  const [records, setRecords] = useState<AccountsReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'view'|'new'|'edit'|'delete'|null>(null);
  const [selected, setSelected] = useState<AccountsReceivable|null>(null);
  const [form, setForm] = useState(blank());

  const load = () => {
    setLoading(true);
    accountsReceivableService.getAll({ size:100 }).then(p=>setRecords(p.content)).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => (r.customer?.companyName??'').toLowerCase().includes(search.toLowerCase()));
  const total = records.reduce((s,r)=>s+(r.amount??0),0);
  const paid = records.reduce((s,r)=>s+(r.paidAmount??0),0);

  const close = () => { setModal(null); setSelected(null); setForm(blank()); };

  const openEdit = (r: AccountsReceivable) => {
    setSelected(r);
    setForm({
      referenceNumber: r.referenceNumber ?? '',
      dueDate: r.dueDate ?? '',
      amount: r.amount != null ? String(r.amount) : '',
      paidAmount: r.paidAmount != null ? String(r.paidAmount) : '',
      status: r.status ?? 'OPEN'
    });
    setModal('edit');
  };

  // ⚠️ Assumes accountsReceivableService exposes create/update/delete.
  // Update method names below if financeService uses different ones.
  const handleNew = () => {
    accountsReceivableService.create(form).then(()=>{load();close();}).catch(console.error);
  };
  const handleEdit = () => {
    if (!selected) return;
    accountsReceivableService.update(selected.id, form).then(()=>{load();close();}).catch(console.error);
  };
  const handleDelete = () => {
    if (!selected) return;
    accountsReceivableService.delete(selected.id).then(()=>{load();close();}).catch(console.error);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Wallet className="w-8 h-8 text-blue-600" /> Accounts Receivable</h1><p className="text-gray-500 mt-1">Manage receivables from customers</p></div>
        <button onClick={()=>{setForm(blank());setModal('new');}} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" /> New Invoice</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[{label:'Total Receivable',val:fmt(total),color:'text-gray-900'},{label:'Amount Received',val:fmt(paid),color:'text-green-600'},{label:'Outstanding',val:fmt(total-paid),color:'text-orange-600'}].map(s=>(
          <div key={s.label} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><p className="text-sm text-gray-600">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.val}</p></div>
        ))}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4"><div className="flex-1 relative"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customer..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Filter className="w-5 h-5" /> Filter</button></div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading data...</div> : (
        <table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr>{['Customer','Ref No.','Due Date','Total','Received','Outstanding','Status','Action'].map(h=><th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-900">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-200">{filtered.map(r=>(
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 text-sm font-medium text-gray-900">{r.customer?.companyName??'-'}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{r.referenceNumber??'-'}</td>
              <td className="px-4 py-4 text-sm text-gray-900">{r.dueDate??'-'}</td>
              <td className="px-4 py-4 text-sm text-gray-900">{fmt(r.amount)}</td>
              <td className="px-4 py-4 text-sm text-green-600">{fmt(r.paidAmount)}</td>
              <td className="px-4 py-4 text-sm text-orange-600">{fmt((r.amount??0)-(r.paidAmount??0))}</td>
              <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium">{r.status}</span></td>
              <td className="px-4 py-4 text-sm">
                <div className="flex gap-2">
                  <button onClick={()=>{setSelected(r);setModal('view');}} className="text-blue-600 hover:text-blue-800">View</button>
                  <button onClick={()=>openEdit(r)} className="text-yellow-600 hover:text-yellow-800">Edit</button>
                  <button onClick={()=>{setSelected(r);setModal('delete');}} className="text-red-600 hover:text-red-800">Delete</button>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
        )}
      </div>
      <Modal open={modal==='view'} onClose={close} title="Receivable Details" size="md" footer={<ModalBtn onClick={close}>Close</ModalBtn>}>
        {selected&&<div><DetailRow label="Customer" value={selected.customer?.companyName??'-'}/><DetailRow label="Ref No." value={selected.referenceNumber??'-'}/><DetailRow label="Due Date" value={selected.dueDate??'-'}/><DetailRow label="Total" value={fmt(selected.amount)}/><DetailRow label="Received" value={fmt(selected.paidAmount)}/><DetailRow label="Outstanding" value={fmt((selected.amount??0)-(selected.paidAmount??0))}/><DetailRow label="Status" value={<span className="px-2.5 py-0.5 rounded-full text-xs font-medium">{selected.status}</span>}/></div>}
      </Modal>

      {[{m:'new',title:'New Invoice'},{m:'edit',title:'Edit Invoice'}].map(({m,title})=>(
        <Modal key={m} open={modal===m} onClose={close} title={title} size="md" footer={<><ModalBtn onClick={close}>Cancel</ModalBtn><ModalBtn variant="primary" onClick={m==='new'?handleNew:handleEdit}>Save</ModalBtn></>}>
          <div className="grid grid-cols-2 gap-4">
            {selected && m==='edit' && (
              <FormField label="Customer"><input value={selected.customer?.companyName??'-'} disabled className={inputCls + ' bg-gray-100'} /></FormField>
            )}
            <FormField label="Ref No." required><input value={form.referenceNumber} onChange={e=>setForm(f=>({...f,referenceNumber:e.target.value}))} className={inputCls} /></FormField>
            <FormField label="Due Date" required><input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} className={inputCls} /></FormField>
            <FormField label="Total" required><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} className={inputCls} /></FormField>
            <FormField label="Received"><input type="number" value={form.paidAmount} onChange={e=>setForm(f=>({...f,paidAmount:e.target.value}))} className={inputCls} /></FormField>
            <FormField label="Status">
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className={selectCls}>
                <option value="OPEN">Open</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </FormField>
          </div>
        </Modal>
      ))}

      <Modal open={modal==='delete'} onClose={close} title="Delete Invoice" size="sm" footer={<><ModalBtn onClick={close}>Cancel</ModalBtn><ModalBtn variant="danger" onClick={handleDelete}>Delete</ModalBtn></>}>
        <p className="text-gray-600">Are you sure you want to delete the invoice for <strong>{selected?.customer?.companyName ?? '-'}</strong> ({selected?.referenceNumber})?</p>
      </Modal>
    </div>
  );
}