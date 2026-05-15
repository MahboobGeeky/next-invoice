"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { fmt, numberToWords } from "@/lib/utils";
import { ICommercialInvoice, ICommercialInvoiceItem, ICommercialQualityDeduction } from "@/lib/models/CommercialInvoice";
import { v4 as uuidv4 } from "uuid";

interface CommercialCreateInvoiceFormProps {
  initialData: Partial<ICommercialInvoice>;
  editId?: string | null;
}

export default function CommercialCreateInvoiceForm({
  initialData,
  editId,
}: CommercialCreateInvoiceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ICommercialInvoice>>(initialData);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Helper to init items and deductions if they don't exist
  useEffect(() => {
    if (!formData.items || formData.items.length === 0) {
      setFormData(prev => ({
        ...prev,
        items: [{ id: uuidv4(), lorryNo: "", bags: 0, quantity: 0, moisture: 0, rate: 0, amount: 0 } as unknown as ICommercialInvoiceItem]
      }));
    }
  }, []);

  const handleInputChange = (field: keyof ICommercialInvoice, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Items ---
  const handleItemChange = (index: number, field: keyof ICommercialInvoiceItem, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto calculate amount for the row
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(newItems[index].quantity as any) || 0;
      const r = parseFloat(newItems[index].rate as any) || 0;
      newItems[index].amount = q * r;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { id: uuidv4(), lorryNo: "", bags: 0, quantity: 0, moisture: 0, rate: 0, amount: 0 } as unknown as ICommercialInvoiceItem
      ]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  // --- Deductions ---
  const handleDeductionChange = (key: keyof ICommercialInvoice['qualityDeductions'], field: keyof ICommercialQualityDeduction, value: any) => {
    const val = parseFloat(value) || 0;
    setFormData(prev => {
      const qd = prev.qualityDeductions || {
        moisture: { quantity: 0, rate: 0, amount: 0 },
        dhalta: { quantity: 0, rate: 0, amount: 0 },
        labour: { quantity: 0, rate: 0, amount: 0 },
        cutBags: { quantity: 0, rate: 0, amount: 0 },
        extra: { quantity: 0, rate: 0, amount: 0 },
      };
      
      const updatedDeduction = { ...qd[key], [field]: value };
      if (field === 'quantity' || field === 'rate') {
        updatedDeduction.amount = (parseFloat(updatedDeduction.quantity as any) || 0) * (parseFloat(updatedDeduction.rate as any) || 0);
      }
      
      return {
        ...prev,
        qualityDeductions: {
          ...qd,
          [key]: updatedDeduction
        }
      };
    });
  };

  // --- Computations ---
  const totalBags = formData.items?.reduce((sum, item) => sum + (parseFloat(item.bags as any) || 0), 0) || 0;
  const totalQuantity = formData.items?.reduce((sum, item) => sum + (parseFloat(item.quantity as any) || 0), 0) || 0;
  const totalAmount = formData.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  
  const qd = formData.qualityDeductions;
  const totalDeductions = 
    (qd?.moisture?.amount || 0) +
    (qd?.dhalta?.amount || 0) +
    (qd?.labour?.amount || 0) +
    (qd?.cutBags?.amount || 0) +
    (qd?.extra?.amount || 0);
    
  const finalAmount = totalAmount - totalDeductions;

  // --- Save ---
  const saveInvoice = async () => {
    if (!formData.billNo || !formData.buyerName) {
      alert("Please fill Bill No and Buyer Name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        sellerName: "M/s. WISHWAS TRADERS",
        sellerAddress: "GULABBAGH - 854326, PURNEA, STATE - BIHAR, CODE - 10",
        panNo: "TLB01947/00",
        mobNo: "9801033100",
        totalBags,
        totalQuantity,
        totalAmount,
        finalAmount,
        qualityDeductions: {
          moisture: {
             quantity: parseFloat(qd?.moisture?.quantity as any) || 0,
             rate: parseFloat(qd?.moisture?.rate as any) || 0,
             amount: qd?.moisture?.amount || 0,
          },
          dhalta: {
             quantity: parseFloat(qd?.dhalta?.quantity as any) || 0,
             rate: parseFloat(qd?.dhalta?.rate as any) || 0,
             amount: qd?.dhalta?.amount || 0,
          },
          labour: {
             quantity: parseFloat(qd?.labour?.quantity as any) || 0,
             rate: parseFloat(qd?.labour?.rate as any) || 0,
             amount: qd?.labour?.amount || 0,
          },
          cutBags: {
             quantity: parseFloat(qd?.cutBags?.quantity as any) || 0,
             rate: parseFloat(qd?.cutBags?.rate as any) || 0,
             amount: qd?.cutBags?.amount || 0,
          },
          extra: {
             quantity: parseFloat(qd?.extra?.quantity as any) || 0,
             rate: parseFloat(qd?.extra?.rate as any) || 0,
             amount: qd?.extra?.amount || 0,
          },
        }
      };

      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/commercial-invoices/${editId}` : "/api/commercial-invoices";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) router.push("/commercial/view");
      else throw new Error("Failed");
    } catch {
      alert("Error saving commercial invoice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="section-header">
          <div className="section-title">
            <span>Commercial Invoice Management</span>
            <strong>
              {editId ? "Edit Commercial Invoice" : "New Commercial Invoice"}
            </strong>
          </div>
          {editId && (
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "0.75rem",
                background: "#fef3c7",
                color: "#92400e",
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid #fde68a",
              }}
            >
              EDITING: {formData.billNo}
            </div>
          )}
        </div>

        {/* --- BILL INFO --- */}
        <div className="grid-4" style={{ marginBottom: '1rem' }}>
          <div className="field">
            <label>Bill No</label>
            <input
              type="text"
              value={formData.billNo || ""}
              onChange={(e) => handleInputChange("billNo", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </div>
        </div>

        {/* --- BUYER DETAILS --- */}
        <div className="form-card">
          <div className="card-label">Buyer Details (Company)</div>
          <div className="grid-4">
            <div className="field col-span-2">
              <label>Buyer Name</label>
              <input
                type="text"
                value={formData.buyerName || ""}
                onChange={(e) => handleInputChange("buyerName", e.target.value)}
              />
            </div>
            <div className="field col-span-2">
              <label>Buyer Address</label>
              <input
                type="text"
                value={formData.buyerAddress || ""}
                onChange={(e) => handleInputChange("buyerAddress", e.target.value)}
              />
            </div>
            <div className="field col-span-2">
              <label>Place of Delivery</label>
              <input
                type="text"
                value={formData.placeOfDelivery || ""}
                onChange={(e) => handleInputChange("placeOfDelivery", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- ITEMS / LORRY DETAILS --- */}
        <div className="form-card" style={{ overflowX: 'auto' }}>
          <div className="card-label">Lorry Details</div>
          <table className="deduct-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>Sl. No.</th>
                <th>Lorry No.</th>
                <th style={{ width: "80px" }}>Bags</th>
                <th style={{ width: "100px" }}>Quantity</th>
                <th style={{ width: "80px" }}>Moisture</th>
                <th style={{ width: "100px" }}>Rate</th>
                <th style={{ width: "120px", textAlign: "right" }}>Amount</th>
                <th style={{ width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items?.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={item.lorryNo}
                      onChange={(e) => handleItemChange(i, "lorryNo", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.bags || ""}
                      onChange={(e) => handleItemChange(i, "bags", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.moisture || ""}
                      onChange={(e) => handleItemChange(i, "moisture", e.target.value)}
                      step="0.1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.rate || ""}
                      onChange={(e) => handleItemChange(i, "rate", e.target.value)}
                    />
                  </td>
                  <td className="amount-cell">{fmt(item.amount || 0)}</td>
                  <td>
                    <button className="remove-btn" onClick={() => removeItem(i)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2} style={{ textAlign: 'right', padding: '10px' }}>Totals:</th>
                <th style={{ padding: '10px' }}>{totalBags}</th>
                <th style={{ padding: '10px' }}>{totalQuantity.toFixed(2)}</th>
                <th colSpan={2}></th>
                <th className="amount-cell" style={{ fontWeight: 'bold', padding: '10px' }}>{fmt(totalAmount)}</th>
                <th></th>
              </tr>
            </tfoot>
          </table>
          <button className="add-row-btn" onClick={addItem}>
            + Add Lorry
          </button>
        </div>

        {/* --- QUALITY DEDUCTIONS --- */}
        <div className="form-card">
          <div className="card-label">Quality Deductions</div>
          <table className="deduct-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: "120px" }}>Qnty.</th>
                <th style={{ width: "120px" }}>Rate</th>
                <th style={{ width: "150px", textAlign: "right" }}>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {['moisture', 'dhalta', 'labour', 'cutBags', 'extra'].map((key) => {
                const k = key as keyof ICommercialInvoice['qualityDeductions'];
                const label = key === 'dhalta' ? 'DD' : key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <input
                        type="number"
                        value={formData.qualityDeductions?.[k]?.quantity || ""}
                        onChange={(e) => handleDeductionChange(k, "quantity", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={formData.qualityDeductions?.[k]?.rate || ""}
                        onChange={(e) => handleDeductionChange(k, "rate", e.target.value)}
                      />
                    </td>
                    <td className="amount-cell">{fmt(formData.qualityDeductions?.[k]?.amount || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- BANK DETAILS & SUMMARY --- */}
        <div className="grid-2" style={{ marginBottom: "2rem" }}>
          
          <div className="form-card" style={{ margin: 0 }}>
            <div className="card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Bank Details</span>
              <button 
                type="button" 
                onClick={() => setIsEditingBank(!isEditingBank)}
                style={{ fontSize: '0.8rem', padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
              >
                {isEditingBank ? 'Done' : 'Edit'}
              </button>
            </div>
            
            {!isEditingBank ? (
              <div style={{ padding: '10px 0', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold' }}>{formData.bankName}</div>
                <div>{formData.bankBranch}</div>
                <div>A/C. NO.: {formData.bankAc}</div>
                <div>IFS CODE : {formData.bankIfsc}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="field">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName || ""}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Branch (Optional)</label>
                  <input
                    type="text"
                    value={formData.bankBranch || ""}
                    onChange={(e) => handleInputChange("bankBranch", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>A/C NO.</label>
                  <input
                    type="text"
                    value={formData.bankAc || ""}
                    onChange={(e) => handleInputChange("bankAc", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>IFSC CODE</label>
                  <input
                    type="text"
                    value={formData.bankIfsc || ""}
                    onChange={(e) => handleInputChange("bankIfsc", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="summary-box">
              <div className="summary-row">
                <span className="label">Total Amount</span>
                <span className="value">₹{fmt(totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span className="label">Quality Deductions</span>
                <span className="value" style={{ color: 'var(--red)' }}>- ₹{fmt(totalDeductions)}</span>
              </div>
              <div className="summary-net">
                <span className="label">TOTAL</span>
                <span className="value">₹{fmt(finalAmount)}</span>
              </div>
            </div>

            <div className="form-card" style={{ margin: 0 }}>
              <div className="card-label">Total Rs. (In words)</div>
              <div style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: "1.5" }}>
                {numberToWords(finalAmount)}
              </div>
            </div>

            <div className="btn-row">
              <button className="btn btn-primary" onClick={saveInvoice} disabled={saving}>
                {saving ? "Saving..." : editId ? "💾 Update Invoice" : "💾 Save Invoice"}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
