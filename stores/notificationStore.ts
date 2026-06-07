// store/notificationStore.ts
import { create } from 'zustand';
import { Notification } from '@/components/ui/notifications/NotificationCenter';

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;
}

let notificationId = 0;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = ++notificationId;
    const newNotification: Notification = { ...notification, id };
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));