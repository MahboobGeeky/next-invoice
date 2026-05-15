import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommercialInvoiceItem {
  id: string;
  lorryNo: string;
  bags: number;
  quantity: number;
  moisture: number;
  rate: number;
  amount: number;
}

export interface ICommercialQualityDeduction {
  quantity: number;
  rate: number;
  amount: number;
}

export interface ICommercialInvoice {
  id: string; // UUID for internal lookups
  userId: string;
  
  // Seller details
  sellerName: string;
  sellerAddress: string;
  panNo?: string;
  mobNo?: string;
  
  // Invoice details
  billNo: string;
  date: string;
  
  // Buyer details
  buyerName: string;
  buyerAddress: string;
  placeOfDelivery?: string;
  
  // Items
  items: ICommercialInvoiceItem[];
  
  // Totals before deductions
  totalBags: number;
  totalQuantity: number;
  totalAmount: number; // Sum of item amounts
  
  // Quality Deductions
  qualityDeductions: {
    moisture: ICommercialQualityDeduction;
    dhalta: ICommercialQualityDeduction;
    labour: ICommercialQualityDeduction;
    cutBags: ICommercialQualityDeduction;
    extra: ICommercialQualityDeduction;
  };
  
  // Final
  finalAmount: number; // totalAmount - sum(qualityDeductions.amount)
  
  // Bank Details
  bankName: string;
  bankBranch?: string;
  bankAc: string;
  bankIfsc: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

const CommercialInvoiceItemSchema = new Schema<ICommercialInvoiceItem>({
  id: { type: String, required: true },
  lorryNo: { type: String, required: true },
  bags: { type: Number, required: true },
  quantity: { type: Number, required: true },
  moisture: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const QualityDeductionSchema = new Schema<ICommercialQualityDeduction>({
  quantity: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
});

const CommercialInvoiceSchema = new Schema<ICommercialInvoice>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  
  sellerName: { type: String, required: true },
  sellerAddress: { type: String, required: true },
  panNo: { type: String },
  mobNo: { type: String },
  
  billNo: { type: String, required: true },
  date: { type: String, required: true },
  
  buyerName: { type: String, required: true },
  buyerAddress: { type: String, required: true },
  placeOfDelivery: { type: String },
  
  items: [CommercialInvoiceItemSchema],
  
  totalBags: { type: Number, required: true },
  totalQuantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  
  qualityDeductions: {
    moisture: { type: QualityDeductionSchema, default: () => ({}) },
    dhalta: { type: QualityDeductionSchema, default: () => ({}) },
    labour: { type: QualityDeductionSchema, default: () => ({}) },
    cutBags: { type: QualityDeductionSchema, default: () => ({}) },
    extra: { type: QualityDeductionSchema, default: () => ({}) },
  },
  
  finalAmount: { type: Number, required: true },
  
  bankName: { type: String, required: true },
  bankBranch: { type: String },
  bankAc: { type: String, required: true },
  bankIfsc: { type: String, required: true },
}, { timestamps: true });

// Check if model exists to handle HMR
if (mongoose.models.CommercialInvoice) {
  delete mongoose.models.CommercialInvoice;
}
export const CommercialInvoice: Model<ICommercialInvoice> = mongoose.model<ICommercialInvoice>("CommercialInvoice", CommercialInvoiceSchema);
