import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import { CommercialInvoice } from "@/lib/models/CommercialInvoice";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import CommercialRecordsDisplay from "@/components/CommercialRecordsDisplay";

export default async function CommercialViewRecordsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    redirect("/login?callbackUrl=/commercial/view");
  }

  const userId = (session.user as any).id;
  await dbConnect();
  
  // Sort by latest created
  const invoices = await CommercialInvoice.find({ userId }).sort({ createdAt: -1 }).lean();
  
  // Safely stringify _id fields
  const safeInvoices = invoices.map(inv => {
    const doc = JSON.parse(JSON.stringify(inv));
    return doc;
  });

  return (
    <Suspense fallback={<div className="container">Loading Records...</div>}>
      <Header />
      <CommercialRecordsDisplay initialInvoices={safeInvoices} />
    </Suspense>
  );
}
