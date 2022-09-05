import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOTPJwTW9-k8RnP5lBHpmq9vfMvlH_eo8",
  authDomain: "fir-auth-3a25c.firebaseapp.com",
  projectId: "fir-auth-3a25c",
  storageBucket: "fir-auth-3a25c.appspot.com",
  messagingSenderId: "669386815755",
  appId: "1:669386815755:web:257339589bcf799a838a0e"
};

let app;

if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig)
} else {
  app = firebase.app();
}

const auth = firebase.auth();


export { auth };    