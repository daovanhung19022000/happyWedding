// Cấu hình Firebase - Dự án myedding-e3ab5 của bạn
export const firebaseConfig = {
  apiKey: "AIzaSyCeja5pLX4d09yN7vZzQLddr4ybhZkI4aY",
  authDomain: "myedding-e3ab5.firebaseapp.com",
  projectId: "myedding-e3ab5",
  storageBucket: "myedding-e3ab5.firebasestorage.app",
  messagingSenderId: "810307151579",
  appId: "1:810307151579:web:837553869e7da65fd38efe",
  measurementId: "G-FGLQP35802"
};

// Kiểm tra cấu hình có hợp lệ chưa
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
};

function getFirebaseCompat() {
  return globalThis.firebase;
}

/** Gọi lại sau khi đã load script compat (app / firestore / storage). */
export function initFirebaseClient() {
  const firebase = getFirebaseCompat();
  if (!firebase || !isFirebaseConfigured()) return false;
  try {
    if (!firebase.apps?.length) {
      firebase.initializeApp(firebaseConfig);
    }
    window.firebaseDb = firebase.firestore();
    if (typeof firebase.storage === 'function') {
      window.firebaseStorage = firebase.storage();
    }
    if (firebase.analytics) {
      window.firebaseAnalytics = firebase.analytics();
    }
    return true;
  } catch (err) {
    console.warn('Lỗi khởi tạo Firebase:', err);
    return false;
  }
}

initFirebaseClient();
