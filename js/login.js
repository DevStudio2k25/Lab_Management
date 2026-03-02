import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence);

// UI UTILITIES
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `flex items-center w-full max-w-xs p-4 text-sm bg-card border rounded-lg shadow-lg pointer-events-auto animate-in slide-in-from-right-full duration-300 ${type === 'error' ? 'border-destructive/50 text-destructive' : 'border-border text-foreground'}`;

    const icon = type === 'error'
        ? `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
        : `<svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('slide-in-from-right-full', 'slide-out-to-right-full');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    
    try {
        btn.disabled = true;
        btn.textContent = 'Signing in...';
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login successful! Redirecting...');
        setTimeout(() => window.location.href = './dashboard.html', 1000);
    } catch (error) {
        btn.disabled = false;
        btn.textContent = 'Sign In';
        let msg = error.message;
        if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password';
        showToast(msg, 'error');
    }
});
// Password Toggle
document.getElementById('togglePassword')?.addEventListener('click', () => {
    const input = document.getElementById('password');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
});
