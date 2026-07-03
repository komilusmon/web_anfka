// Firebase konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyD7ckJhmBkkY6p5WaMscrrJeaLDoysZ5Uo",
  authDomain: "anfka-edcd9.firebaseapp.com",
  projectId: "anfka-edcd9",
  storageBucket: "anfka-edcd9.firebasestorage.app",
  messagingSenderId: "264821445378",
  appId: "1:264821445378:web:7594d3434e52fcd5a3281b"
};

// Firebase-ni ishga tushirish
firebase.initializeApp(firebaseConfig);

// Xizmatlarni olish
const auth = firebase.auth();
const db = firebase.firestore(); // Firestore - kurslar, videolar, yangiliklar uchun
const rtdb = firebase.database(); // Realtime Database - xabarlar va foydalanuvchilar uchun

console.log('✅ Firebase muvaffaqiyatli ulandi');
console.log('📦 Firestore:', db ? 'Ulangan' : 'Xatolik');
console.log('🔄 Realtime DB:', rtdb ? 'Ulangan' : 'Xatolik');
