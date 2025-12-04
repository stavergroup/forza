import { getFirestore } from "firebase/firestore";
import { app } from "./firebaseClient";

export const db = getFirestore(app);