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

// Tự động khởi tạo Firebase App, Firestore & Analytics
if (typeof firebase !== 'undefined' && isFirebaseConfigured()) {
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    window.firebaseDb = firebase.firestore();
    if (typeof firebase.storage === 'function') {
      window.firebaseStorage = firebase.storage();
    }
    if (firebase.analytics) {
      window.firebaseAnalytics = firebase.analytics();
    }
    console.log("✅ Firebase Firestore & Analytics đã được kết nối thành công!");
  } catch (err) {
    console.warn("Lỗi khởi tạo Firebase:", err);
  }
}
