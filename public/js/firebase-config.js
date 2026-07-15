var firebaseConfig = {
  apiKey: "AIzaSyD0b93TexBnb5sIRBcby9AfOOjiL_kizN4",
  authDomain: "pawpath-d2fe7.firebaseapp.com",
  projectId: "pawpath-d2fe7",
  storageBucket: "pawpath-d2fe7.firebasestorage.app",
  messagingSenderId: "767720143098",
  appId: "1:767720143098:web:9808908b3ff6842c2ef143"
};
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();
var storage = firebase.storage();


