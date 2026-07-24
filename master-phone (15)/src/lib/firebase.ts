import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || rawConfig?.apiKey || "AIzaSyAJIdW6UbXNhxWFjh5tw0uCx0ZOyRA5kjs",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig?.authDomain || "jittery-force-c46tg.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || rawConfig?.projectId || "jittery-force-c46tg",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig?.storageBucket || "jittery-force-c46tg.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig?.messagingSenderId || "619667652346",
  appId: env.VITE_FIREBASE_APP_ID || rawConfig?.appId || "1:619667652346:web:ad0d3fc11a9cab1ab65343",
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || rawConfig?.firestoreDatabaseId || "ai-studio-masterphone-6c03a389-f202-4f7c-942d-cea614f84a1a"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc };

