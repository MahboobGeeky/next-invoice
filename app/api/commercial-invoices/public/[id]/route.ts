import { NextRequest, NextResponse } from "next/server";
import { generateCommercialInvoicePDF } from "@/lib/commercialPdfGenerator";
import dbConnect from "@/lib/mongoose";
import { CommercialInvoice, ICommercialInvoice } from "@/lib/models/CommercialInvoice";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!id) {
    return NextResponse.json(
      { error: "Invoice ID is required" },
      { status: 400 },
    );
  }

  await dbConnect();

  const invoice = (await CommercialInvoice.findOne({ id }).lean()) as ICommercialInvoice | null;

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found. Please check the ID." },
      { status: 404 },
    );
  }

  try {
    const pdfBuffer = await generateCommercialInvoicePDF(invoice);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Commercial_Invoice_${invoice.billNo || id}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
