"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fmt, formatDate } from "@/lib/utils";
import { ICommercialInvoice } from "@/lib/models/CommercialInvoice";

interface CommercialRecordsDisplayProps {
  initialInvoices: ICommercialInvoice[];
}

export default function CommercialRecordsDisplay({ initialInvoices }: CommercialRecordsDisplayProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<ICommercialInvoice[]>(initialInvoices);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterBuyer, setFilterBuyer] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<ICommercialInvoice | null>(null);

  // Filtered Data
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const d = new Date(inv.date);
      const from = filterFrom ? new Date(filterFrom) : new Date('1900-01-01');
      const to = filterTo ? new Date(filterTo) : new Date('2100-01-01');
      const matchesBuyer = (inv.buyerName || '').toLowerCase().includes(filterBuyer.toLowerCase());
      return d >= from && d <= to && matchesBuyer;
    });
  }, [invoices, filterFrom, filterTo, filterBuyer]);

  // Stats
  const stats = useMemo(() => {
    const qty = filteredInvoices.reduce((s, i) => s + (Number(i.totalQuantity || 0)), 0);
    const amount = filteredInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const finalAmt = filteredInvoices.reduce((s, i) => s + (i.finalAmount || 0), 0);
    return { count: filteredInvoices.length, qty, amount, finalAmt };
  }, [filteredInvoices]);

  const deleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this commercial invoice?")) return;
    
    try {
      const res = await fetch(`/api/commercial-invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      } else {
        alert("Failed to delete invoice");
      }
    } catch (err) {
      alert("Error deleting invoice");
    }
  };

  return (
    <div className="container">
      <div className="section-header">
        <div className="section-title">
          <span>Commercial Invoice Management</span>
          <strong>Saved Records</strong>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{stats.count}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Qty (kg)</div>
          <div className="stat-value">{stats.qty.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Amount</div>
          <div className="stat-value green">₹{fmt(stats.amount)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Final Amount</div>
          <div className="stat-value green">₹{fmt(stats.finalAmt)}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-bar">
        <div className="field">
          <label>From Date</label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To Date</label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
        </div>
        <div className="field">
          <label>Buyer Name</label>
          <input 
            type="text" 
            placeholder="Search buyer..." 
            value={filterBuyer} 
            onChange={e => setFilterBuyer(e.target.value)} 
          />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterBuyer(""); }}>Reset</button>
      </div>

      {/* TABLE */}
      <div className="records-table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Bill No.</th>
              <th>Date</th>
              <th>Seller</th>
              <th>Buyer</th>
              <th>Bags</th>
              <th>Qty (kg)</th>
              <th>Total Amount</th>
              <th>Final Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
              <tr key={inv.id}>
                <td className="mono" style={{ fontWeight: 700 }}>#{inv.billNo}</td>
                <td>{formatDate(inv.date)}</td>
                <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.sellerName}</td>
                <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.buyerName}</td>
                <td className="mono">{inv.totalBags}</td>
                <td className="mono">{(Number(inv.totalQuantity || 0)).toLocaleString('en-IN')}</td>
                <td className="mono">₹{(Number(inv.totalAmount || 0)).toFixed(2)}</td>
                <td className="net-col">₹{fmt(inv.finalAmount)}</td>
                <td>
                  <div className="actions-col">
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedInvoice(inv)}>View</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/commercial/create?edit=${inv.id}`)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteInvoice(inv.id)}>Del</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-state">
                    <div className="icon">📄</div>
                    <p>No commercial invoices found. Create one using the Create tab.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL (Simplified Preview) */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Quick View</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Commercial Invoice #{selectedInvoice.billNo}</div>
              </div>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>×</button>
            </div>
            <div className="modal-body">
               <div className="summary-box" style={{ marginBottom: '1.5rem' }}>
                  <div className="summary-row"><span className="label">Seller</span><span className="value">{selectedInvoice.sellerName}</span></div>
                  <div className="summary-row"><span className="label">Buyer</span><span className="value">{selectedInvoice.buyerName}</span></div>
                  <div className="summary-row"><span className="label">Date</span><span className="value">{formatDate(selectedInvoice.date)}</span></div>
                  <div className="summary-row" style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>
                    <span className="label">Total Quantity</span>
                    <span className="value">{selectedInvoice.totalQuantity} kg</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Total Amount</span>
                    <span className="value">₹{fmt(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="summary-net"><span className="label">Final Amount</span><span className="value">₹{fmt(selectedInvoice.finalAmount)}</span></div>
               </div>
               <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Click below to generate the official PDF according to your custom layout.
                  </p>
                  <button 
                    className="btn btn-export" 
                    onClick={async () => {
                      const res = await fetch(`/api/commercial-invoices/public/${selectedInvoice.id}`);
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Commercial_Invoice_${selectedInvoice.billNo}.pdf`;
                      a.click();
                    }}
                  >
                    ⬇ View / Download PDF
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
