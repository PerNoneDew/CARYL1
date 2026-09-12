import { CustomerSidebar } from '../../components/customer/customer-sidebar';
import type { ReactNode } from 'react';

export function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <CustomerSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
    </div>
  );
}
