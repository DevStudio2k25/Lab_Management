import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL (user stays logged in)
setPersistence(auth, browserLocalPersistence);

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    messageDiv.innerHTML = '<span class="text-muted-foreground">Logging in...</span>';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        messageDiv.innerHTML = '<span class="text-foreground">Login successful! Redirecting...</span>';
        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1000);
    } catch (error) {
        let errorMessage = error.message;
        
        // User-friendly error messages
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid email or password.';
        }
        
        messageDiv.innerHTML = `<span class="text-red-500">${errorMessage}</span>`;
    }
});
