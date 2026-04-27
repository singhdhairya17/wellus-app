// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { Platform } from "react-native";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "project-dc8e7.firebaseapp.com",
  projectId: "project-dc8e7",
  storageBucket: "project-dc8e7.appspot.com",
  messagingSenderId: "687232619743",
  appId: "1:687232619743:web:347e873afcf47acdcf856a",
  measurementId: "G-645FXTM5D3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=Platform.OS==="web"?getAuth(app):initializeAuth(app,{
 persistence:getReactNativePersistence(ReactNativeAsyncStorage)
})
