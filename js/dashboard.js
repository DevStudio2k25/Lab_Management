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
        window.location.href = '/index.html';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '/index.html';
});

// Create Admin Modal
const adminModal = document.getElementById('adminModal');
document.getElementById('createAdminBtn').addEventListener('click', () => {
    adminModal.classList.remove('hidden');
});
document.getElementById('closeAdminModal').addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

// Create Admin
document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newAdminEmail').value;
    const password = document.getElementById('newAdminPassword').value;
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('✅ Admin created successfully!');
        adminModal.classList.add('hidden');
        document.getElementById('createAdminForm').reset();
    } catch (error) {
        alert('❌ Error: ' + error.message);
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
        document.getElementById('labName').value = '';
        loadLabs();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
});

// Load Labs
async function loadLabs() {
    const labsList = document.getElementById('labsList');
    labsList.innerHTML = '<p class="col-span-full text-center text-gray-500">Loading labs...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'labs'));
        labsList.innerHTML = '';
        
        if (querySnapshot.empty) {
            labsList.innerHTML = '<p class="col-span-full text-center text-gray-500">No labs created yet.</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const lab = doc.data();
            const labCard = `
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <h3 class="text-xl font-bold mb-4">${lab.name}</h3>
                    <div class="flex gap-2">
                        <a href="/lab.html?id=${doc.id}" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700">
                            Open Lab
                        </a>
                        <button onclick="deleteLab('${doc.id}')" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
            labsList.innerHTML += labCard;
        });
    } catch (error) {
        labsList.innerHTML = `<p class="col-span-full text-center text-red-500">Error loading labs: ${error.message}</p>`;
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
