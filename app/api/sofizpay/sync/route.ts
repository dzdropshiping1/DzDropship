import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.paymentLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const activeOrders = await prisma.order.findMany();

    // Computations
    const onlineReconciled = logs
      .filter(l => l.reconciled && l.paymentMethod !== 'COD' && l.status === 'COMPLETED')
      .reduce((sum, l) => sum + l.amount, 0);

    const codReconciled = logs
      .filter(l => l.reconciled && l.paymentMethod === 'COD' && l.status === 'COMPLETED')
      .reduce((sum, l) => sum + l.amount, 0);

    const onlinePending = logs
      .filter(l => !l.reconciled && l.status === 'COMPLETED')
      .reduce((sum, l) => sum + l.amount, 0);

    const codPending = activeOrders
      .filter(o => o.shippingStatus === 'DELIVERED' && o.paymentStatus !== 'PAID' && o.codAmount > 0)
      .reduce((sum, o) => sum + o.codAmount, 0);

    return NextResponse.json({
      logs,
      stats: {
        onlineReconciled,
        codReconciled,
        onlinePending,
        codPending,
      }
    });
  } catch (error) {
    console.error('Error fetching reconciliation data:', error);
    return NextResponse.json({ error: 'Failed to fetch reconciliation data' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // 1. Reconcile online payments (mark pending logs as reconciled)
    const pendingLogs = await prisma.paymentLog.findMany({
      where: { reconciled: false, status: 'COMPLETED' },
    });

    for (const log of pendingLogs) {
      await prisma.paymentLog.update({
        where: { id: log.id },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
        },
      });
    }

    // 2. Reconcile COD cash collections:
    // For orders that are DELIVERED and have pending COD payments, we simulate
    // syncing courier status (like Yalidine) and auto-updating payment to PAID
    // since the courier has collected and transferred the cash.
    const deliveredCodOrders = await prisma.order.findMany({
      where: {
        shippingStatus: 'DELIVERED',
        paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
        codAmount: { gt: 0 }
      },
    });

    for (const order of deliveredCodOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
        },
      });

      // Create a local payment log for Yalidine/COD cash transfer
      await prisma.paymentLog.create({
        data: {
          orderId: order.id,
          sofizPayId: 'COD_CASH_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          amount: order.codAmount,
          status: 'COMPLETED',
          paymentMethod: 'COD',
          reconciled: true,
          reconciledAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      onlineReconciledCount: pendingLogs.length,
      codReconciledCount: deliveredCodOrders.length,
    });
  } catch (error) {
    console.error('Error during reconciliation sync:', error);
    return NextResponse.json({ error: 'Reconciliation sync failed' }, { status: 500 });
  }
}
