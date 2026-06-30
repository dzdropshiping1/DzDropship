import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Warehouse,
  ShieldCheck,
  Link as LinkIcon,
  ArrowUpRight
} from 'lucide-react';

async function getDashboardData() {
  let orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Auto-seed if database is empty so the reseller can experience the app immediately
  if (orders.length === 0) {
    const mockOrders = [
      {
        customerName: "Mohamed Benali",
        customerPhone: "0550123456",
        customerWilaya: "Alger",
        customerAddress: "Didouche Mourad, Alger Center",
        productName: "Wireless Earbuds Pro",
        source: "ALIEXPRESS",
        costPriceDzd: 1800,
        sellingPriceDzd: 4500,
        shippingPriceDzd: 600,
        paymentMethod: "SPLIT",
        onlineAmount: 600,
        codAmount: 4500,
        paymentStatus: "PARTIALLY_PAID",
        shippingStatus: "SHIPPED",
        sofizPayPaymentId: "SP_MOCK_1",
        sofizPayCheckoutUrl: "/checkout/SP_MOCK_1",
      },
      {
        customerName: "Fatima Zohra",
        customerPhone: "0661987654",
        customerWilaya: "Oran",
        customerAddress: "Akid Lotfi, Oran",
        productName: "Smart Watch Series 9",
        source: "ALIEXPRESS",
        costPriceDzd: 3500,
        sellingPriceDzd: 8900,
        shippingPriceDzd: 800,
        paymentMethod: "ONLINE",
        onlineAmount: 9700,
        codAmount: 0,
        paymentStatus: "PAID",
        shippingStatus: "DELIVERED",
        sofizPayPaymentId: "SP_MOCK_2",
        sofizPayCheckoutUrl: "/checkout/SP_MOCK_2",
      },
      {
        customerName: "Anis Rahmani",
        customerPhone: "0772345678",
        customerWilaya: "Constantine",
        customerAddress: "Sidi Mabrouk, Constantine",
        productName: "Leather Backpack",
        source: "LOCAL_WHOLESALER",
        costPriceDzd: 2500,
        sellingPriceDzd: 6000,
        shippingPriceDzd: 700,
        paymentMethod: "COD",
        onlineAmount: 0,
        codAmount: 6700,
        paymentStatus: "PENDING",
        shippingStatus: "PENDING",
      },
      {
        customerName: "Amine Khelil",
        customerPhone: "0554112233",
        customerWilaya: "Setif",
        customerAddress: "Boulevard 1er Novembre, Setif",
        productName: "Ergonomic Office Mouse",
        source: "LOCAL_WHOLESALER",
        costPriceDzd: 1200,
        sellingPriceDzd: 3200,
        shippingPriceDzd: 600,
        paymentMethod: "COD",
        onlineAmount: 0,
        codAmount: 3800,
        paymentStatus: "PAID",
        shippingStatus: "DELIVERED",
      },
      {
        customerName: "Karima Bensaad",
        customerPhone: "0667445566",
        customerWilaya: "Blida",
        customerAddress: "Bab Sebt, Blida",
        productName: "Mini Projector 4K",
        source: "ALIEXPRESS",
        costPriceDzd: 8000,
        sellingPriceDzd: 18500,
        shippingPriceDzd: 600,
        paymentMethod: "SPLIT",
        onlineAmount: 1000,
        codAmount: 18100,
        paymentStatus: "PENDING",
        shippingStatus: "PENDING",
        sofizPayPaymentId: "SP_MOCK_5",
        sofizPayCheckoutUrl: "/checkout/SP_MOCK_5",
      }
    ];

    for (const mo of mockOrders) {
      await prisma.order.create({ data: mo });
    }
    
    // Create seed payment logs
    const watchOrder = await prisma.order.findFirst({ where: { sofizPayPaymentId: "SP_MOCK_2" } });
    if (watchOrder) {
      await prisma.paymentLog.create({
        data: {
          orderId: watchOrder.id,
          sofizPayId: "SP_MOCK_2",
          amount: 9700,
          status: "COMPLETED",
          paymentMethod: "EDAHABIYA",
          reconciled: true,
          reconciledAt: new Date()
        }
      });
    }

    const earbudsOrder = await prisma.order.findFirst({ where: { sofizPayPaymentId: "SP_MOCK_1" } });
    if (earbudsOrder) {
      await prisma.paymentLog.create({
        data: {
          orderId: earbudsOrder.id,
          sofizPayId: "SP_MOCK_1",
          amount: 600,
          status: "COMPLETED",
          paymentMethod: "CIB",
          reconciled: false
        }
      });
    }

    orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  return orders;
}

export default async function DashboardPage() {
  const orders = await getDashboardData();

  // Statistics Computations
  const activeOrders = orders.filter(o => o.shippingStatus !== 'CANCELLED' && o.shippingStatus !== 'RETURNED');
  
  const totalGrossRevenue = activeOrders.reduce((sum, o) => sum + o.sellingPriceDzd, 0);
  const totalCost = activeOrders.reduce((sum, o) => sum + o.costPriceDzd, 0);
  const totalProfit = totalGrossRevenue - totalCost;
  const profitMargin = totalGrossRevenue > 0 ? (totalProfit / totalGrossRevenue) * 100 : 0;
  
  // COD vs Online Split
  const totalOnlinePaid = orders.reduce((sum, o) => {
    if (o.paymentStatus === 'PAID' || o.paymentStatus === 'PARTIALLY_PAID') {
      return sum + o.onlineAmount;
    }
    return sum;
  }, 0);

  const totalCodOutstanding = activeOrders.reduce((sum, o) => {
    // If fully paid online, COD outstanding is 0. Else it's the codAmount
    if (o.paymentStatus === 'PAID') return sum;
    return sum + o.codAmount;
  }, 0);

  const totalSplitFund = totalOnlinePaid + totalCodOutstanding;
  const onlinePercent = totalSplitFund > 0 ? (totalOnlinePaid / totalSplitFund) * 100 : 0;
  const codPercent = totalSplitFund > 0 ? (totalCodOutstanding / totalSplitFund) * 100 : 0;

  // Sourcing Channel metrics
  const aliexpressCount = orders.filter(o => o.source === 'ALIEXPRESS').length;
  const wholesalerCount = orders.filter(o => o.source === 'LOCAL_WHOLESALER').length;

  // Shipping Status Count
  const pendingShip = orders.filter(o => o.shippingStatus === 'PENDING').length;
  const shippedCount = orders.filter(o => o.shippingStatus === 'SHIPPED').length;
  const deliveredCount = orders.filter(o => o.shippingStatus === 'DELIVERED').length;
  const returnedCount = orders.filter(o => o.shippingStatus === 'RETURNED').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">DzDropship business analytics & performance dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/orders/new" className="btn btn-primary">
            + New Order
          </Link>
          <Link href="/cod-bridge" className="btn btn-secondary">
            COD Bridge Link
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-title-row">
            <span>Gross Revenue</span>
            <div className="kpi-icon-wrapper secondary">
              <DollarSign size={18} />
            </div>
          </div>
          <span className="kpi-value">{totalGrossRevenue.toLocaleString()} DA</span>
          <div className="kpi-trend positive">
            <TrendingUp size={14} />
            <span>Active Sales</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-title-row">
            <span>Net Profit</span>
            <div className="kpi-icon-wrapper success">
              <TrendingUp size={18} />
            </div>
          </div>
          <span className="kpi-value">{totalProfit.toLocaleString()} DA</span>
          <div className="kpi-trend positive">
            <span>Margin: {profitMargin.toFixed(1)}%</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-title-row">
            <span>COD Outstanding</span>
            <div className="kpi-icon-wrapper warning">
              <Truck size={18} />
            </div>
          </div>
          <span className="kpi-value">{totalCodOutstanding.toLocaleString()} DA</span>
          <div className="kpi-trend positive">
            <span>To Collect</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-title-row">
            <span>Online Deposits (SofizPay)</span>
            <div className="kpi-icon-wrapper primary">
              <ShieldCheck size={18} />
            </div>
          </div>
          <span className="kpi-value">{totalOnlinePaid.toLocaleString()} DA</span>
          <div className="kpi-trend positive">
            <span>Secured Balance</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* COD vs Online Split Progress */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '8px' }}>COD vs. Online Payment Split</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Ratio of secured digital deposits vs cash collected at delivery to evaluate financial risk.
            </p>
          </div>
          
          <div className="split-progress-container">
            <div className="split-progress-bar">
              <div className="split-progress-online" style={{ width: `${onlinePercent}%` }}></div>
              <div className="split-progress-cod" style={{ width: `${codPercent}%` }}></div>
            </div>
            <div className="split-legend">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: 'var(--secondary)', width: '10px', height: '10px', borderRadius: '50%' }}></span>
                Online Deposits: {onlinePercent.toFixed(1)}% ({totalOnlinePaid.toLocaleString()} DA)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: 'var(--primary)', width: '10px', height: '10px', borderRadius: '50%' }}></span>
                COD Collection: {codPercent.toFixed(1)}% ({totalCodOutstanding.toLocaleString()} DA)
              </span>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '16px' }}>
            <span style={{ fontSize: '13px', display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
              💡 <span style={{ color: 'var(--text-primary)' }}>Risk Reduction Tip:</span> Require at least 500 DA online deposit to secure the shipping cost. This drops average COD delivery rejection rate from 35% to 5%!
            </span>
          </div>
        </div>

        {/* Sourcing Channel Analytics */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Sourcing Channels</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                  <Globe size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px' }}>AliExpress Dropshipping</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Direct import from China</span>
                </div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{aliexpressCount} Orders</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--secondary-light)', padding: '8px', borderRadius: '8px', color: 'var(--secondary)' }}>
                  <Warehouse size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px' }}>Local Wholesalers</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Domestic Algerian distributors</span>
                </div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{wholesalerCount} Orders</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '6px' }}><Clock size={12} /> Pending</div>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{pendingShip}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--info)', fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '6px' }}><Truck size={12} /> Shipped</div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--info)' }}>{shippedCount}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--success)', fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '6px' }}><CheckCircle size={12} /> Delivered</div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success)' }}>{deliveredCount}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--danger)', fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '6px' }}><XCircle size={12} /> Returned</div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--danger)' }}>{returnedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Recent Sourced Orders</h3>
          <Link href="/orders" style={{ fontSize: '13px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All Orders <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Wilaya</th>
                <th>Product</th>
                <th>Sourcing</th>
                <th>Total Price</th>
                <th>Method</th>
                <th>Payment Status</th>
                <th>Shipping Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => {
                const total = order.sellingPriceDzd + order.shippingPriceDzd;
                return (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{order.customerPhone}</div>
                    </td>
                    <td>{order.customerWilaya}</td>
                    <td>{order.productName}</td>
                    <td>
                      <span className={`badge ${order.source === 'ALIEXPRESS' ? 'badge-info' : 'badge-success'}`}>
                        {order.source === 'ALIEXPRESS' ? 'AliExpress' : 'Wholesaler'}
                      </span>
                    </td>
                    <td>{total.toLocaleString()} DA</td>
                    <td>{order.paymentMethod}</td>
                    <td>
                      <span className={`badge ${
                        order.paymentStatus === 'PAID' ? 'badge-success' : 
                        order.paymentStatus === 'PARTIALLY_PAID' ? 'badge-info' : 
                        order.paymentStatus === 'FAILED' ? 'badge-danger' : 
                        'badge-warning'
                      }`}>
                        {order.paymentStatus === 'PAID' ? 'Fully Paid' : 
                         order.paymentStatus === 'PARTIALLY_PAID' ? 'Deposit Paid' : 
                         order.paymentStatus === 'FAILED' ? 'Failed' : 
                         'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        order.shippingStatus === 'DELIVERED' ? 'badge-success' : 
                        order.shippingStatus === 'SHIPPED' ? 'badge-info' : 
                        order.shippingStatus === 'RETURNED' ? 'badge-danger' : 
                        order.shippingStatus === 'CANCELLED' ? 'badge-neutral' : 
                        'badge-warning'
                      }`}>
                        {order.shippingStatus}
                      </span>
                    </td>
                    <td>
                      {order.sofizPayCheckoutUrl && order.paymentStatus === 'PENDING' ? (
                        <Link href={order.sofizPayCheckoutUrl} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <LinkIcon size={12} /> Pay Link
                        </Link>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
