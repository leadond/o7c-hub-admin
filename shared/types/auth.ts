import { User as FirebaseUser } from "firebase/auth";

export type User = FirebaseUser; // Use Firebase type directly

export interface UserData {
  id: string;
  firebaseUid?: string;
  email: string;
  role: 'admin' | 'coach' | 'player' | 'parent';
  status: 'pending' | 'approved' | 'rejected';
  firstName?: string;
  lastName?: string;
  created_date: string;
  updated_date: string;
}

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  userDataLoading: boolean;
  isAuthorized: boolean;
  login: (email: string, password: string) => Promise<{
    user: User | null;
    userData: UserData | null;
  }>;
  logout: () => Promise<void>;
}