import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/mongoose";
import { CommercialInvoice } from "@/lib/models/CommercialInvoice";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const resolvedParams = await params;
  const id = resolvedParams.id;

  await dbConnect();

  try {
    const invoice = await CommercialInvoice.findOne({ id, userId }).lean();
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const data = await req.json();

  await dbConnect();

  try {
    const invoice = await CommercialInvoice.findOneAndUpdate(
      { id, userId },
      data,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("DEBUG: Error updating commercial invoice:", err);
    return NextResponse.json({ error: "Failed to update invoice", details: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const resolvedParams = await params;
  const id = resolvedParams.id;

  await dbConnect();

  try {
    const invoice = await CommercialInvoice.findOneAndDelete({ id, userId });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
