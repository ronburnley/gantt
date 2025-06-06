// Firebase configuration
// IMPORTANT: Replace these values with your actual Firebase project configuration
// You can find these in your Firebase Console under Project Settings > General > Your apps > SDK setup and configuration

const firebaseConfig = {
  apiKey: "AIzaSyAEAEafI_c-CgVGQM8p3kaqX8uZfj0mSzs",
  authDomain: "gantt-ff731.firebaseapp.com",
  projectId: "gantt-ff731",
  storageBucket: "gantt-ff731.firebasestorage.app",
  messagingSenderId: "609152736901",
  appId: "1:609152736901:web:13e3e4a68cf486925253ec",
  measurementId: "G-REHJBJDT3W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Optional: Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.log('Persistence not available in this browser');
        }
    });

// Export for use in other files
window.db = db;
window.firebase = firebase;