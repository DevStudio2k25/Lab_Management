import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = './index.html';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = './index.html';
});

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

const confirmModal = document.getElementById('confirmModal');
let confirmPromise = null;

function showConfirm(title, message) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmModal.classList.remove('hidden');

    return new Promise((resolve) => {
        confirmPromise = resolve;
    });
}

document.getElementById('confirmCancel').onclick = () => {
    confirmModal.classList.add('hidden');
    if (confirmPromise) confirmPromise(false);
};

document.getElementById('confirmProceed').onclick = () => {
    confirmModal.classList.add('hidden');
    if (confirmPromise) confirmPromise(true);
};

// MODALS
const adminModal = document.getElementById('adminModal');
const createLabModal = document.getElementById('createLabModal');

document.getElementById('createAdminBtn').addEventListener('click', () => adminModal.classList.remove('hidden'));
document.getElementById('closeAdminModal').addEventListener('click', () => adminModal.classList.add('hidden'));

document.getElementById('addLabBtn').addEventListener('click', () => createLabModal.classList.remove('hidden'));
document.getElementById('closeLabModal').addEventListener('click', () => createLabModal.classList.add('hidden'));

window.addEventListener('click', (e) => {
    if (e.target === adminModal) adminModal.classList.add('hidden');
    if (e.target === createLabModal) createLabModal.classList.add('hidden');
    if (e.target === confirmModal) confirmModal.classList.add('hidden');
});

// Create Admin
document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newAdminEmail').value;
    const password = document.getElementById('newAdminPassword').value;
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await addDoc(collection(db, 'admins'), {
            uid: userCredential.user.uid,
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        
        showToast('Admin account created: ' + email);
        adminModal.classList.add('hidden');
        document.getElementById('createAdminForm').reset();
    } catch (error) {
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') msg = 'Email already registered';
        showToast(msg, 'error');
    }
});

// Create Lab
document.getElementById('createLabForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('labName').value;
    
    try {
        await addDoc(collection(db, 'labs'), {
            name: name,
            createdAt: new Date().toISOString()
        });
        showToast('Lab created successfully');
        document.getElementById('createLabForm').reset();
        createLabModal.classList.add('hidden');
        loadLabs();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Load Labs
async function loadLabs() {
    const list = document.getElementById('labsList');
    list.innerHTML = '<div class="col-span-full py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse"><svg class="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Loading labs...</span></div>';
    
    try {
        const snap = await getDocs(collection(db, 'labs'));
        list.innerHTML = '';
        
        if (snap.empty) {
            list.innerHTML = '<div class="col-span-full py-20 flex flex-col items-center justify-center gap-4 border border-dashed rounded-xl border-border bg-card text-muted-foreground"><svg class="h-10 w-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg><span>No labs created yet.</span></div>';
            return;
        }
        
        snap.forEach((doc) => {
            const lab = doc.data();
            list.innerHTML += `
                <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                    <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 class="tracking-tight text-xl font-bold">${lab.name}</h3>
                        <button onclick="deleteLab('${doc.id}')" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive h-9 w-9 text-muted-foreground">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    <div class="p-6 pt-0">
                        <div class="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>Created ${new Date(lab.createdAt).toLocaleDateString()}</span>
                        </div>
                        <a href="./lab.html?id=${doc.id}" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 w-full group">
                            Open Lab 
                            <svg class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        showToast('Error loading labs', 'error');
    }
}

// Delete Lab
window.deleteLab = async (id) => {
    if (await showConfirm('Delete Lab', 'Are you sure you want to delete this lab and all contained computers? This cannot be undone.')) {
        try {
            await deleteDoc(doc(db, 'labs', id));
            showToast('Lab deleted');
            loadLabs();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
};

// Initial load
loadLabs();

