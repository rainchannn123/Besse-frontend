'use client';

import { Footer } from '@/components/layout/footer/Footer';
import { Header } from '@/components/layout/header/Header';
import { NotificationCenter } from '@/components/ui/notifications/NotificationCenter';
import { useNotificationStore } from '@/stores/notificationStore';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="min-h-screen flex flex-col bgColor">
      <Header />
      <main className="flex-1">{children}</main>
      <NotificationCenter
        notifications={notifications}
        onDismiss={removeNotification}
      />
      <Footer />
    </div>
  );
}
