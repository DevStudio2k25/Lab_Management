import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
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

// Create Admin Modal
const adminModal = document.getElementById('adminModal');
document.getElementById('createAdminBtn').addEventListener('click', () => {
    adminModal.classList.remove('hidden');
});
document.getElementById('closeAdminModal').addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

// Create Lab Modal
const createLabModal = document.getElementById('createLabModal');
document.getElementById('addLabBtn').addEventListener('click', () => {
    createLabModal.classList.remove('hidden');
});
document.getElementById('closeLabModal').addEventListener('click', () => {
    createLabModal.classList.add('hidden');
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === adminModal) adminModal.classList.add('hidden');
    if (e.target === createLabModal) createLabModal.classList.add('hidden');
});

// Create Admin
document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newAdminEmail').value;
    const password = document.getElementById('newAdminPassword').value;
    
    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters!');
        return;
    }
    
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save admin info in Firestore
        await addDoc(collection(db, 'admins'), {
            uid: user.uid,
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        
        alert('✅ Admin account created successfully!\n📧 Email: ' + email);
        adminModal.classList.add('hidden');
        document.getElementById('createAdminForm').reset();
    } catch (error) {
        let errorMessage = error.message;
        
        // User-friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered!';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address!';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak! Use at least 6 characters.';
        }
        
        alert('❌ Error: ' + errorMessage);
    }
});

// Create Lab
document.getElementById('createLabForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const labName = document.getElementById('labName').value;
    
    try {
        await addDoc(collection(db, 'labs'), {
            name: labName,
            createdAt: new Date().toISOString()
        });
        alert('✅ Lab created successfully!');
        document.getElementById('createLabForm').reset();
        createLabModal.classList.add('hidden');
        loadLabs();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
});

// Load Labs
async function loadLabs() {
    const labsList = document.getElementById('labsList');
    labsList.innerHTML = '<p class="col-span-full text-center text-muted-foreground text-sm py-8">Loading labs...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'labs'));
        labsList.innerHTML = '';
        
        if (querySnapshot.empty) {
            labsList.innerHTML = '<p class="col-span-full text-center text-muted-foreground text-sm py-8 border border-dashed rounded-lg">No labs created yet.</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const lab = doc.data();
            const labCard = `
                <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 class="tracking-tight text-xl font-bold">${lab.name}</h3>
                        <button onclick="deleteLab('${doc.id}')" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-destructive h-9 w-9 text-muted-foreground">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="p-6 pt-0">
                        <p class="text-sm text-muted-foreground mb-4">Created ${new Date(lab.createdAt).toLocaleDateString()}</p>
                        <a href="./lab.html?id=${doc.id}" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 w-full">
                            Open Lab →
                        </a>
                    </div>
                </div>
            `;
            labsList.innerHTML += labCard;
        });
    } catch (error) {
        labsList.innerHTML = `<p class="col-span-full text-center text-destructive text-sm py-8">Error loading labs: ${error.message}</p>`;
    }
}

// Delete Lab
window.deleteLab = async (labId) => {
    if (confirm('Are you sure you want to delete this lab?')) {
        try {
            await deleteDoc(doc(db, 'labs', labId));
            alert('✅ Lab deleted successfully!');
            loadLabs();
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    }
};

// Initial load
loadLabs();
