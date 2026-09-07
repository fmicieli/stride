import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔑 Pegá acá tu configuración de Firebase
// Firebase Console → Configuración del proyecto → Tus apps → Web
const firebaseConfig = {
  apiKey: 'AIzaSyCmqIGb2pjplIZq7VFWInrS_hEi_9ezfUk',
  authDomain: 'runapp-1b089.firebaseapp.com',
  projectId: 'runapp-1b089',
  storageBucket: 'runapp-1b089.firebasestorage.app',
  messagingSenderId: '549514977305',
  appId: '1:549514977305:web:70743e96f57a04be7a0a88',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
