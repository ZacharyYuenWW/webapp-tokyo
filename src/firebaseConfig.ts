import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDVjrwanMdUCo1JennBfHEdESicAgyjS6o",
  authDomain: "take-me-to-trip.firebaseapp.com",
  databaseURL: "https://take-me-to-trip-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "take-me-to-trip",
  storageBucket: "take-me-to-trip.firebasestorage.app",
  messagingSenderId: "641122283951",
  appId: "1:641122283951:web:700c153d83a35914523f5a",
  measurementId: "G-P8ESNKJT6J"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 取得 Realtime Database 實例
export const database = getDatabase(app);
