import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerWilaya,
      customerAddress,
      productName,
      source,
      costPriceDzd,
      sellingPriceDzd,
      shippingPriceDzd,
    } = body;

    // Validate input
    if (!customerName || !customerPhone || !customerWilaya || !customerAddress || !productName || !source) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const total = Number(sellingPriceDzd) + Number(shippingPriceDzd);

    // Create the order first to generate a CUID
    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        customerWilaya,
        customerAddress,
        productName,
        source,
        costPriceDzd: Number(costPriceDzd),
        sellingPriceDzd: Number(sellingPriceDzd),
        shippingPriceDzd: Number(shippingPriceDzd),
        paymentMethod: 'PENDING', // Default unspecified method
        onlineAmount: 0.0,
        codAmount: total, // Default full amount as COD
        paymentStatus: 'PENDING',
        shippingStatus: 'PENDING',
        sofizPayPaymentId: null, // Will be filled once customer pays
      },
    });

    // Update with CUID-based checkout URL
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        sofizPayCheckoutUrl: `/checkout/${order.id}`,
      },
    });

    return NextResponse.json(updatedOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
