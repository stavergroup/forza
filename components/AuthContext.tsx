"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AuthContextValue = {
  user: any;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logout, setLogout] = useState<() => Promise<void>>(async () => {});

  useEffect(() => {
    import("@/lib/firebase").then(({ auth }) => {
      if (auth) {
        import("firebase/auth").then(({ onAuthStateChanged, signOut }) => {
          const unsub = onAuthStateChanged(auth, (firebaseUser: any) => {
            setUser(firebaseUser);
            setLoading(false);
          });
          setLogout(() => async () => {
            await signOut(auth);
          });
          return () => unsub();
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}