import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signupForm = document.getElementById('signupForm');
const messageDiv = document.getElementById('message');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (password.length < 6) {
        messageDiv.innerHTML = '<span class="text-red-600">❌ Password must be at least 6 characters</span>';
        return;
    }
    
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save admin info in Firestore
        await setDoc(doc(db, 'admins', user.uid), {
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        
        messageDiv.innerHTML = '<span class="text-green-600">✅ Admin account created successfully!</span>';
        
        setTimeout(() => {
            messageDiv.innerHTML += '<br><span class="text-blue-600">Redirecting to login...</span>';
        }, 1000);
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2500);
        
    } catch (error) {
        let errorMessage = error.message;
        
        // User-friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered!';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address!';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak!';
        }
        
        messageDiv.innerHTML = `<span class="text-red-600">❌ ${errorMessage}</span>`;
    }
});
