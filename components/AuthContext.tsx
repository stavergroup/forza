"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AuthContextValue = {
  user: any;
  profile: any;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logout, setLogout] = useState<() => Promise<void>>(async () => {});

  useEffect(() => {
    import("@/lib/firebaseClient").then(({ auth, db }) => {
      if (auth) {
        import("firebase/auth").then(({ onAuthStateChanged, signOut }) => {
          import("firebase/firestore").then(({ setDoc, getDoc, doc, serverTimestamp }) => {
            const unsub = onAuthStateChanged(auth, async (firebaseUser: any) => {
              console.log("[FORZA] Auth state changed:", firebaseUser ? `User: ${firebaseUser.uid}` : "No user");
              setUser(firebaseUser);
              setLoading(false);

              if (firebaseUser) {
                try {
                  console.log("[FORZA] Upserting user profile for", firebaseUser.uid);
                  const userRef = doc(db, "users", firebaseUser.uid);
                  const existingSnap = await getDoc(userRef);
                  const existing = existingSnap.exists() ? existingSnap.data() : null;
                  const data = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || null,
                    displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "FORZA user"),
                    photoURL: firebaseUser.photoURL || null,
                    handle: (firebaseUser.email ? firebaseUser.email.split("@")[0] : firebaseUser.uid.slice(0, 6)).toLowerCase(),
                    handleLower: ((firebaseUser.email ? firebaseUser.email.split("@")[0] : firebaseUser.uid.slice(0, 6)).toLowerCase()).toLowerCase(),
                    updatedAt: serverTimestamp(),
                    createdAt: existing?.createdAt ?? serverTimestamp()
                  };
                  await setDoc(userRef, data, { merge: true });
                  setProfile(data);
                  console.log("[FORZA] User profile upserted successfully");
                } catch (err) {
                  console.error("[FORZA] Failed to upsert user profile", err);
                }
              }
            });
            setLogout(() => async () => {
              await signOut(auth);
            });
            return () => unsub();
          });
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}