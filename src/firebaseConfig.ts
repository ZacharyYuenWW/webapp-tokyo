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
let database;
try {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // 如果 Firebase 初始化失敗，創建一個空的 database 物件避免崩潰
  database = null;
}

export { database };
