import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import { CommercialInvoice, ICommercialInvoice } from "@/lib/models/CommercialInvoice";
import { authOptions } from "@/lib/auth";
import CommercialCreateInvoiceForm from "@/components/CommercialCreateInvoiceForm";

export default async function CommercialCreateInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    redirect("/login?callbackUrl=/commercial/create");
  }

  const userId = (session.user as any).id;
  const resolvedParams = await searchParams;
  const editId = resolvedParams.edit as string | undefined;

  await dbConnect();

  let initialData: Partial<ICommercialInvoice> = {
    sellerName: "",
    sellerAddress: "",
    panNo: "",
    mobNo: "",
    billNo: "",
    date: new Date().toISOString().split('T')[0],
    buyerName: "",
    buyerAddress: "",
    placeOfDelivery: "",
    items: [],
    qualityDeductions: {
      moisture: { quantity: 0, rate: 0, amount: 0 },
      dhalta: { quantity: 0, rate: 0, amount: 0 },
      labour: { quantity: 0, rate: 0, amount: 0 },
      cutBags: { quantity: 0, rate: 0, amount: 0 },
      extra: { quantity: 0, rate: 0, amount: 0 },
    },
    totalBags: 0,
    totalQuantity: 0,
    totalAmount: 0,
    finalAmount: 0,
    bankName: "STATE BANK OF INDIA",
    bankBranch: "BEGAMPUR KHATA BRANCH",
    bankAc: "40144823342",
    bankIfsc: "SBIN0015597",
  };

  if (editId) {
    const existingRaw = await CommercialInvoice.findOne({ id: editId, userId }).lean() as any;
    if (existingRaw) {
      const existing = JSON.parse(JSON.stringify(existingRaw));
      initialData = {
        ...existing,
        date: existing.date ? existing.date.split('T')[0] : new Date().toISOString().split('T')[0],
      };
    }
  } else {
    // Auto-increment Bill No
    const invoices = await CommercialInvoice.find({ userId }).select('billNo').lean();
    let maxBillNo = 0;
    for (const inv of invoices) {
      const num = parseInt(inv.billNo, 10);
      if (!isNaN(num) && num > maxBillNo) {
        maxBillNo = num;
      }
    }
    initialData.billNo = String(maxBillNo + 1);
  }

  return (
    <Suspense fallback={<div className="container">Loading Form...</div>}>
      <CommercialCreateInvoiceForm initialData={initialData} editId={editId} />
    </Suspense>
  );
}
