'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Link as LinkIcon, RefreshCw, User } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
    { name: 'COD Bridge', href: '/cod-bridge', icon: LinkIcon },
    { name: 'Reconciliation', href: '/reconcile', icon: RefreshCw },
  ];

  // Don't render sidebar on the customer facing checkout page
  if (pathname.startsWith('/checkout/')) {
    return null;
  }

  return (
    <div className="sidebar">
      <div className="logo-section">
        <div className="logo-icon">Dz</div>
        <div className="logo-text">DzDropship</div>
      </div>
      
      <nav className="nav-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="nav-footer">
        <div className="reseller-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="profile-info">
            <span className="profile-name">DZ Reseller</span>
            <span className="profile-role">Algerian Merchant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
