import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { database } from './src/firebaseConfig';
import { ref, onValue, set, push, remove } from 'firebase/database';

// 修復 Leaflet 圖標問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Activity {
  id: string;
  time: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  type: 'attraction' | 'restaurant' | 'hotel' | 'transport';
  duration: string;
  cost: { min: number; max: number };
  bookingUrl?: string;
  description?: string;
  actualBudget?: number;
}

interface DaySchedule {
  date: string;
  day: number;
  activities: Activity[];
  transportNotes?: string;
  estimatedBudget?: number;
}

const initialSchedule: DaySchedule[] = [
  {
    date: '3月10日',
    day: 1,
    activities: [
      { id: '1-1', time: '09:05', name: '香港國際機場', location: '香港', lat: 22.3080, lng: 113.9185, type: 'transport', duration: '1小時30分', cost: { min: 0, max: 0 } },
      { id: '1-2', time: '14:10', name: '成田國際機場', location: '東京', lat: 35.7720, lng: 140.3929, type: 'transport', duration: '1小時30分', cost: { min: 0, max: 0 } },
      { id: '1-3', time: '16:55', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '1-4', time: '18:01', name: '新宿站西口', location: '新宿區', lat: 35.6896, lng: 139.6917, type: 'attraction', duration: '15分鐘', cost: { min: 0, max: 0 } },
      { id: '1-5', time: '20:00', name: 'Yakiniku hormone Bondz Ikebukuro honkan', location: '池袋', lat: 35.7295, lng: 139.7109, type: 'restaurant', duration: '2小時', cost: { min: 0, max: 0 } },
      { id: '1-6', time: '22:17', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  },
  {
    date: '3月11日',
    day: 2,
    activities: [
      { id: '2-1', time: '08:30', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '0分鐘', cost: { min: 0, max: 0 } },
      { id: '2-2', time: '09:03', name: '櫻神宮', location: '世田谷區', lat: 35.6545, lng: 139.6503, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '2-3', time: '10:13', name: '世田谷 豪德寺', location: '世田谷區', lat: 35.6564, lng: 139.6476, type: 'attraction', duration: '1小時30分', cost: { min: 0, max: 0 } },
      { id: '2-4', time: '12:14', name: '壽司 Tokyo Ten 新宿店', location: '新宿', lat: 35.6938, lng: 139.7006, type: 'restaurant', duration: '2小時', cost: { min: 0, max: 0 } },
      { id: '2-5', time: '14:24', name: 'OttersFamily Otter Petting', location: '澀谷區', lat: 35.6618, lng: 139.7038, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '2-6', time: '15:30', name: 'KALEDOTOWER', location: '港區', lat: 35.6586, lng: 139.7454, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '2-7', time: '16:32', name: '神谷町', location: '港區', lat: 35.6598, lng: 139.7453, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '2-8', time: '17:51', name: '寶可夢中心涉谷店', location: '澀谷區', lat: 35.6618, lng: 139.6983, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '2-9', time: '18:57', name: 'Salmon Bowl Kumada', location: '澀谷', lat: 35.6618, lng: 139.7006, type: 'restaurant', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '2-10', time: '20:00', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  },
  {
    date: '3月12日',
    day: 3,
    activities: [
      { id: '3-1', time: '08:00', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-2', time: '09:30', name: '和服出租 八重', location: '台東區', lat: 35.7148, lng: 139.7967, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-3', time: '10:35', name: '淺草寺 雷門', location: '台東區', lat: 35.7148, lng: 139.7967, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-4', time: '11:37', name: '三麗鷗專賣店 淺草店', location: '台東區', lat: 35.7120, lng: 139.7958, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-5', time: '12:40', name: 'Asakusa Unana', location: '台東區', lat: 35.7120, lng: 139.7969, type: 'restaurant', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-6', time: '14:00', name: '隅田公園', location: '墨田區', lat: 35.7118, lng: 139.8065, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-7', time: '15:17', name: '光(ひかる) 壽司', location: '台東區', lat: 35.7100, lng: 139.7950, type: 'restaurant', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-8', time: '16:33', name: '上野恩賜公園', location: '台東區', lat: 35.7148, lng: 139.7737, type: 'attraction', duration: '2小時', cost: { min: 0, max: 0 } },
      { id: '3-9', time: '17:00', name: '淺草寺 雷門', location: '台東區', lat: 35.7148, lng: 139.7967, type: 'attraction', duration: '30分鐘', cost: { min: 0, max: 0 } },
      { id: '3-10', time: '17:32', name: '和服出租 八重', location: '台東區', lat: 35.7148, lng: 139.7967, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-11', time: '19:03', name: 'GYRE', location: '澀谷區', lat: 35.6654, lng: 139.7103, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-12', time: '20:25', name: '寶可夢中心東京店DX', location: '中央區', lat: 35.6764, lng: 139.7706, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '3-13', time: '21:52', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  },
  {
    date: '3月13日',
    day: 4,
    activities: [
      { id: '4-1', time: '06:00', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '4-2', time: '07:50', name: '三井住友銀行 新宿西口支店', location: '新宿區', lat: 35.6910, lng: 139.6989, type: 'transport', duration: '10分鐘', cost: { min: 0, max: 0 } },
      { id: '4-3', time: '10:00', name: '富士山山中湖', location: '山梨縣', lat: 35.4221, lng: 138.8662, type: 'attraction', duration: '40分鐘', cost: { min: 0, max: 0 } },
      { id: '4-4', time: '11:00', name: '忍野八海', location: '山梨縣', lat: 35.4561, lng: 138.8448, type: 'attraction', duration: '1小時10分', cost: { min: 0, max: 0 } },
      { id: '4-5', time: '12:40', name: '大石公園', location: '山梨縣', lat: 35.5025, lng: 138.7397, type: 'attraction', duration: '40分鐘', cost: { min: 0, max: 0 } },
      { id: '4-6', time: '13:30', name: '羅森便利商店 富士河口湖町公所前店', location: '山梨縣', lat: 35.5025, lng: 138.7650, type: 'restaurant', duration: '20分鐘', cost: { min: 0, max: 0 } },
      { id: '4-7', time: '14:10', name: '新倉山淺間公園', location: '山梨縣', lat: 35.4993, lng: 138.7929, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '4-8', time: '15:10', name: '日川時計店', location: '山梨縣', lat: 35.4993, lng: 138.7929, type: 'attraction', duration: '20分鐘', cost: { min: 0, max: 0 } },
      { id: '4-9', time: '18:00', name: '三井住友銀行 新宿西口支店', location: '新宿區', lat: 35.6910, lng: 139.6989, type: 'transport', duration: '10分鐘', cost: { min: 0, max: 0 } },
      { id: '4-10', time: '18:30', name: 'RACINES', location: '港區', lat: 35.6586, lng: 139.7454, type: 'restaurant', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '4-11', time: '19:53', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  },
  {
    date: '3月14日',
    day: 5,
    activities: [
      { id: '5-1', time: '08:00', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '5-2', time: '09:14', name: '池袋 PARCO 本館', location: '豐島區', lat: 35.7295, lng: 139.7115, type: 'attraction', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '5-3', time: '10:24', name: 'LUMINE池袋', location: '豐島區', lat: 35.7295, lng: 139.7109, type: 'attraction', duration: '2小時', cost: { min: 0, max: 0 } },
      { id: '5-4', time: '12:27', name: 'GINTO Ikebukuro', location: '豐島區', lat: 35.7290, lng: 139.7103, type: 'restaurant', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '5-5', time: '13:41', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '5-6', time: '15:23', name: '東京灣Emion飯店', location: '千葉縣', lat: 35.6433, lng: 139.8845, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  },
  {
    date: '3月15日',
    day: 6,
    activities: [
      { id: '6-1', time: '08:00', name: '東京灣Emion飯店', location: '千葉縣', lat: 35.6433, lng: 139.8845, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '6-2', time: '09:12', name: '東京迪士尼海洋', location: '千葉縣', lat: 35.6262, lng: 139.8893, type: 'attraction', duration: '12小時', cost: { min: 0, max: 0 } },
      { id: '6-3', time: '21:24', name: '東京灣Emion飯店', location: '千葉縣', lat: 35.6433, lng: 139.8845, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '6-4', time: '23:04', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  },
  {
    date: '3月16日',
    day: 7,
    activities: [
      { id: '7-1', time: '08:00', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '7-2', time: '10:21', name: '鐮倉站 [東口]', location: '神奈川縣', lat: 35.3190, lng: 139.5506, type: 'transport', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '7-3', time: '11:42', name: '魚見亭', location: '神奈川縣', lat: 35.3000, lng: 139.5364, type: 'restaurant', duration: '1小時30分', cost: { min: 0, max: 0 } },
      { id: '7-4', time: '14:36', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  },
  {
    date: '3月17日',
    day: 8,
    activities: [
      { id: '8-1', time: '08:00', name: '東橫INN 東京新宿歌舞伎町', location: '新宿區', lat: 35.6938, lng: 139.7036, type: 'hotel', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '8-2', time: '17:00', name: '成田國際機場', location: '東京', lat: 35.7720, lng: 140.3929, type: 'transport', duration: '1小時', cost: { min: 0, max: 0 } },
      { id: '8-3', time: '22:30', name: '香港國際機場', location: '香港', lat: 22.3080, lng: 113.9185, type: 'transport', duration: '1小時', cost: { min: 0, max: 0 } },
    ]
  }
];

const STORAGE_KEY = 'japan_trip_schedule';
const TRIPS_LIST_KEY = 'japan_trips_list';
const CURRENT_TRIP_ID_KEY = 'japan_current_trip_id';

function loadSchedule(): DaySchedule[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 直接返回已存儲的資料，不自動重置
      return parsed;
    }
    return initialSchedule;
  } catch {
    return initialSchedule;
  }
}

function saveSchedule(schedule: DaySchedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

const CHECKLIST_KEY = 'japan_trip_checklist';
const EXPENSES_KEY = 'japan_trip_expenses';
const PERSONS_KEY = 'japan_trip_persons';
const CHECKLIST_USERS_KEY = 'japan_trip_checklist_users';

interface ChecklistItem {
  id: string;
  name: string;
  checkedMale: boolean;
  checkedFemale: boolean;
  checkedUsers?: { [userId: string]: boolean };
}

interface ChecklistUser {
  id: string;
  name: string;
  emoji: string;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: '飲食' | '交通' | '購物';
  type: '自費' | '公家' | '送贈';
  person: string;
  amount: number;
  currency: string;
  description: string;
  recipient?: string;
}

interface Person {
  id: string;
  name: string;
  emoji: string;
}

const initialChecklist: ChecklistItem[] = [
  { id: 'c1', name: 'HKID card 香港身分證', checkedMale: false, checkedFemale: false },
  { id: 'c2', name: 'Passport 護照', checkedMale: false, checkedFemale: false },
  { id: 'c3', name: 'USD, HKD, card 錢、卡', checkedMale: false, checkedFemale: false },
  { id: 'c4', name: 'retainer 牙夾', checkedMale: false, checkedFemale: false },
  { id: 'c5', name: 'shower filter 淋浴過濾器', checkedMale: false, checkedFemale: false },
  { id: 'c6', name: 'powerbank 行動電源', checkedMale: false, checkedFemale: false },
  { id: 'c7', name: 'charger 充電器', checkedMale: false, checkedFemale: false },
  { id: 'c8', name: 'conversion plug 轉換插頭', checkedMale: false, checkedFemale: false },
  { id: 'c9', name: 'tissues + wet tissues 紙巾+濕紙巾', checkedMale: false, checkedFemale: false },
  { id: 'c10', name: 'insect repellent 驅蟲劑', checkedMale: false, checkedFemale: false },
  { id: 'c11', name: 'portable fan 便攜式風扇', checkedMale: false, checkedFemale: false },
  { id: 'c12', name: 'shampoo + conditioner 洗髮+護髮素', checkedMale: false, checkedFemale: false },
  { id: 'c13', name: 'hair mask', checkedMale: false, checkedFemale: false },
  { id: 'c14', name: 'toothbrush', checkedMale: false, checkedFemale: false },
  { id: 'c15', name: 'facewash, lotion 洗面乳、乳液', checkedMale: false, checkedFemale: false },
  { id: 'c16', name: 'umbrella 雨傘', checkedMale: false, checkedFemale: false },
  { id: 'c17', name: 'sunscreen 防曬乳', checkedMale: false, checkedFemale: false },
  { id: 'c18', name: 'clothings 衣服', checkedMale: false, checkedFemale: false },
  { id: 'c19', name: 'swimsuits 泳衣', checkedMale: false, checkedFemale: false },
  { id: 'c20', name: 'undies 內衣', checkedMale: false, checkedFemale: false },
  { id: 'c21', name: 'boob sticker 胸貼', checkedMale: false, checkedFemale: false },
  { id: 'c22', name: 'hat 帽子', checkedMale: false, checkedFemale: false },
  { id: 'c23', name: 'perfume 香水', checkedMale: false, checkedFemale: false },
  { id: 'c24', name: 'hair straightener 直髮器', checkedMale: false, checkedFemale: false },
  { id: 'c25', name: 'hair curler 捲髮器', checkedMale: false, checkedFemale: false },
  { id: 'c26', name: 'hair spray + bang holder', checkedMale: false, checkedFemale: false },
  { id: 'c27', name: 'makeup 化妝品', checkedMale: false, checkedFemale: false },
  { id: 'c28', name: 'makeup brush 化妝刷', checkedMale: false, checkedFemale: false },
  { id: 'c29', name: 'makeup remover 卸妝液', checkedMale: false, checkedFemale: false },
  { id: 'c30', name: 'shoes (Slippers) 鞋子（拖鞋）', checkedMale: false, checkedFemale: false },
  { id: 'c31', name: 'selfie stick 自拍桿', checkedMale: false, checkedFemale: false },
  { id: 'c32', name: 'light jacket 輕便夾克', checkedMale: false, checkedFemale: false },
  { id: 'c33', name: 'bag 包包', checkedMale: false, checkedFemale: false },
  { id: 'c34', name: 'flower clips 花夾', checkedMale: false, checkedFemale: false },
  { id: 'c35', name: 'wifi card WiFi卡', checkedMale: false, checkedFemale: false },
  { id: 'c36', name: 'con', checkedMale: false, checkedFemale: false },
  { id: 'c37', name: 'alcohol pad 酒精棉片', checkedMale: false, checkedFemale: false },
  { id: 'c38', name: 'medicine 藥品', checkedMale: false, checkedFemale: false },
  { id: 'c39', name: 'hair brush 梳子', checkedMale: false, checkedFemale: false },
];

function loadChecklist(): ChecklistItem[] {
  try {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    return saved ? JSON.parse(saved) : initialChecklist;
  } catch {
    return initialChecklist;
  }
}

function loadExpenses(): ExpenseRecord[] {
  try {
    const saved = localStorage.getItem(EXPENSES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 確保返回的是有效陣列
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item === 'object');
      }
    }
    return [];
  } catch {
    return [];
  }
}

const initialPersons: Person[] = [
  { id: 'p1', name: 'Claudia', emoji: '👩' },
  { id: 'p2', name: 'Zachary', emoji: '👨' },
];

function loadPersons(): Person[] {
  try {
    const saved = localStorage.getItem(PERSONS_KEY);
    return saved ? JSON.parse(saved) : initialPersons;
  } catch {
    return initialPersons;
  }
}

const initialChecklistUsers: ChecklistUser[] = [
  { id: 'cu1', name: 'Zachary', emoji: '👨' },
  { id: 'cu2', name: 'Claudia', emoji: '👩' },
];

function loadChecklistUsers(): ChecklistUser[] {
  try {
    const saved = localStorage.getItem(CHECKLIST_USERS_KEY);
    return saved ? JSON.parse(saved) : initialChecklistUsers;
  } catch {
    return initialChecklistUsers;
  }
}

interface Trip {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  data: {
    schedule: DaySchedule[];
    checklist: ChecklistItem[];
    expenses: ExpenseRecord[];
    persons: Person[];
    checklistUsers: ChecklistUser[];
    flights: FlightInfo[];
    tripSettings: TripSettings;
    exchangeRate: number;
    scheduleHistory?: DaySchedule[][];
  };
}

interface TripSettings {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
}

interface FlightInfo {
  id: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  departureAirport: string;
  arrivalAirport: string;
  airline: string;
  flightNumber: string;
  terminal?: string;
  luggageLimit?: number;
}

const TRIP_SETTINGS_KEY = 'japan_trip_settings';
const FLIGHTS_KEY = 'japan_trip_flights';

const initialTripSettings: TripSettings = {
  title: '🗾 日本七天遊',
  subtitle: '精心規劃的東京之旅',
  startDate: '2026-03-10',
  endDate: '2026-03-17',
};

const initialFlights: FlightInfo[] = [
  {
    id: 'f1',
    date: '2026-03-10',
    departureTime: '09:05',
    arrivalTime: '14:10',
    duration: '4小時5分鐘',
    departureAirport: 'HONG KONG INTERNATIONAL AIRPORT T1',
    arrivalAirport: 'NRT T2',
    airline: '國泰航空',
    flightNumber: 'CX 504',
    luggageLimit: 23,
  },
  {
    id: 'f2',
    date: '2026-03-17',
    departureTime: '18:00',
    arrivalTime: '22:20',
    duration: '5小時4分鐘',
    departureAirport: 'NRT T2',
    arrivalAirport: 'HONG KONG INTERNATIONAL AIRPORT T1',
    airline: '國泰航空',
    flightNumber: 'CX 505',
    luggageLimit: 23,
  },
];

function loadTripSettings(): TripSettings {
  try {
    const saved = localStorage.getItem(TRIP_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : initialTripSettings;
  } catch {
    return initialTripSettings;
  }
}

function loadFlights(): FlightInfo[] {
  try {
    const saved = localStorage.getItem(FLIGHTS_KEY);
    return saved ? JSON.parse(saved) : initialFlights;
  } catch {
    return initialFlights;
  }
}

// 地圖飛行組件
const MapFlyTo: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const ItemType = 'ACTIVITY';

const DraggableActivity: React.FC<{
  activity: Activity;
  index: number;
  dayIndex: number;
  moveActivity: (fromDay: number, fromIndex: number, toDay: number, toIndex: number) => void;
  onLocationClick: (lat: number, lng: number) => void;
  onBudgetUpdate?: (dayIndex: number, activityIndex: number, budget: number) => void;
  onCostUpdate?: (dayIndex: number, activityIndex: number, minCost: number, maxCost: number) => void;
}> = ({ activity, index, dayIndex, moveActivity, onLocationClick, onBudgetUpdate, onCostUpdate }) => {
  const [editingBudget, setEditingBudget] = React.useState(false);
  const [tempBudget, setTempBudget] = React.useState(activity.actualBudget || 0);
  const [editingCost, setEditingCost] = React.useState(false);
  const [tempMinCost, setTempMinCost] = React.useState(activity.cost.min);
  const [tempMaxCost, setTempMaxCost] = React.useState(activity.cost.max);
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { dayIndex, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { dayIndex: number; index: number }) => {
      if (item.dayIndex !== dayIndex || item.index !== index) {
        moveActivity(item.dayIndex, item.index, dayIndex, index);
        item.dayIndex = dayIndex;
        item.index = index;
      }
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attraction': return '🏛️';
      case 'restaurant': return '🍽️';
      case 'hotel': return '🏨';
      case 'transport': return '🚗';
      default: return '📍';
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        background: 'linear-gradient(135deg, #FFFFF0 0%, #F8F9FA 100%)',
        padding: '16px',
        marginBottom: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(176, 190, 197, 0.2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>{getTypeIcon(activity.type)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
            <div>
              <span style={{ color: '#B0BEC5', fontSize: '14px', fontWeight: '500' }}>{activity.time}</span>
              <h4 style={{ margin: '4px 0', color: '#2C3E50', fontFamily: '"Noto Serif TC", serif', fontSize: '18px' }}>
                {activity.name}
              </h4>
              <p style={{ margin: '2px 0', color: '#7F8C8D', fontSize: '13px' }}>
                📍 <span
                  onClick={() => onLocationClick(activity.lat, activity.lng)}
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: '#457B9D' }}
                >
                  {activity.location}
                </span> · ⏱️ {activity.duration}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {editingCost ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: '#7F8C8D' }}>HK$</span>
                  <input
                    type="number"
                    value={tempMinCost}
                    onChange={(e) => setTempMinCost(parseFloat(e.target.value) || 0)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '60px',
                      padding: '4px 6px',
                      border: '1px solid #D4AF37',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                    autoFocus
                  />
                  <span style={{ fontSize: '12px' }}>-</span>
                  <input
                    type="number"
                    value={tempMaxCost}
                    onChange={(e) => setTempMaxCost(parseFloat(e.target.value) || 0)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '60px',
                      padding: '4px 6px',
                      border: '1px solid #D4AF37',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCostUpdate?.(dayIndex, index, tempMinCost, tempMaxCost);
                      setEditingCost(false);
                    }}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCost(false);
                      setTempMinCost(activity.cost.min);
                      setTempMaxCost(activity.cost.max);
                    }}
                    style={{
                      background: '#ff6b6b',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCost(true);
                  }}
                  style={{ 
                    cursor: 'pointer', 
                    color: '#D4AF37', 
                    fontWeight: '600', 
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span>HK${activity.cost.min}-${activity.cost.max}</span>
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>✎</span>
                </div>
              )}
            </div>
          </div>
          {activity.bookingUrl && (
            <a
              href={activity.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                transition: 'all 0.3s ease',
              }}
            >
              🔗 即時訂位
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(loadSchedule);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showMap, setShowMap] = useState(true);
  const [editingActivity, setEditingActivity] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [editForm, setEditForm] = useState<Partial<Activity>>({});
  const [currentView, setCurrentView] = useState<'schedule' | 'checklist' | 'expenses' | 'flights' | 'settings' | 'trips'>('schedule');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(loadChecklist);
// expenses state removed
  // const [expenses, setExpenses] = useState<ExpenseRecord[]>(loadExpenses);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6762, 139.6503]);
  const [mapZoom, setMapZoom] = useState(12);
  const [exchangeRate, setExchangeRate] = useState(0.052); // JPY to HKD
  const [sortBy, setSortBy] = useState<'default' | 'time' | 'name' | 'type'>('default');
  const [tripSettings, setTripSettings] = useState<TripSettings>(loadTripSettings);
  const [flights, setFlights] = useState<FlightInfo[]>(loadFlights);
  const [persons, setPersons] = useState<Person[]>(loadPersons);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmoji, setNewPersonEmoji] = useState('👤');
  const [checklistUsers, setChecklistUsers] = useState<ChecklistUser[]>(loadChecklistUsers);
  const [newChecklistUserName, setNewChecklistUserName] = useState('');
  const [newChecklistUserEmoji, setNewChecklistUserEmoji] = useState('👤');
  const [deleteDayMode, setDeleteDayMode] = useState(false);
  const [selectedDaysToDelete, setSelectedDaysToDelete] = useState<number[]>([]);
  const [editingBudget, setEditingBudget] = useState<number | null>(null);
  const [tempBudget, setTempBudget] = useState<number>(0);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showTransportInfo, setShowTransportInfo] = useState<string | null>(null);
  const [transportRouteInfo, setTransportRouteInfo] = useState<{[key: string]: string}>({});
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);
  const [scheduleHistory, setScheduleHistory] = useState<DaySchedule[][]>([]);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  // 用於防止 Firebase 同步覆蓋本地更改
  const isLocalChangeRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const [currentTripId, setCurrentTripId] = useState<string>(() => {
    return localStorage.getItem(CURRENT_TRIP_ID_KEY) || 'default-trip';
  });
  const [allTrips, setAllTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem(TRIPS_LIST_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 確保所有 trip 數據都有預設值
        return parsed.map((trip: Trip) => ({
          ...trip,
          data: {
            schedule: trip.data?.schedule || [],
            checklist: trip.data?.checklist || [],
            expenses: trip.data?.expenses || [],
            persons: trip.data?.persons || initialPersons,
            checklistUsers: trip.data?.checklistUsers || [],
            flights: trip.data?.flights || [],
            tripSettings: trip.data?.tripSettings || initialTripSettings,
            exchangeRate: trip.data?.exchangeRate || 0.052,
            scheduleHistory: trip.data?.scheduleHistory || [],
          },
        }));
      } catch {
        // 解析失敗，創建默認旅程
      }
    }
    // 創建默認旅程（使用安全的空陣列）
    const defaultTrip: Trip = {
      id: 'default-trip',
      name: '日本之旅',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      data: {
        schedule: initialSchedule,
        checklist: [],
        expenses: [],
        persons: initialPersons,
        checklistUsers: initialChecklistUsers,
        flights: [],
        tripSettings: initialTripSettings,
        exchangeRate: 0.052,
        scheduleHistory: [],
      },
    };
    return [defaultTrip];
  });

  // 自動儲存到 localStorage
  useEffect(() => {
    saveSchedule(schedule);
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
  }, [checklist]);

//   useEffect(() => {
// // localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
//   }, [expenses]);

  useEffect(() => {
    localStorage.setItem(TRIP_SETTINGS_KEY, JSON.stringify(tripSettings));
  }, [tripSettings]);

  useEffect(() => {
    localStorage.setItem(FLIGHTS_KEY, JSON.stringify(flights));
  }, [flights]);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_USERS_KEY, JSON.stringify(checklistUsers));
  }, [checklistUsers]);

  // 深層將 undefined 轉換為 null 或移除（Firebase 不接受 undefined）
  const removeUndefined = (obj: any): any => {
    if (obj === undefined) return null;  // undefined 轉為 null
    if (obj === null) return null;
    
    if (Array.isArray(obj)) {
      // 過濾掉 undefined/null 的陣列項目，並遞歸清理
      return obj
        .filter(item => item !== undefined && item !== null)
        .map(item => removeUndefined(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          // 跳過 undefined 值（不寫入該欄位）
          if (value === undefined) {
            continue;
          }
          // 遞歸清理
          const cleanedValue = removeUndefined(value);
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    }
    
    return obj;
  };

  // 清理支出記錄，確保所有欄位都有有效值（Firebase 不接受 undefined）
  const cleanExpenseRecord = (exp: any): ExpenseRecord | null => {
    if (!exp || typeof exp !== 'object') return null;
    return {
      id: exp.id || `e${Date.now()}`,
      date: exp.date || new Date().toISOString().split('T')[0],
      category: exp.category || '飲食',
      type: exp.type || '自費',
      person: exp.person || '',
      amount: typeof exp.amount === 'number' ? exp.amount : 0,
      currency: exp.currency || 'JPY',
      description: exp.description || '',
      recipient: exp.recipient || '',  // 使用空字串，不用 null 或 undefined
    };
  };

  // 確保陣列安全（不是 undefined 或 null）
  const ensureArray = <T,>(arr: T[] | undefined | null, defaultValue: T[] = []): T[] => {
    if (!arr || !Array.isArray(arr)) return defaultValue;
    return arr;
  };

  // 保存當前旅程數據到 Firebase
  const saveCurrentTrip = () => {
    // 標記這是本地更改，防止 Firebase 監聽器覆蓋
    isLocalChangeRef.current = true;
    lastSaveTimeRef.current = Date.now();
    
    // 確保所有數據都有預設值，避免 undefined
    // 特別清理 expenses 陣列，確保每個項目都有有效值
    // expenses removed
    const safeExpenses: ExpenseRecord[] = [];
    
    const safeSchedule = ensureArray(schedule, []);
    const safeChecklist = ensureArray(checklist, []);
    const safePersons = ensureArray(persons, initialPersons);
    const safeChecklistUsers = ensureArray(checklistUsers, []);
    const safeFlights = ensureArray(flights, []);
    const safeScheduleHistory = ensureArray(scheduleHistory, []);

    // 構建安全的數據對象
    const safeData = {
      schedule: safeSchedule,
      checklist: safeChecklist,
      expenses: safeExpenses,
      persons: safePersons,
      checklistUsers: safeChecklistUsers,
      flights: safeFlights,
      tripSettings: tripSettings || initialTripSettings,
      exchangeRate: typeof exchangeRate === 'number' ? exchangeRate : 0.052,
      scheduleHistory: safeScheduleHistory,
    };
    
    // 先用 removeUndefined 清理整個 safeData
    const cleanedSafeData = removeUndefined(safeData);

    const updatedTrips = allTrips.map(trip => {
      if (trip.id === currentTripId) {
        return {
          ...trip,
          name: tripSettings?.title || trip.name || '新旅程',
          lastModified: new Date().toISOString(),
          data: cleanedSafeData,  // 使用已清理的數據
        };
      }
      return trip;
    });
    setAllTrips(updatedTrips);
    
    // 同時保存到 localStorage（作為備份）
    localStorage.setItem(TRIPS_LIST_KEY, JSON.stringify(updatedTrips));
    
    // 保存到 Firebase（如果已初始化）
    if (database) {
      try {
        updatedTrips.forEach(trip => {
          const tripRef = ref(database, `trips/${trip.id}`);
          
          // 為保險起見，我們手動構建要保存的對象，而不依賴可能含有隱藏 undefined 的舊對象
          // 這樣可以確保結構完全正確
          
          // 如果是當前旅程，我們已經有了清理過的 safeData
          let dataToSave;
          
          if (trip.id === currentTripId) {
             dataToSave = {
              ...trip,
              data: cleanedSafeData
             };
          } else {
             // 對於其他旅程，我們也需要確保 data 屬性存在且乾淨，並移除 expenses
             const cleanedData = trip.data ? removeUndefined(trip.data) : {};
             if (cleanedData && typeof cleanedData === 'object') {
                cleanedData.expenses = [];
             }
             dataToSave = {
               ...trip,
               data: cleanedData
             };
          }

          // 最後一道防線：JSON 序列化清理
          // 注意：JSON.stringify 會忽略 undefined 的鍵，將 array 中的 undefined 轉為 null
          // 這正是 Firebase 想要的行為（除了 array 中的 null 可能不是我們想要的，但比 error 好）
          const finalCleanedTrip = JSON.parse(JSON.stringify(dataToSave));
          
          set(tripRef, finalCleanedTrip);
        });
        
        // 更新當前旅程 ID
        const currentTripRef = ref(database, 'sharedData/currentTripId');
        set(currentTripRef, currentTripId);
        
        console.log('數據已保存到 Firebase');
      } catch (error) {
        console.error('Firebase 保存失敗:', error);
      }
    }
    
    // 3秒後重置標誌，允許接收其他用戶的更新
    setTimeout(() => {
      isLocalChangeRef.current = false;
    }, 3000);
  };

  // 自動保存當前旅程（防抖：500ms 內的多次更改只保存一次）
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentTrip();
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [schedule, checklist, persons, checklistUsers, flights, tripSettings, exchangeRate, scheduleHistory]);

  // 監聯 Firebase 數據變化（即時同步）
  useEffect(() => {
    // 如果 Firebase 未初始化，跳過
    if (!database) {
      console.warn('Firebase not initialized, using local storage only');
      setFirebaseConnected(false);
      return;
    }

    try {
      const tripsRef = ref(database, 'trips');
      
      const unsubscribe = onValue(tripsRef, (snapshot) => {
        setFirebaseConnected(true);
        
        // 如果是本地更改剛保存的，跳過這次更新（防止覆蓋）
        const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
        if (isLocalChangeRef.current && timeSinceLastSave < 3000) {
          console.log('跳過 Firebase 更新（本地更改中）');
          return;
        }
        
        if (snapshot.exists()) {
          const firebaseTrips = snapshot.val();
          const tripsArray = (Object.values(firebaseTrips) as Trip[]).map(trip => ({
            ...trip,
            data: {
              schedule: trip.data?.schedule || [],
              checklist: trip.data?.checklist || [],
              expenses: trip.data?.expenses || [],
              persons: trip.data?.persons || initialPersons,
              checklistUsers: trip.data?.checklistUsers || [],
              flights: trip.data?.flights || [],
              tripSettings: trip.data?.tripSettings || initialTripSettings,
              exchangeRate: trip.data?.exchangeRate || 0.052,
              scheduleHistory: trip.data?.scheduleHistory || [],
            },
          }));
          
          // 更新本地狀態
          setAllTrips(tripsArray);
          localStorage.setItem(TRIPS_LIST_KEY, JSON.stringify(tripsArray));
          
          // 如果當前旅程在 Firebase 中有更新，同步到本地
          const currentTrip = tripsArray.find(t => t.id === currentTripId);
          if (currentTrip && currentTrip.data) {
            console.log('從 Firebase 同步數據');
            setSchedule(currentTrip.data.schedule || []);
            setChecklist(currentTrip.data.checklist || []);
            // setExpenses removed
            setPersons(currentTrip.data.persons || initialPersons);
            setChecklistUsers(currentTrip.data.checklistUsers || []);
            setFlights(currentTrip.data.flights || []);
            setTripSettings(currentTrip.data.tripSettings || initialTripSettings);
            setExchangeRate(currentTrip.data.exchangeRate || 0.052);
            setScheduleHistory(currentTrip.data.scheduleHistory || []);
          }
        } else {
          // Firebase 沒有數據，上傳本地數據
          console.log('Firebase 沒有數據，上傳本地數據');
          saveCurrentTrip();
        }
      }, (error) => {
        console.error('Firebase 讀取失敗:', error);
        setFirebaseConnected(false);
      });

      // 清理監聽器
      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase setup error:', error);
      setFirebaseConnected(false);
    }
  }, [currentTripId]);

  // 創建新旅程
  const createNewTrip = (name: string) => {
    // 先保存當前旅程
    saveCurrentTrip();
    
    const startDate = new Date();
    const emptySchedule: DaySchedule[] = Array.from({ length: 8 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        day: i + 1,
        date: date.toISOString().split('T')[0],
        activities: [],
        estimatedBudget: 0,
        transportNotes: '',
      };
    });

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      name: name || '新旅程',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      data: {
        schedule: emptySchedule,
        checklist: [],
        expenses: [],
        persons: [
          { id: '1', name: '男仔', emoji: '👨' },
          { id: '2', name: '女仔', emoji: '👩' },
        ],
        checklistUsers: [
          { id: '1', name: '男仔', emoji: '👨' },
          { id: '2', name: '女仔', emoji: '👩' },
        ],
        flights: [],
        scheduleHistory: [],
        tripSettings: {
          title: name || '新旅程',
          subtitle: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        exchangeRate: 0.052,
      },
    };
    
    const updatedTrips = [...allTrips, newTrip];
    setAllTrips(updatedTrips);
    localStorage.setItem(TRIPS_LIST_KEY, JSON.stringify(updatedTrips));
    
    // 切換到新旅程
    setCurrentTripId(newTrip.id);
    localStorage.setItem(CURRENT_TRIP_ID_KEY, newTrip.id);
    setSchedule(newTrip.data.schedule || []);
    setChecklist(newTrip.data.checklist || []);
// setExpenses disabled
// setExpenses(Array.isArray(newTrip.data.expenses) ? newTrip.data.expenses : []);
    setPersons(newTrip.data.persons || initialPersons);
    setChecklistUsers(newTrip.data.checklistUsers || []);
    setFlights(newTrip.data.flights || []);
    setTripSettings(newTrip.data.tripSettings || initialTripSettings);
    setExchangeRate(newTrip.data.exchangeRate || 0.052);
    setScheduleHistory(newTrip.data.scheduleHistory || []);
    setSelectedDay(0);
    setCurrentView('schedule');
  };

  // 切換旅程
  const switchToTrip = (tripId: string) => {
    // 先保存當前旅程
    saveCurrentTrip();
    
    const trip = allTrips.find(t => t.id === tripId);
    if (trip) {
      setCurrentTripId(tripId);
      localStorage.setItem(CURRENT_TRIP_ID_KEY, tripId);
      setSchedule(trip.data.schedule || []);
      setChecklist(trip.data.checklist || []);
// setExpenses disabled
// setExpenses(Array.isArray(trip.data.expenses) ? trip.data.expenses : []);
      setPersons(trip.data.persons || initialPersons);
      setChecklistUsers(trip.data.checklistUsers || []);
      setFlights(trip.data.flights || []);
      setTripSettings(trip.data.tripSettings || initialTripSettings);
      setExchangeRate(trip.data.exchangeRate || 0.052);
      setScheduleHistory(trip.data.scheduleHistory || []);
      setSelectedDay(0);
      setCurrentView('schedule');
    }
  };

  // 刪除旅程
  const deleteTrip = (tripId: string) => {
    if (allTrips.length <= 1) {
      alert('至少需要保留一個旅程！');
      return;
    }
    if (confirm('確定要刪除此旅程嗎？此操作無法撤銷。')) {
      const updatedTrips = allTrips.filter(t => t.id !== tripId);
      setAllTrips(updatedTrips);
      localStorage.setItem(TRIPS_LIST_KEY, JSON.stringify(updatedTrips));
      
      // 從 Firebase 刪除（如果已初始化）
      if (database) {
        try {
          const tripRef = ref(database, `trips/${tripId}`);
          remove(tripRef);
        } catch (error) {
          console.error('Firebase 刪除失敗:', error);
        }
      }
      
      if (tripId === currentTripId) {
        switchToTrip(updatedTrips[0].id);
      }
    }
  };

  // 使用範本重置當前旅程
  const resetTripWithTemplate = () => {
    if (confirm('確定要使用範本重置當前旅程嗎？所有現有行程資料將被覆蓋！')) {
      setSchedule(initialSchedule);
      setScheduleHistory([]);
      alert('行程已重置為範本資料！');
    }
  };

  // 匯出旅程
  const exportTrip = (tripId: string) => {
    const trip = allTrips.find(t => t.id === tripId);
    if (trip) {
      const dataStr = JSON.stringify(trip, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${trip.name}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // 匯入旅程
  const importTrip = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const trip = JSON.parse(e.target?.result as string) as Trip;
        trip.id = `trip-${Date.now()}`;
        trip.lastModified = new Date().toISOString();
        const updatedTrips = [...allTrips, trip];
        setAllTrips(updatedTrips);
        localStorage.setItem(TRIPS_LIST_KEY, JSON.stringify(updatedTrips));
        alert(`成功匯入旅程：${trip.name}`);
      } catch (error) {
        alert('匯入失敗：檔案格式錯誤');
      }
    };
    reader.readAsText(file);
  };

  // 獲取匯率
  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
      const data = await res.json();
      const newRate = data.rates.HKD;
      setExchangeRate(newRate);
      localStorage.setItem('lastExchangeRateUpdate', new Date().toISOString());
      alert(`匯率已更新：1 JPY = ${newRate.toFixed(4)} HKD`);
    } catch (error) {
      alert('更新匯率失敗，請稍後再試');
    }
  };

  // 初次載入和每日自動更新匯率
  useEffect(() => {
    const updateExchangeRate = async () => {
      const lastUpdate = localStorage.getItem('lastExchangeRateUpdate');
      const now = new Date();
      
      if (!lastUpdate) {
        // 首次載入
        await fetchExchangeRate();
      } else {
        const lastUpdateDate = new Date(lastUpdate);
        const daysDiff = Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 1) {
          // 距離上次更新已超過一天
          await fetchExchangeRate();
        }
      }
    };

    updateExchangeRate();

    // 每小時檢查一次是否需要更新
    const interval = setInterval(() => {
      updateExchangeRate();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const moveActivity = (fromDay: number, fromIndex: number, toDay: number, toIndex: number) => {
    setSchedule((prev) => {
      const newSchedule = JSON.parse(JSON.stringify(prev));
      const [movedItem] = newSchedule[fromDay].activities.splice(fromIndex, 1);
      newSchedule[toDay].activities.splice(toIndex, 0, movedItem);
      return newSchedule;
    });
  };

  const calculateDayBudget = (day: DaySchedule) => {
    return day.activities.reduce((sum, act) => sum + (act.cost.min + act.cost.max) / 2, 0);
  };

  const calculateTotalBudget = () => {
    return schedule.reduce((sum, day) => sum + calculateDayBudget(day), 0);
  };

  const flyToLocation = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: `c${Date.now()}`,
      name: newChecklistItem.trim(),
      checkedMale: false,
      checkedFemale: false,
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (id: string, gender: 'male' | 'female') => {
    setChecklist(checklist.map(item =>
      item.id === id
        ? { ...item, [gender === 'male' ? 'checkedMale' : 'checkedFemale']: !item[gender === 'male' ? 'checkedMale' : 'checkedFemale'] }
        : item
    ));
  };

  const deleteChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const resetChecklist = () => {
    if (confirm('確定要重置行李清單至初始狀態嗎？')) {
      setChecklist(initialChecklist);
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(initialChecklist));
    }
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    // Feature disabled
  };

  const deleteExpense = (id: string) => {
    // Feature disabled
  };


  const convertToHKD = (amount: number, currency: string): number => {
    if (currency === 'HKD') return amount;
    if (currency === 'JPY') return amount * exchangeRate;
    
    // 使用固定匯率轉換（相對於 HKD）
    const rates: { [key: string]: number } = {
      USD: 7.8,    // 1 USD ≈ 7.8 HKD
      EUR: 8.5,    // 1 EUR ≈ 8.5 HKD
      GBP: 10.0,   // 1 GBP ≈ 10 HKD
      TWD: 0.25,   // 1 TWD ≈ 0.25 HKD
      CNY: 1.1,    // 1 CNY ≈ 1.1 HKD
      KRW: 0.006,  // 1 KRW ≈ 0.006 HKD
      SGD: 5.8,    // 1 SGD ≈ 5.8 HKD
      MYR: 1.75,   // 1 MYR ≈ 1.75 HKD
      THB: 0.22,   // 1 THB ≈ 0.22 HKD
    };
    
    return amount * (rates[currency] || 1);
  };

  const calculateExpenseSummary = () => {
    return { shared: 0 };
  };


  const searchLocation = async (placeName: string) => {
    if (!placeName.trim()) return;
    setSearchingLocation(true);
    try {
      // 使用 Nominatim API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName + ' Japan')}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        setEditForm({
          ...editForm,
          location: result.display_name.split(',')[0],
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        });
      } else {
        alert('找不到該地點，請手動輸入');
      }
    } catch (error) {
      console.error('查詢地點失敗:', error);
      alert('查詢失敗，請檢查網絡連接');
    } finally {
      setSearchingLocation(false);
    }
  };

  const generateTransportRoute = async (fromActivity: Activity, toActivity: Activity) => {
    try {
      // 使用 Google Maps Directions API
      const origin = `${fromActivity.lat},${fromActivity.lng}`;
      const destination = `${toActivity.lat},${toActivity.lng}`;
      
      // 注意：這裡使用公開的 API，實際使用時建議使用自己的 API Key
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=transit&language=zh-TW&key=YOUR_API_KEY`,
        { mode: 'cors' }
      );
      
      // 由於 CORS 限制，我們使用替代方案：OpenTripPlanner 或直接構建詳細路線
      // 這裡使用更實用的方法：調用公開的路線規劃 API
      
      const osmResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromActivity.lng},${fromActivity.lat};${toActivity.lng},${toActivity.lat}?overview=full&steps=true`
      );
      const osmData = await osmResponse.json();
      
      if (osmData.code === 'Ok' && osmData.routes && osmData.routes.length > 0) {
        const route = osmData.routes[0];
        const legs = route.legs[0];
        const steps = legs.steps;
        
        let routeText = `🚇 從 ${fromActivity.name} 到 ${toActivity.name}\n\n`;
        routeText += `📍 出發: ${fromActivity.location}\n`;
        routeText += `📍 目的地: ${toActivity.location}\n`;
        routeText += `⏰ 出發時間: ${fromActivity.time}\n`;
        routeText += `⏰ 預計到達: ${toActivity.time}\n\n`;
        routeText += `📏 總距離: ${(legs.distance / 1000).toFixed(2)} 公里\n`;
        routeText += `⏱️ 預計時間: ${Math.ceil(legs.duration / 60)} 分鐘\n\n`;
        routeText += `🗺️ 建議路線:\n\n`;
        
        // 為日本優化的交通建議
        const distance = legs.distance / 1000;
        if (distance < 0.5) {
          routeText += `🚶 步行路線（${(distance * 1000).toFixed(0)}米）:\n`;
          routeText += `從 ${fromActivity.name} 步行至 ${toActivity.name}\n`;
          routeText += `預計步行時間約 ${Math.ceil(distance * 12)} 分鐘\n`;
        } else if (distance < 2) {
          routeText += `🚶 建議步行或搭乘計程車\n\n`;
          routeText += `步行路線:\n`;
          routeText += `從 ${fromActivity.name} 沿主要道路步行至 ${toActivity.name}\n`;
          routeText += `距離約 ${distance.toFixed(2)} 公里，步行約 ${Math.ceil(distance * 12)} 分鐘\n`;
        } else {
          routeText += `🚇 建議搭乘大眾運輸工具:\n\n`;
          routeText += `1️⃣ 從 ${fromActivity.name} 步行至最近的車站\n`;
          routeText += `2️⃣ 搭乘地鐵/JR線（請使用 Google Maps 或換乘案內查詢具體路線）\n`;
          routeText += `3️⃣ 在目的地附近車站下車\n`;
          routeText += `4️⃣ 步行至 ${toActivity.name}\n\n`;
          routeText += `💡 推薦使用:\n`;
          routeText += `• Google Maps: 查看即時路線\n`;
          routeText += `• 換乘案內 (Norikae Annai): 日本最準確的交通 APP\n`;
          routeText += `• JR East App: JR 線路查詢\n`;
        }
        
        return routeText;
      }
    } catch (error) {
      console.error('查詢路線失敗:', error);
    }
    
    // 備用方案：基本資訊
    const timeFrom = fromActivity.time;
    const timeTo = toActivity.time;
    
    // 計算兩點間的直線距離
    const R = 6371; // 地球半徑（公里）
    const dLat = (toActivity.lat - fromActivity.lat) * Math.PI / 180;
    const dLon = (toActivity.lng - fromActivity.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(fromActivity.lat * Math.PI / 180) * Math.cos(toActivity.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    let routeText = `🚇 從 ${fromActivity.name} 到 ${toActivity.name}\n\n`;
    routeText += `📍 出發: ${fromActivity.location}\n`;
    routeText += `📍 目的地: ${toActivity.location}\n`;
    routeText += `⏰ 出發時間: ${timeFrom}\n`;
    routeText += `⏰ 預計到達: ${timeTo}\n\n`;
    routeText += `📏 直線距離: ${distance.toFixed(2)} 公里\n\n`;
    
    if (distance < 0.5) {
      routeText += `🚶‍♂️ 建議步行:\n`;
      routeText += `距離很近，建議直接步行前往\n`;
      routeText += `預計步行時間: ${Math.ceil(distance * 12)} 分鐘\n`;
    } else if (distance < 2) {
      routeText += `🚶‍♂️ 可以步行或搭乘計程車:\n`;
      routeText += `步行約需 ${Math.ceil(distance * 12)} 分鐘\n`;
      routeText += `或搭乘計程車約 ${Math.ceil(distance * 5)} 分鐘\n`;
    } else {
      routeText += `🚇 建議交通方式:\n\n`;
      
      // 根據東京常見地點提供更具體的建議（使用景點名稱）
      const commonRoutes = getTokyoTransitSuggestion(fromActivity.name, toActivity.name);
      if (commonRoutes) {
        routeText += commonRoutes;
      } else {
        routeText += `建議路線:\n`;
        routeText += `1️⃣ 從 ${fromActivity.name} 前往最近的車站\n`;
        routeText += `2️⃣ 使用以下 APP 查詢最佳路線:\n`;
        routeText += `   • Google Maps（中文介面）\n`;
        routeText += `   • 換乘案內（最準確的日本交通 APP）\n`;
        routeText += `   • Japan Travel by NAVITIME\n`;
        routeText += `3️⃣ 建議購買 Suica/Pasmo 卡方便搭乘\n`;
        routeText += `4️⃣ 預計交通時間約 ${Math.ceil(distance * 3)} 分鐘\n`;
      }
    }
    
    return routeText;
  };

  // 東京詳細路線建議（包含轉車資訊）
  const getTokyoTransitSuggestion = (from: string, to: string): string | null => {
    const routes: {[key: string]: {description: string, steps: string[]}} = {
      '新宿-澀谷': {
        description: '🚇 JR山手線 內環',
        steps: [
          '1️⃣ 在新宿站尋找「JR山手線」標示',
          '2️⃣ 前往內環月台（往品川、澀谷方向）',
          '3️⃣ 搭乘山手線內環',
          '4️⃣ 經過代代木、原宿、明治神宮前',
          '5️⃣ 在澀谷站下車（第4站）',
          '⏱️ 車程約8分鐘 | 💴 票價: ¥160'
        ]
      },
      '澀谷-新宿': {
        description: '🚇 JR山手線 外環',
        steps: [
          '1️⃣ 在澀谷站尋找「JR山手線」標示',
          '2️⃣ 前往外環月台（往新宿、池袋方向）',
          '3️⃣ 搭乘山手線外環',
          '4️⃣ 經過原宿、代代木',
          '5️⃣ 在新宿站下車（第3站）',
          '⏱️ 車程約7分鐘 | 💴 票價: ¥160'
        ]
      },
      '新宿-池袋': {
        description: '🚇 JR山手線 外環',
        steps: [
          '1️⃣ 在新宿站尋找「JR山手線」標示',
          '2️⃣ 前往外環月台（往池袋、上野方向）',
          '3️⃣ 搭乘山手線外環',
          '4️⃣ 經過新大久保、高田馬場、目白',
          '5️⃣ 在池袋站下車（第5站）',
          '⏱️ 車程約10分鐘 | 💴 票價: ¥170'
        ]
      },
      '池袋-新宿': {
        description: '🚇 JR山手線 內環',
        steps: [
          '1️⃣ 在池袋站尋找「JR山手線」標示',
          '2️⃣ 前往內環月台（往新宿、澀谷方向）',
          '3️⃣ 搭乘山手線內環',
          '4️⃣ 經過目白、高田馬場、新大久保',
          '5️⃣ 在新宿站下車（第5站）',
          '⏱️ 車程約10分鐘 | 💴 票價: ¥170'
        ]
      },
      '淺草-上野': {
        description: '🚇 東京Metro銀座線',
        steps: [
          '1️⃣ 在淺草站尋找「銀座線」標示（橙色線）',
          '2️⃣ 前往往澀谷方向月台',
          '3️⃣ 搭乘銀座線',
          '4️⃣ 經過田原町、稻荷町',
          '5️⃣ 在上野站下車（第5站）',
          '⏱️ 車程約5分鐘 | 💴 票價: ¥170'
        ]
      },
      '上野-淺草': {
        description: '🚇 東京Metro銀座線',
        steps: [
          '1️⃣ 在上野站尋找「銀座線」標示（橙色線）',
          '2️⃣ 前往往淺草方向月台',
          '3️⃣ 搭乘銀座線',
          '4️⃣ 經過稻荷町、田原町',
          '5️⃣ 在淺草站下車（第5站）',
          '⏱️ 車程約5分鐘 | 💴 票價: ¥170'
        ]
      },
      '東京-新宿': {
        description: '🚇 JR中央線快速',
        steps: [
          '1️⃣ 在東京站尋找「中央線」標示（橙色線）',
          '2️⃣ 前往中央線月台（往高尾方向）',
          '3️⃣ 搭乘中央線快速（注意：不要搭各站停車）',
          '4️⃣ 直達新宿站（不需轉車）',
          '⏱️ 車程約15分鐘 | 💴 票價: ¥200'
        ]
      },
      '新宿-東京': {
        description: '🚇 JR中央線快速',
        steps: [
          '1️⃣ 在新宿站尋找「中央線」標示（橙色線）',
          '2️⃣ 前往中央線月台（往東京方向）',
          '3️⃣ 搭乘中央線快速（注意：不要搭各站停車）',
          '4️⃣ 直達東京站（不需轉車）',
          '⏱️ 車程約15分鐘 | 💴 票價: ¥200'
        ]
      },
      '澀谷-原宿': {
        description: '🚇 JR山手線',
        steps: [
          '1️⃣ 在澀谷站尋找「JR山手線」標示',
          '2️⃣ 前往外環月台（往新宿、池袋方向）',
          '3️⃣ 搭乘山手線',
          '4️⃣ 在原宿站下車（第2站）',
          '⏱️ 車程約3分鐘 | 💴 票價: ¥140',
          '🚶 或步行約15-20分鐘（沿明治通）'
        ]
      },
      '原宿-澀谷': {
        description: '🚇 JR山手線',
        steps: [
          '1️⃣ 在原宿站尋找「JR山手線」標示',
          '2️⃣ 前往內環月台（往品川、澀谷方向）',
          '3️⃣ 搭乘山手線',
          '4️⃣ 在澀谷站下車（第2站）',
          '⏱️ 車程約3分鐘 | 💴 票價: ¥140',
          '🚶 或步行約15-20分鐘（沿明治通）'
        ]
      },
      '成田機場-新宿': {
        description: '🚇 成田特快 N\'EX 或 Skyliner + JR',
        steps: [
          '方案1: 成田特快 N\'EX（推薦）',
          '1️⃣ 在成田機場第2航廈尋找「N\'EX」標示',
          '2️⃣ 購買成田特快車票（可用 Suica）',
          '3️⃣ 搭乘 N\'EX 往東京/新宿方向',
          '4️⃣ 直達新宿站（不需轉車）',
          '⏱️ 車程約90分鐘 | 💴 票價: ¥3,190',
          '',
          '方案2: Skyliner + 山手線（較便宜）',
          '1️⃣ 搭乘 Skyliner 到日暮里站（44分鐘）',
          '2️⃣ 在日暮里站轉乘 JR 山手線',
          '3️⃣ 搭乘山手線外環往新宿方向',
          '4️⃣ 在新宿站下車（9站）',
          '⏱️ 總車程約70分鐘 | 💴 票價: ¥2,680'
        ]
      },
      '新宿-成田機場': {
        description: '🚇 成田特快 N\'EX',
        steps: [
          '1️⃣ 在新宿站尋找「成田特快」標示',
          '2️⃣ 前往 N\'EX 月台（通常在南口）',
          '3️⃣ 購買成田特快車票',
          '4️⃣ 搭乘 N\'EX 往成田機場方向',
          '5️⃣ 直達成田機場（不需轉車）',
          '⏱️ 車程約90分鐘 | 💴 票價: ¥3,190',
          '💡 建議提早2-3小時到機場'
        ]
      },
    };
    
    // 標準化地點名稱（移除空格、轉小寫）
    const normalizePlace = (place: string) => {
      return place.toLowerCase().replace(/\s+/g, '').replace(/站$/, '');
    };
    
    const fromNormalized = normalizePlace(from);
    const toNormalized = normalizePlace(to);
    
    for (const [routeKey, routeInfo] of Object.entries(routes)) {
      const [routeFrom, routeTo] = routeKey.split('-');
      const routeFromNormalized = normalizePlace(routeFrom);
      const routeToNormalized = normalizePlace(routeTo);
      
      // 檢查是否匹配（支持部分匹配）
      if ((fromNormalized.includes(routeFromNormalized) || routeFromNormalized.includes(fromNormalized)) &&
          (toNormalized.includes(routeToNormalized) || routeToNormalized.includes(toNormalized))) {
        let result = `${routeInfo.description}\n\n`;
        result += routeInfo.steps.join('\n');
        result += '\n\n💳 使用 Suica/Pasmo 卡可直接搭乘（無需另購車票）';
        return result;
      }
    }
    return null;
  };

  const getSortedActivities = (activities: Activity[]) => {
    const sorted = [...activities];
    switch (sortBy) {
      case 'time':
        return sorted.sort((a, b) => a.time.localeCompare(b.time));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return sorted;
    }
  };

  const currentDayActivities = getSortedActivities(schedule[selectedDay]?.activities || []);
  const routeCoordinates: [number, number][] = currentDayActivities.map(act => [act.lat, act.lng]);

  const startEditing = (dayIndex: number, activityIndex: number) => {
    const activity = schedule[dayIndex].activities[activityIndex];
    setEditingActivity({ dayIndex, activityIndex });
    setEditForm({ ...activity });
  };

  const saveEdit = () => {
    if (!editingActivity) return;
    // 保存當前狀態到歷史
    setScheduleHistory(prev => [...prev.slice(-19), schedule]);
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[editingActivity.dayIndex].activities[editingActivity.activityIndex] = {
        ...newSchedule[editingActivity.dayIndex].activities[editingActivity.activityIndex],
        ...editForm,
      } as Activity;
      return newSchedule;
    });
    setEditingActivity(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingActivity(null);
    setEditForm({});
  };

  const deleteActivity = (dayIndex: number, activityIndex: number) => {
    if (confirm('確定要刪除此行程嗎？')) {
      // 保存當前狀態到歷史
      setScheduleHistory(prev => [...prev.slice(-19), schedule]);
      setSchedule((prev) => {
        const newSchedule = [...prev];
        newSchedule[dayIndex].activities.splice(activityIndex, 1);
        return newSchedule;
      });
    }
  };

  const addNewActivity = () => {
    // 保存當前狀態到歷史
    setScheduleHistory(prev => [...prev.slice(-19), schedule]);
    const newActivity: Activity = {
      id: `${selectedDay + 1}-${schedule[selectedDay].activities.length + 1}`,
      time: '00:00',
      name: '新景點',
      location: '待填寫',
      lat: 35.6762,
      lng: 139.6503,
      type: 'attraction',
      duration: '1小時',
      cost: { min: 0, max: 0 },
    };
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[selectedDay].activities.push(newActivity);
      return newSchedule;
    });
  };

  // 保存歷史記錄
  const saveToHistory = (newSchedule: DaySchedule[]) => {
    setScheduleHistory(prev => {
      const newHistory = [...prev, schedule];
      // 只保留最近20步
      if (newHistory.length > 20) {
        return newHistory.slice(-20);
      }
      return newHistory;
    });
    setSchedule(newSchedule);
  };

  // 回復上一步
  const undoSchedule = () => {
    if (scheduleHistory.length === 0) {
      alert('沒有可以回復的操作！');
      return;
    }
    const previousSchedule = scheduleHistory[scheduleHistory.length - 1];
    setSchedule(previousSchedule);
    setScheduleHistory(prev => prev.slice(0, -1));
  };

  const exportSchedule = () => {
    const dataStr = JSON.stringify(schedule, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `日本行程_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addFlight = () => {
    const newFlight: FlightInfo = {
      id: `f${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      departureTime: '00:00',
      arrivalTime: '00:00',
      duration: '0小時0分鐘',
      departureAirport: '待填寫',
      arrivalAirport: '待填寫',
      airline: '待填寫',
      flightNumber: '待填寫',
    };
    setFlights([...flights, newFlight]);
  };

  const updateFlight = (id: string, updates: Partial<FlightInfo>) => {
    setFlights(flights.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFlight = (id: string) => {
    if (confirm('確定要刪除此航班嗎？')) {
      setFlights(flights.filter(f => f.id !== id));
    }
  };

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    const newPerson: Person = {
      id: `p${Date.now()}`,
      name: newPersonName.trim(),
      emoji: newPersonEmoji,
    };
    setPersons([...persons, newPerson]);
    setNewPersonName('');
    setNewPersonEmoji('👤');
  };

  const deletePerson = (id: string) => {
    if (persons.length <= 1) {
      alert('至少需要保留一個人物！');
      return;
    }
    const personToDelete = persons.find(p => p.id === id);
    const relatedExpenses = (expenses || []).filter(e => e.person === personToDelete?.name || e.recipient === personToDelete?.name);
    
    const warningMessage = relatedExpenses.length > 0
      ? `確定要刪除人物「${personToDelete?.name}」嗎？\n\n⚠️ 此人物有 ${relatedExpenses.length} 筆相關支出記錄。\n刪除後這些記錄將保留，但可能顯示異常。`
      : `確定要刪除人物「${personToDelete?.name}」嗎？`;
    
    if (confirm(warningMessage)) {
      setPersons(persons.filter(p => p.id !== id));
    }
  };

  const addNewDay = () => {
    const newDay: DaySchedule = {
      date: new Date().toISOString().split('T')[0],
      day: schedule.length + 1,
      activities: [],
    };
    setSchedule([...schedule, newDay]);
  };

  const updateDayDate = (dayIndex: number, newDate: string) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = { ...newSchedule[dayIndex], date: newDate };
      return newSchedule;
    });
  };

  const deleteDay = (dayIndex: number) => {
    if (schedule.length <= 1) {
      alert('至少需要保留一天行程！');
      return;
    }
    if (confirm('確定要刪除此天行程嗎？')) {
      setSchedule(schedule.filter((_, idx) => idx !== dayIndex));
      if (selectedDay >= schedule.length - 1) {
        setSelectedDay(Math.max(0, schedule.length - 2));
      }
    }
  };

  const toggleDaySelection = (dayIndex: number) => {
    setSelectedDaysToDelete(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const confirmDeleteDays = () => {
    if (selectedDaysToDelete.length === 0) {
      alert('請選擇要刪除的日期！');
      return;
    }
    if (schedule.length - selectedDaysToDelete.length < 1) {
      alert('至少需要保留一天行程！');
      return;
    }
    if (confirm(`確定要刪除選中的 ${selectedDaysToDelete.length} 天行程嗎？`)) {
      // 保存當前狀態到歷史
      setScheduleHistory(prev => [...prev.slice(-19), schedule]);
      setSchedule(schedule.filter((_, idx) => !selectedDaysToDelete.includes(idx)));
      setSelectedDaysToDelete([]);
      setDeleteDayMode(false);
      setSelectedDay(0);
    }
  };

  const addChecklistUser = () => {
    if (!newChecklistUserName.trim()) return;
    const newUser: ChecklistUser = {
      id: `cu${Date.now()}`,
      name: newChecklistUserName.trim(),
      emoji: newChecklistUserEmoji,
    };
    setChecklistUsers([...checklistUsers, newUser]);
    setNewChecklistUserName('');
    setNewChecklistUserEmoji('👤');
  };

  const deleteChecklistUser = (id: string) => {
    if (checklistUsers.length <= 1) {
      alert('至少需要保留一個用戶！');
      return;
    }
    const userToDelete = checklistUsers.find(u => u.id === id);
    if (confirm(`確定要刪除用戶「${userToDelete?.name}」嗎？\n\n該用戶在行李清單中的勾選記錄將會被清除。`)) {
      setChecklistUsers(checklistUsers.filter(u => u.id !== id));
      // 清除相關的勾選狀態
      setChecklist(checklist.map(item => {
        const newCheckedUsers = { ...item.checkedUsers };
        delete newCheckedUsers[id];
        return { ...item, checkedUsers: newCheckedUsers };
      }));
    }
  };

  const updateTransportNotes = (dayIndex: number, notes: string) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = { ...newSchedule[dayIndex], transportNotes: notes };
      return newSchedule;
    });
  };

  const updateDayBudget = (dayIndex: number, budget: number) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = { ...newSchedule[dayIndex], estimatedBudget: budget };
      return newSchedule;
    });
  };

  const updateActivityBudget = (dayIndex: number, activityIndex: number, budget: number) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex].activities[activityIndex] = {
        ...newSchedule[dayIndex].activities[activityIndex],
        actualBudget: budget,
      };
      return newSchedule;
    });
  };

  const updateActivityCost = (dayIndex: number, activityIndex: number, minCost: number, maxCost: number) => {
    setSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex].activities[activityIndex] = {
        ...newSchedule[dayIndex].activities[activityIndex],
        cost: { min: minCost, max: maxCost },
      };
      return newSchedule;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFFF0 0%, #F5F5F5 50%, #E8EAF6 100%)',
        fontFamily: '"Noto Sans TC", sans-serif',
      }}>
        {/* Header */}
        <header style={{
          background: 'linear-gradient(135deg, #FFFFF0 0%, #FFF8E1 100%)',
          padding: '32px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderBottom: '2px solid #D4AF37',
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                margin: '0 0 8px 0',
                color: '#2C3E50',
                fontFamily: '"Noto Serif TC", serif',
                fontSize: '42px',
                fontWeight: '700',
                letterSpacing: '2px',
              }}>
                {tripSettings.title}
              </h1>
              <p style={{ margin: 0, color: '#7F8C8D', fontSize: '16px' }}>
                {tripSettings.startDate} - {tripSettings.endDate} · {tripSettings.subtitle}
              </p>
              <div style={{ 
                marginTop: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '14px',
                color: firebaseConnected ? '#4CAF50' : '#999'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: firebaseConnected ? '#4CAF50' : '#999',
                  display: 'inline-block',
                  animation: firebaseConnected ? 'pulse 2s infinite' : 'none'
                }}></span>
                {firebaseConnected ? '✓ 已連接雲端 - 數據即時同步' : '⚠ 離線模式'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={exportSchedule}
                style={{
                  background: 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                💾 匯出行程
              </button>
              <button
                onClick={undoSchedule}
                style={{
                  background: scheduleHistory.length > 0 
                    ? 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)' 
                    : 'linear-gradient(135deg, #ccc 0%, #aaa 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: scheduleHistory.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: scheduleHistory.length > 0 ? 1 : 0.6,
                }}
                disabled={scheduleHistory.length === 0}
              >
                ↶ 回復上一步 {scheduleHistory.length > 0 && `(${scheduleHistory.length})`}
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div style={{
          maxWidth: '1400px',
          margin: '24px auto 0',
          padding: '0 24px',
        }}>
          {/* 旅程選擇器 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '16px',
            background: 'linear-gradient(135deg, #F1F8F9 0%, #E8F4F8 100%)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <span style={{ fontSize: '20px' }}>🗺️</span>
            <select
              value={currentTripId}
              onChange={(e) => switchToTrip(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: '2px solid #A8DADC',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'white',
              }}
            >
              {allTrips.map(trip => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setCurrentView('trips')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              📁 管理旅程
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentView('schedule')}
            style={{
              padding: '12px 24px',
              background: currentView === 'schedule' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : 'white',
              color: currentView === 'schedule' ? 'white' : '#2C3E50',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            📅 行程表
          </button>
          <button
            onClick={() => setCurrentView('flights')}
            style={{
              padding: '12px 24px',
              background: currentView === 'flights' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : 'white',
              color: currentView === 'flights' ? 'white' : '#2C3E50',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            ✈️ 航班資訊
          </button>
          <button
            onClick={() => setCurrentView('checklist')}
            style={{
              padding: '12px 24px',
              background: currentView === 'checklist' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : 'white',
              color: currentView === 'checklist' ? 'white' : '#2C3E50',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            ✅ 行李清單
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            style={{
              padding: '12px 24px',
              background: currentView === 'settings' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : 'white',
              color: currentView === 'settings' ? 'white' : '#2C3E50',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            ⚙️ 旅程設定
          </button>
          </div>
        </div>

        {/* Trips Management View */}
        {currentView === 'trips' && (
          <div style={{
            maxWidth: '1000px',
            margin: '24px auto',
            padding: '0 24px 48px',
          }}>
            <h2 style={{ color: '#2C3E50', fontFamily: '"Noto Serif TC", serif', marginBottom: '24px' }}>
              📁 旅程管理
            </h2>

            {/* 創建新旅程 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '24px',
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#2C3E50' }}>➕ 創建新旅程</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="旅程名稱（例如：2026日本東京之旅）"
                  id="new-trip-name"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '16px',
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('new-trip-name') as HTMLInputElement;
                    if (input.value.trim()) {
                      createNewTrip(input.value.trim());
                      input.value = '';
                    } else {
                      alert('請輸入旅程名稱');
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  創建
                </button>
              </div>
            </div>

            {/* 匯入旅程 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '24px',
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#2C3E50' }}>📥 匯入旅程</h3>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    importTrip(file);
                    e.target.value = '';
                  }
                }}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  width: '100%',
                }}
              />
            </div>

            {/* 重置為範本 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '24px',
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#2C3E50' }}>🔄 重置當前旅程</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                使用最新的範本資料覆蓋當前旅程的行程表（不影響其他旅程）
              </p>
              <button
                onClick={resetTripWithTemplate}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  width: '100%',
                }}
              >
                🔄 使用範本重置行程
              </button>
            </div>

            {/* 旅程列表 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#2C3E50' }}>🗂️ 所有旅程</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allTrips.map(trip => (
                  <div
                    key={trip.id}
                    style={{
                      padding: '20px',
                      border: trip.id === currentTripId ? '3px solid #4CAF50' : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      background: trip.id === currentTripId ? '#f0f9f0' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2C3E50' }}>
                          {trip.id === currentTripId && '✅ '}
                          {trip.name}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#7F8C8D' }}>
                          創建時間: {new Date(trip.createdAt).toLocaleString('zh-TW')}
                        </div>
                        <div style={{ fontSize: '14px', color: '#7F8C8D' }}>
                          最後修改: {new Date(trip.lastModified).toLocaleString('zh-TW')}
                        </div>
                        <div style={{ fontSize: '14px', color: '#7F8C8D', marginTop: '8px' }}>
                          📅 {(trip.data.schedule || []).length} 天行程 | 
                          ✅ {(trip.data.checklist || []).length} 項清單 | 
                          💰 {(trip.data.expenses || []).length} 筆支出
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {trip.id !== currentTripId && (
                          <button
                            onClick={() => switchToTrip(trip.id)}
                            style={{
                              background: 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            切換
                          </button>
                        )}
                        <button
                          onClick={() => exportTrip(trip.id)}
                          style={{
                            background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                          }}
                        >
                          匯出
                        </button>
                        {allTrips.length > 1 && (
                          <button
                            onClick={() => deleteTrip(trip.id)}
                            style={{
                              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule View */}
        {currentView === 'schedule' && (
          <>
            {/* Budget Summary */}
            <div style={{
              maxWidth: '1400px',
              margin: '24px auto',
              padding: '0 24px',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                padding: '24px',
                borderRadius: '16px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
              }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>總預算估算</h3>
                  {editingBudget === -1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="number"
                        value={tempBudget}
                        onChange={(e) => setTempBudget(parseFloat(e.target.value) || 0)}
                        style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          width: '200px',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '2px solid white',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          // 更新總預算邏輯 - 這裡只是為了顯示，實際計算還是基於活動
                          setEditingBudget(null);
                        }}
                        style={{
                          background: 'white',
                          color: '#D4AF37',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingBudget(null)}
                        style={{
                          background: '#ff6b6b',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{ fontSize: '36px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                      onClick={() => {
                        setEditingBudget(-1);
                        setTempBudget(calculateTotalBudget());
                      }}
                    >
                      HK$ {calculateTotalBudget().toFixed(0)}
                      <span style={{ fontSize: '18px', opacity: 0.7 }}>✎</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>平均每日</div>
                  <div style={{ fontSize: '24px', fontWeight: '600' }}>
                    HK$ {(calculateTotalBudget() / schedule.length).toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Day Tabs */}
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto 24px',
              padding: '0 24px',
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', justifyContent: 'flex-end' }}>
                {!deleteDayMode ? (
                  <button
                    onClick={() => setDeleteDayMode(true)}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    🗑️ 刪除日期
                  </button>
                ) : (
                  <>
                    <button
                      onClick={confirmDeleteDays}
                      style={{
                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      ✓ 確定刪除 ({selectedDaysToDelete.length})
                    </button>
                    <button
                      onClick={() => {
                        setDeleteDayMode(false);
                        setSelectedDaysToDelete([]);
                      }}
                      style={{
                        background: '#ccc',
                        color: '#333',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      ✕ 取消
                    </button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', alignItems: 'center' }}>
              {schedule.map((day, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  {deleteDayMode && (
                    <input
                      type="checkbox"
                      checked={selectedDaysToDelete.includes(index)}
                      onChange={() => toggleDaySelection(index)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '-8px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        zIndex: 10,
                      }}
                    />
                  )}
                  <button
                    onClick={() => !deleteDayMode && setSelectedDay(index)}
                    style={{
                      padding: '16px 24px',
                      background: selectedDay === index && !deleteDayMode
                        ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)'
                        : selectedDaysToDelete.includes(index)
                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                        : 'white',
                      color: (selectedDay === index && !deleteDayMode) || selectedDaysToDelete.includes(index) ? 'white' : '#2C3E50',
                      border: deleteDayMode ? '2px dashed #ff6b6b' : 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: '"Noto Sans TC", sans-serif',
                      fontSize: '16px',
                      fontWeight: '600',
                      minWidth: '120px',
                      boxShadow: selectedDay === index && !deleteDayMode
                        ? '0 4px 12px rgba(69, 123, 157, 0.3)'
                        : '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    <input
                      type="date"
                      value={day.date}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateDayDate(index, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      disabled={deleteDayMode}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: deleteDayMode ? 'default' : 'pointer',
                        width: '100%',
                      }}
                    />
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                      第{day.day}天
                    </div>
                  </button>
                </div>
              ))}
              <button
                onClick={addNewDay}
                style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '24px',
                  minWidth: '60px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                +
              </button>
              </div>
            </div>

            {/* Main Content */}
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto',
              padding: '0 24px 48px',
              display: 'grid',
              gridTemplateColumns: showMap ? '1fr 1fr' : '1fr',
              gap: '24px',
            }}>
              {/* Schedule List */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}>
                  <h2 style={{
                    margin: 0,
                    color: '#2C3E50',
                    fontFamily: '"Noto Serif TC", serif',
                    fontSize: '28px',
                  }}>
                    行程安排
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      onClick={addNewActivity}
                      style={{
                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      ➕ 新增行程
                    </button>
                    <div style={{
                      background: 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      HK$ {calculateDayBudget(schedule[selectedDay]).toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* 交通筆記 */}
                <div style={{
                  background: 'linear-gradient(135deg, #FFF8DC 0%, #FFFACD 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, color: '#8B7355', fontSize: '16px', fontWeight: '600' }}>🚇 交通筆記</h3>
                  </div>
                  <textarea
                    value={schedule[selectedDay]?.transportNotes || ''}
                    onChange={(e) => updateTransportNotes(selectedDay, e.target.value)}
                    placeholder="例如：&#10;下午3:42&#10;1) 成田國際機場 機場第二航廈 --> SKYLINER 44付費特急京成上野&#10;   37分 (1站) 到 日暮里&#10;2) 日暮里(山手線) 普通池袋/新宿方面(內環線) · 11號月台&#10;   下午4:45 19分 (9站) 到 新大久保"
                    style={{
                      width: '100%',
                      minHeight: '150px',
                      padding: '12px',
                      border: '2px solid #DEB887',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      background: 'white',
                    }}
                  />
                </div>

                {/* 排序選項 */}
                <div style={{
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <span style={{ color: '#2C3E50', fontWeight: '600', fontSize: '14px' }}>📊 排序：</span>
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <button
                      onClick={() => setSortBy('default')}
                      style={{
                        padding: '6px 12px',
                        background: sortBy === 'default' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : '#f0f0f0',
                        color: sortBy === 'default' ? 'white' : '#2C3E50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                      }}
                    >
                      預設順序
                    </button>
                    <button
                      onClick={() => setSortBy('time')}
                      style={{
                        padding: '6px 12px',
                        background: sortBy === 'time' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : '#f0f0f0',
                        color: sortBy === 'time' ? 'white' : '#2C3E50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                      }}
                    >
                      ⏰ 時間
                    </button>
                    <button
                      onClick={() => setSortBy('name')}
                      style={{
                        padding: '6px 12px',
                        background: sortBy === 'name' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : '#f0f0f0',
                        color: sortBy === 'name' ? 'white' : '#2C3E50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                      }}
                    >
                      🔤 名稱
                    </button>
                    <button
                      onClick={() => setSortBy('type')}
                      style={{
                        padding: '6px 12px',
                        background: sortBy === 'type' ? 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)' : '#f0f0f0',
                        color: sortBy === 'type' ? 'white' : '#2C3E50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.3s',
                      }}
                    >
                      🏷️ 類型
                    </button>
                  </div>
                </div>
                
                {currentDayActivities.map((activity, index) => (
                  editingActivity?.dayIndex === selectedDay && editingActivity?.activityIndex === index ? (
                    <div key={activity.id} style={{
                      background: 'white',
                      padding: '20px',
                      marginBottom: '12px',
                      borderRadius: '12px',
                      border: '2px solid #A8DADC',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', color: '#2C3E50' }}>編輯行程</h4>
                      
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <input
                          type="time"
                          value={editForm.time || ''}
                          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                        <input
                          type="text"
                          placeholder="景點名稱"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          onBlur={() => {
                            if (editForm.name && editForm.name.trim()) {
                              searchLocation(editForm.name);
                            }
                          }}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                        {searchingLocation && (
                          <div style={{ color: '#4CAF50', fontSize: '12px', padding: '4px 8px' }}>
                            🔍 正在查詢地點資訊...
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => editForm.name && searchLocation(editForm.name)}
                          style={{
                            background: 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                          }}
                          disabled={searchingLocation || !editForm.name}
                        >
                          🔍 自動查詢地點資訊
                        </button>
                        <input
                          type="text"
                          placeholder="地點"
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="緯度"
                            value={editForm.lat || ''}
                            onChange={(e) => setEditForm({ ...editForm, lat: parseFloat(e.target.value) })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="經度"
                            value={editForm.lng || ''}
                            onChange={(e) => setEditForm({ ...editForm, lng: parseFloat(e.target.value) })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                        </div>
                        <select
                          value={editForm.type || 'attraction'}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        >
                          <option value="attraction">景點</option>
                          <option value="restaurant">餐廳</option>
                          <option value="hotel">酒店</option>
                          <option value="transport">交通</option>
                        </select>
                        <input
                          type="text"
                          placeholder="停留時間"
                          value={editForm.duration || ''}
                          onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <input
                            type="number"
                            placeholder="最低預算 (HKD)"
                            value={editForm.cost?.min || 0}
                            onChange={(e) => setEditForm({ ...editForm, cost: { ...editForm.cost!, min: parseInt(e.target.value) } })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                          <input
                            type="number"
                            placeholder="最高預算 (HKD)"
                            value={editForm.cost?.max || 0}
                            onChange={(e) => setEditForm({ ...editForm, cost: { ...editForm.cost!, max: parseInt(e.target.value) } })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                        </div>
                        <input
                          type="url"
                          placeholder="訂位連結 (選填)"
                          value={editForm.bookingUrl || ''}
                          onChange={(e) => setEditForm({ ...editForm, bookingUrl: e.target.value })}
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button
                          onClick={saveEdit}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                          }}
                        >
                          💾 儲存
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            flex: 1,
                            background: '#ccc',
                            color: '#333',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                          }}
                        >
                          ❌ 取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={activity.id} style={{ position: 'relative' }}>
                      <DraggableActivity
                        activity={activity}
                        index={index}
                        dayIndex={selectedDay}
                        moveActivity={moveActivity}
                        onLocationClick={flyToLocation}
                        onBudgetUpdate={updateActivityBudget}
                        onCostUpdate={updateActivityCost}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                        display: 'flex',
                        gap: '8px',
                      }}>
                        {/* 交通資訊按鈕 */}
                        {index < currentDayActivities.length - 1 && (
                          <>
                            <button
                              onClick={async () => {
                                const activityId = activity.id;
                                if (showTransportInfo === activityId) {
                                  setShowTransportInfo(null);
                                } else {
                                  setShowTransportInfo(activityId);
                                  if (!transportRouteInfo[activityId]) {
                                    setLoadingRoute(activityId);
                                    const route = await generateTransportRoute(activity, currentDayActivities[index + 1]);
                                    setTransportRouteInfo({
                                      ...transportRouteInfo,
                                      [activityId]: route,
                                    });
                                    setLoadingRoute(null);
                                  }
                                }
                              }}
                              style={{
                                background: showTransportInfo === activity.id 
                                  ? 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)'
                                  : 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: loadingRoute === activity.id ? 'wait' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              disabled={loadingRoute === activity.id}
                            >
                              {loadingRoute === activity.id ? '🔄' : '🚇'}
                            </button>
                            {showTransportInfo === activity.id && (
                              <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: '0',
                                marginBottom: '8px',
                                minWidth: '400px',
                                maxWidth: '500px',
                                background: 'linear-gradient(135deg, #FFF8DC 0%, #FFFACD 100%)',
                                border: '2px solid #FFA500',
                                borderRadius: '12px',
                                padding: '16px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                zIndex: 100,
                                whiteSpace: 'pre-line',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                color: '#333',
                              }}>
                                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#FF8C00', fontSize: '14px' }}>
                                  🚇 詳細交通路線
                                </div>
                                {transportRouteInfo[activity.id] || '正在查詢路線...'}
                              </div>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => startEditing(selectedDay, index)}
                          style={{
                            background: 'white',
                            border: '1px solid #A8DADC',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ✏️ 編輯
                        </button>
                        <button
                          onClick={() => deleteActivity(selectedDay, index)}
                          style={{
                            background: 'white',
                            border: '1px solid #ff6b6b',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#ff6b6b',
                          }}
                        >
                          🗑️ 刪除
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Map */}
              {showMap && (
                <div style={{
                  position: 'sticky',
                  top: '24px',
                  height: 'calc(100vh - 48px)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapFlyTo center={mapCenter} zoom={mapZoom} />
                    {currentDayActivities.map((activity) => (
                      <Marker key={activity.id} position={[activity.lat, activity.lng]}>
                        <Popup>
                          <strong>{activity.name}</strong><br />
                          {activity.location}<br />
                          HK${activity.cost.min}-${activity.cost.max}
                        </Popup>
                      </Marker>
                    ))}
                    <Polyline
                      positions={routeCoordinates}
                      color="#457B9D"
                      weight={3}
                      opacity={0.7}
                      dashArray="10, 10"
                    />
                  </MapContainer>
                </div>
              )}
            </div>
          </>
        )}

        {/* Flights View */}
        {currentView === 'flights' && (
          <div style={{
            maxWidth: '1200px',
            margin: '24px auto',
            padding: '0 24px 48px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#2C3E50', fontFamily: '"Noto Serif TC", serif', margin: 0 }}>
                ✈️ 航班資訊
              </h2>
              <button
                onClick={addFlight}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                ➕ 新增航班
              </button>
            </div>

            {flights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((flight) => (
              <div key={flight.id} style={{
                background: 'white',
                padding: '24px',
                marginBottom: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>日期</label>
                      <input
                        type="date"
                        value={flight.date}
                        onChange={(e) => updateFlight(flight.id, { date: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>飛行時間</label>
                      <input
                        type="text"
                        value={flight.duration}
                        onChange={(e) => updateFlight(flight.id, { duration: e.target.value })}
                        placeholder="例：4小時5分鐘"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>出發時間</label>
                      <input
                        type="time"
                        value={flight.departureTime}
                        onChange={(e) => updateFlight(flight.id, { departureTime: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                    <div style={{ fontSize: '24px', marginTop: '20px' }}>✈️</div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>抵達時間</label>
                      <input
                        type="time"
                        value={flight.arrivalTime}
                        onChange={(e) => updateFlight(flight.id, { arrivalTime: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>出發機場</label>
                    <input
                      type="text"
                      value={flight.departureAirport}
                      onChange={(e) => updateFlight(flight.id, { departureAirport: e.target.value })}
                      placeholder="例：HONG KONG INTERNATIONAL AIRPORT T1"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>抵達機場</label>
                    <input
                      type="text"
                      value={flight.arrivalAirport}
                      onChange={(e) => updateFlight(flight.id, { arrivalAirport: e.target.value })}
                      placeholder="例：NRT T2"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>航空公司</label>
                      <input
                        type="text"
                        value={flight.airline}
                        onChange={(e) => updateFlight(flight.id, { airline: e.target.value })}
                        placeholder="例：國泰航空"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>航班編號</label>
                      <input
                        type="text"
                        value={flight.flightNumber}
                        onChange={(e) => updateFlight(flight.id, { flightNumber: e.target.value })}
                        placeholder="例：CX 504"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#7F8C8D', fontSize: '12px' }}>🧳 行李限制 (kg)</label>
                    <input
                      type="number"
                      value={flight.luggageLimit || 23}
                      onChange={(e) => updateFlight(flight.id, { luggageLimit: parseFloat(e.target.value) || 23 })}
                      placeholder="23"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <button
                    onClick={() => deleteFlight(flight.id)}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      marginTop: '8px',
                    }}
                  >
                    🗑️ 刪除航班
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings View */}
        {currentView === 'settings' && (
          <div style={{
            maxWidth: '800px',
            margin: '24px auto',
            padding: '0 24px 48px',
          }}>
            <h2 style={{ color: '#2C3E50', fontFamily: '"Noto Serif TC", serif', marginBottom: '24px' }}>
              ⚙️ 旅程設定
            </h2>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '600' }}>旅程標題</label>
                  <input
                    type="text"
                    value={tripSettings.title}
                    onChange={(e) => setTripSettings({ ...tripSettings, title: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '600' }}>副標題</label>
                  <input
                    type="text"
                    value={tripSettings.subtitle}
                    onChange={(e) => setTripSettings({ ...tripSettings, subtitle: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '600' }}>開始日期</label>
                    <input
                      type="date"
                      value={tripSettings.startDate}
                      onChange={(e) => setTripSettings({ ...tripSettings, startDate: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '600' }}>結束日期</label>
                    <input
                      type="date"
                      value={tripSettings.endDate}
                      onChange={(e) => setTripSettings({ ...tripSettings, endDate: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '600' }}>匯率設定</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>JPY → HKD</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0.052)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        onClick={fetchExchangeRate}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                        }}
                      >
                        🔄 更新匯率
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                    當前匯率：1 JPY = {exchangeRate.toFixed(4)} HKD
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '600' }}>公家支出圖標</label>
                  <select
                    value={localStorage.getItem('sharedExpenseEmoji') || '💑'}
                    onChange={(e) => {
                      localStorage.setItem('sharedExpenseEmoji', e.target.value);
                      window.dispatchEvent(new Event('storage'));
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
                  >
                    <option value="💑">💑 情侶</option>
                    <option value="👨‍👩‍👧‍👦">👨‍👩‍👧‍👦 家庭</option>
                    <option value="🏠">🏠 家用</option>
                    <option value="👥">👥 共享</option>
                    <option value="🤝">🤝 合夥</option>
                    <option value="🏢">🏢 公司</option>
                    <option value="💼">💼 商務</option>
                  </select>
                </div>

                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #A8DADC 0%, #457B9D 100%)',
                  borderRadius: '8px',
                  color: 'white',
                }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    💡 提示：修改標題和日期後會即時更新到所有頁面。您可以新增更多天數的行程，或刪除不需要的天數。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checklist View */}
        {currentView === 'checklist' && (
          <div style={{
            maxWidth: '1000px',
            margin: '24px auto',
            padding: '0 24px 48px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#2C3E50', fontFamily: '"Noto Serif TC", serif', margin: 0 }}>
                ✅ 行李清單 Belongings to Bring
              </h2>
              <button
                onClick={resetChecklist}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                🔄 重置清單
              </button>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="新增物品..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  fontSize: '16px',
                }}
              />
              <button
                onClick={addChecklistItem}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                ➕ 新增
              </button>
            </div>

            {/* 用戶管理 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '24px',
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#2C3E50' }}>👥 管理用戶</h3>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <select
                  value={newChecklistUserEmoji}
                  onChange={(e) => setNewChecklistUserEmoji(e.target.value)}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', width: '100px' }}
                >
                  <option value="👤">👤</option>
                  <option value="👦">👦</option>
                  <option value="👧">👧</option>
                  <option value="👨">👨</option>
                  <option value="👩">👩</option>
                  <option value="👴">👴</option>
                  <option value="👵">👵</option>
                  <option value="👶">👶</option>
                  <option value="👱">👱</option>
                  <option value="💂">💂</option>
                  <option value="👷">👷</option>
                  <option value="👮">👮</option>
                  <option value="🕵️">🕵️</option>
                  <option value="🧑">🧑</option>
                  <option value="👰">👰</option>
                  <option value="🤵">🤵</option>
                </select>
                <input
                  type="text"
                  placeholder="用戶名稱"
                  value={newChecklistUserName}
                  onChange={(e) => setNewChecklistUserName(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <button
                  onClick={addChecklistUser}
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  ➕ 新增用戶
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {checklistUsers.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: '#f0f0f0',
                      borderRadius: '20px',
                    }}
                  >
                    <span>{user.emoji} {user.name}</span>
                    <button
                      onClick={() => deleteChecklistUser(user.id)}
                      style={{
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="刪除用戶"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `1fr ${checklistUsers.map(() => '80px').join(' ')} 60px`,
                gap: '12px',
                padding: '12px 0',
                borderBottom: '2px solid #D4AF37',
                fontWeight: '600',
                color: '#2C3E50',
              }}>
                <div>物品</div>
                {checklistUsers.map((user) => (
                  <div key={user.id} style={{ textAlign: 'center' }}>
                    {user.emoji} {user.name}
                  </div>
                ))}
                <div></div>
              </div>

              {checklist.map((item) => {
                // 初始化 checkedUsers 如果不存在
                if (!item.checkedUsers) {
                  item.checkedUsers = {};
                }
                return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `1fr ${checklistUsers.map(() => '80px').join(' ')} 60px`,
                    gap: '12px',
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ color: '#2C3E50' }}>{item.name}</div>
                  {checklistUsers.map((user) => (
                    <div key={user.id} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.checkedUsers?.[user.id] || false}
                        onChange={() => {
                          setChecklist(checklist.map(chkItem =>
                            chkItem.id === item.id
                              ? {
                                  ...chkItem,
                                  checkedUsers: {
                                    ...chkItem.checkedUsers,
                                    [user.id]: !chkItem.checkedUsers?.[user.id],
                                  },
                                }
                              : chkItem
                          ));
                        }}
                        style={{ width: '24px', height: '24px', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Expenses View removed */}

      </div>
    </DndProvider>
  );
}

// 記帳組件
// ExpenseTracker component removed


