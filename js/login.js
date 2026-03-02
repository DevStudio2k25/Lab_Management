import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        messageDiv.innerHTML = '<span class="text-green-600">✅ Login successful! Redirecting...</span>';
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1000);
    } catch (error) {
        messageDiv.innerHTML = `<span class="text-red-600">❌ ${error.message}</span>`;
    }
});
