import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { deleteUserData } from './firestore';

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return signOut(auth);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No hay usuario autenticado');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return updatePassword(user, newPassword);
}

export async function deleteAccount(currentPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No hay usuario autenticado');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await deleteUserData(user.uid);
  return deleteUser(user);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
