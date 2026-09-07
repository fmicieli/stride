import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TrainingPlan, TrainingSession, UserProfile } from '../types';

// ── USER ──
export async function saveUserProfile(uid: string, profile: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), profile, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── PLAN ──
export async function savePlan(uid: string, plan: TrainingPlan) {
  await setDoc(doc(db, 'users', uid, 'plan', 'active'), {
    ...plan,
    updatedAt: serverTimestamp(),
  });
}

export async function getPlan(uid: string): Promise<TrainingPlan | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'plan', 'active'));
  return snap.exists() ? (snap.data() as TrainingPlan) : null;
}

export async function deletePlan(uid: string) {
  await deleteDoc(doc(db, 'users', uid, 'plan', 'active'));
}

// ── SESSIONS ──
export async function saveSession(uid: string, session: TrainingSession) {
  await addDoc(collection(db, 'users', uid, 'sessions'), {
    ...session,
    createdAt: serverTimestamp(),
  });
}

export async function getSessions(uid: string): Promise<TrainingSession[]> {
  const q = query(
    collection(db, 'users', uid, 'sessions'),
    orderBy('date', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainingSession));
}

// ── STREAK ──
export async function saveStreak(uid: string, streak: number, lastDate: string) {
  await setDoc(
    doc(db, 'users', uid),
    { streak, lastSessionDate: lastDate },
    { merge: true },
  );
}

// ── DELETE ALL ──
export async function deleteUserData(uid: string) {
  await deleteDoc(doc(db, 'users', uid, 'plan', 'active'));
  const sessions = await getDocs(collection(db, 'users', uid, 'sessions'));
  await Promise.all(sessions.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'users', uid));
}
