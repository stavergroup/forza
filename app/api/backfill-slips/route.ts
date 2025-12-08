import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export async function POST() {
  try {
    const slipsRef = collection(db, "slips");
    const slipsSnap = await getDocs(slipsRef);

    let updated = 0;

    for (const slipDoc of slipsSnap.docs) {
      const slipData = slipDoc.data();
      if (slipData.userDisplayName) continue; // already has it

      const userId = slipData.userId;
      if (!userId) continue;

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) continue;

      const userData = userSnap.data();
      const displayName = userData.displayName || "FORZA user";
      const username = userData.handle || "";
      const photoURL = userData.photoURL || null;

      await updateDoc(slipDoc.ref, {
        userDisplayName: displayName,
        userUsername: username,
        userPhotoURL: photoURL,
      });

      updated++;
    }

    return NextResponse.json({ message: `Updated ${updated} slips` });
  } catch (err) {
    console.error("[FORZA] backfill error:", err);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}