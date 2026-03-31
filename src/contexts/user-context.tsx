import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import UserMockImage from "@/assets/images/mock/user-mock-image.png";

export type UserProfile = {
  fullName: string;
  displayName: string;
  cpf: string;
  phone: string;
  emailLocalPart: string;
  emailDomain: string;
  isCollector: boolean;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  stateCode: string;
  avatarImage: number;
};

type UserContextValue = {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
};

const mockUser: UserProfile = {
  fullName: "Christian Cesar Rodrigues Santos",
  displayName: "Christian Cesar",
  cpf: "084.145.652-58",
  phone: "(65) 9 9999-9999",
  emailLocalPart: "christian.rodrigues",
  emailDomain: "hotmail.com",
  isCollector: true,
  zipCode: "78700-000",
  street: "Rua A 144",
  number: "254",
  complement: "QD 485, LT 50",
  district: "Sao Cristovao",
  city: "Rondonopolis",
  state: "Mato Grosso",
  stateCode: "MT",
  avatarImage: UserMockImage,
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserProfile>(mockUser);

  const value = useMemo(
    () => ({
      user,
      updateUser: (updates: Partial<UserProfile>) => {
        setUser(current => ({ ...current, ...updates }));
      },
    }),
    [user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }

  return context;
}
