import { subDays, subHours } from "date-fns";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  imageUrl?: string;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  toggleRead: (id: string) => void;
};

const mockNotifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Participe da campanha em sua região",
    message:
      "Lorem ipsum dolor sit amet consectetur. Nibh gravida at vehicula amet. Porttitor mauris nisl amet malesuada tristique.",
    createdAt: subHours(new Date(), 2),
    isRead: false,
    imageUrl:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "n-2",
    title: "Seu perfil foi atualizado",
    message:
      "As informações da sua conta foram alteradas com sucesso. Caso não reconheça essa ação, entre em contato.",
    createdAt: subHours(new Date(), 5),
    isRead: true,
    imageUrl:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "n-3",
    title: "Nova coleta disponível",
    message:
      "Encontramos uma nova coleta próxima da sua localização. Toque para conferir os detalhes completos.",
    createdAt: subDays(new Date(), 3),
    isRead: false,
    imageUrl:
      "https://images.unsplash.com/photo-1528323273322-d81458248d40?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "n-4",
    title: "Lembrete de separação",
    message:
      "Não se esqueça de separar recicláveis e orgânicos para facilitar a coleta seletiva desta semana.",
    createdAt: subDays(new Date(), 6),
    isRead: true,
  },
  {
    id: "n-5",
    title: "Campanha encerrando",
    message:
      "A campanha atual encerra em breve. Participe hoje para garantir sua contribuição e pontuação.",
    createdAt: subDays(new Date(), 18),
    isRead: false,
    imageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=400&auto=format&fit=crop",
  },
];

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(mockNotifications);

  const value = useMemo(
    () => ({
      notifications,
      markAsRead: (id: string) => {
        setNotifications(current =>
          current.map(notification =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
      },
      markAsUnread: (id: string) => {
        setNotifications(current =>
          current.map(notification =>
            notification.id === id
              ? { ...notification, isRead: false }
              : notification,
          ),
        );
      },
      toggleRead: (id: string) => {
        setNotifications(current =>
          current.map(notification =>
            notification.id === id
              ? { ...notification, isRead: !notification.isRead }
              : notification,
          ),
        );
      },
    }),
    [notifications],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }

  return context;
}
