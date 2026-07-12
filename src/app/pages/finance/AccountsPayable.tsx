import { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, Filter } from 'lucide-react';
import { accountsPayableService, type AccountsPayable } from '@/services/financeService';
import { Modal, DetailRow, ModalBtn, FormField, inputCls, selectCls } from '@/app/components/ui/Modal';

const fmt = (n?: number) => n != null ? 'Rp ' + Number(n).toLocaleString('id-ID') : '-';
const statusColor: Record<string,string> = { OPEN:'bg-yellow-100 text-yellow-800', PARTIAL:'bg-blue-100 text-blue-800', PAID:'bg-green-100 text-green-800', OVERDUE:'bg-red-100 text-red-800' };

const blank = () => ({ referenceNumber:'', dueDate:'', amount:'', paidAmount:'', status:'OPEN' });

export function AccountsPayable() {
  const [records, setRecords] = useState<AccountsPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'view'|'new'|'edit'|'delete'|null>(null);
  const [selected, setSelected] = useState<AccountsPayable|null>(null);
  const [form, setForm] = useState(blank());

  const load = () => {
    setLoading(true);
    accountsPayableService.getAll({ size:100 }).then(p=>setRecords(p.content)).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => (r.vendor?.companyName??'').toLowerCase().includes(search.toLowerCase()));
  const total = records.reduce((s,r)=>s+(r.amount??0),0);
  const paid = records.reduce((s,r)=>s+(r.paidAmount??0),0);

  const close = () => { setModal(null); setSelected(null); setForm(blank()); };

  const openEdit = (r: AccountsPayable) => {
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

  // ⚠️ Assumes accountsPayableService exposes create/update/delete.
  // Update method names below if financeService uses different ones.
  const handleNew = () => {
    accountsPayableService.create(form).then(()=>{load();close();}).catch(console.error);
  };
  const handleEdit = () => {
    if (!selected) return;
    accountsPayableService.update(selected.id, form).then(()=>{load();close();}).catch(console.error);
  };
  const handleDelete = () => {
    if (!selected) return;
    accountsPayableService.delete(selected.id).then(()=>{load();close();}).catch(console.error);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><CreditCard className="w-8 h-8 text-blue-600" /> Hutang Usaha</h1><p className="text-gray-500 mt-1">Kelola hutang kepada pemasok</p></div>
        <button onClick={()=>{setForm(blank());setModal('new');}} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" /> Tagihan Baru</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[{label:'Total Tagihan',val:fmt(total),color:'text-gray-900'},{label:'Sudah Dibayar',val:fmt(paid),color:'text-green-600'},{label:'Belum Lunas',val:fmt(total-paid),color:'text-red-600'}].map(s=>(
          <div key={s.label} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><p className="text-sm text-gray-600">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.val}</p></div>
        ))}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4"><div className="flex-1 relative"><Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari pemasok..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Filter className="w-5 h-5" /> Filter</button></div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Memuat data...</div> : (
        <table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr>{['Pemasok','No. Ref','Jatuh Tempo','Total','Sudah Bayar','Sisa','Status','Aksi'].map(h=><th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-900">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-200">{filtered.map(r=>(
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 text-sm font-medium text-gray-900">{r.vendor?.companyName??'-'}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{r.referenceNumber??'-'}</td>
              <td className="px-4 py-4 text-sm text-gray-900">{r.dueDate??'-'}</td>
              <td className="px-4 py-4 text-sm text-gray-900">{fmt(r.amount)}</td>
              <td className="px-4 py-4 text-sm text-green-600">{fmt(r.paidAmount)}</td>
              <td className="px-4 py-4 text-sm text-red-600">{fmt((r.amount??0)-(r.paidAmount??0))}</td>
              <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium">{r.status}</span></td>
              <td className="px-4 py-4 text-sm">
                <div className="flex gap-2">
                  <button onClick={()=>{setSelected(r);setModal('view');}} className="text-blue-600 hover:text-blue-800">Lihat</button>
                  <button onClick={()=>openEdit(r)} className="text-yellow-600 hover:text-yellow-800">Ubah</button>
                  <button onClick={()=>{setSelected(r);setModal('delete');}} className="text-red-600 hover:text-red-800">Hapus</button>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
        )}
      </div>
      <Modal open={modal==='view'} onClose={close} title="Detail Hutang" size="md" footer={<ModalBtn onClick={close}>Tutup</ModalBtn>}>
        {selected&&<div><DetailRow label="Pemasok" value={selected.vendor?.companyName??'-'}/><DetailRow label="No. Ref" value={selected.referenceNumber??'-'}/><DetailRow label="Jatuh Tempo" value={selected.dueDate??'-'}/><DetailRow label="Total" value={fmt(selected.amount)}/><DetailRow label="Sudah Bayar" value={fmt(selected.paidAmount)}/><DetailRow label="Sisa" value={fmt((selected.amount??0)-(selected.paidAmount??0))}/><DetailRow label="Status" value={<span className="px-2.5 py-0.5 rounded-full text-xs font-medium">{selected.status}</span>}/></div>}
      </Modal>

      {[{m:'new',title:'Tagihan Baru'},{m:'edit',title:'Ubah Tagihan'}].map(({m,title})=>(
        <Modal key={m} open={modal===m} onClose={close} title={title} size="md" footer={<><ModalBtn onClick={close}>Batal</ModalBtn><ModalBtn variant="primary" onClick={m==='new'?handleNew:handleEdit}>Simpan</ModalBtn></>}>
          <div className="grid grid-cols-2 gap-4">
            {selected && m==='edit' && (
              <FormField label="Pemasok"><input value={selected.vendor?.companyName??'-'} disabled className={inputCls + ' bg-gray-100'} /></FormField>
            )}
            <FormField label="No. Ref" required><input value={form.referenceNumber} onChange={e=>setForm(f=>({...f,referenceNumber:e.target.value}))} className={inputCls} /></FormField>
            <FormField label="Jatuh Tempo" required><input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} className={inputCls} /></FormField>
            <FormField label="Total" required><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} className={inputCls} /></FormField>
            <FormField label="Sudah Bayar"><input type="number" value={form.paidAmount} onChange={e=>setForm(f=>({...f,paidAmount:e.target.value}))} className={inputCls} /></FormField>
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

      <Modal open={modal==='delete'} onClose={close} title="Hapus Tagihan" size="sm" footer={<><ModalBtn onClick={close}>Batal</ModalBtn><ModalBtn variant="danger" onClick={handleDelete}>Hapus</ModalBtn></>}>
        <p className="text-gray-600">Apakah Anda yakin ingin menghapus tagihan dari <strong>{selected?.vendor?.companyName ?? '-'}</strong> ({selected?.referenceNumber})?</p>
      </Modal>
    </div>
  );
}