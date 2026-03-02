import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
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
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
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

// MODALS LOGIC
const computerModal = document.getElementById('computerModal');
const editComputerModal = document.getElementById('editComputerModal');
const reviewsModal = document.getElementById('reviewsModal');
const openModalBtn = document.getElementById('openAddComputerModal');
const closeModalBtn = document.getElementById('closeComputerModal');
const closeEditCompBtn = document.getElementById('closeEditComputerModal');
const closeReviewsBtn = document.getElementById('closeReviewsModal');

openModalBtn.addEventListener('click', () => computerModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => computerModal.classList.add('hidden'));
closeEditCompBtn.addEventListener('click', () => editComputerModal.classList.add('hidden'));
closeReviewsBtn.addEventListener('click', () => reviewsModal.classList.add('hidden'));

window.addEventListener('click', (e) => {
    if (e.target === computerModal) computerModal.classList.add('hidden');
    if (e.target === editComputerModal) editComputerModal.classList.add('hidden');
    if (e.target === reviewsModal) reviewsModal.classList.add('hidden');
    if (e.target === confirmModal) confirmModal.classList.add('hidden');
});

// LOAD LAB DETAILS
const urlParams = new URLSearchParams(window.location.search);
const labId = urlParams.get('id');

if (!labId) {
    showToast('Invalid Lab ID', 'error');
    setTimeout(() => window.location.href = './dashboard.html', 2000);
}

async function loadLabDetails() {
    try {
        const labDoc = await getDoc(doc(db, 'labs', labId));
        if (labDoc.exists()) {
            document.getElementById('labTitle').innerHTML = `
                <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                ${labDoc.data().name}
            `;
        }
    } catch (error) {
        console.error('Error loading lab:', error);
    }
}

// ADD COMPUTER
// ADD COMPUTER
document.getElementById('addComputerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const number = document.getElementById('computerNumber').value;
    const details = document.getElementById('computerDetails').value;
    const password = document.getElementById('computerPassword').value;
    
    try {
        await addDoc(collection(db, 'computers'), {
            labId: labId,
            number: parseInt(number),
            details: details,
            password: password,
            status: 'Working',
            createdAt: new Date().toISOString()
        });
        
        showToast('Computer added successfully');
        document.getElementById('addComputerForm').reset();
        computerModal.classList.add('hidden');
        loadComputers();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// EDIT COMPUTER
document.getElementById('editComputerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editCompId').value;
    const number = document.getElementById('editCompNumber').value;
    const details = document.getElementById('editCompDetails').value;
    const password = document.getElementById('editCompPassword').value;

    try {
        await updateDoc(doc(db, 'computers', id), {
            number: parseInt(number),
            details: details,
            password: password
        });

        showToast('Computer updated');
        editComputerModal.classList.add('hidden');
        loadComputers();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// REVIEWS LOGIC
window.showReviews = async (computerId) => {
    const reviewsList = document.getElementById('modalReviewsList');
    reviewsList.innerHTML = '<p class="text-center text-sm text-muted-foreground animate-pulse py-8">Loading history...</p>';
    reviewsModal.classList.remove('hidden');

    try {
        const q = query(collection(db, 'reviews'), where('computerId', '==', computerId));
        const snap = await getDocs(q);
        reviewsList.innerHTML = '';

        if (snap.empty) {
            reviewsList.innerHTML = '<div class="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">No history found.</div>';
            return;
        }

        const reviews = snap.docs.map(d => d.data());
        reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        reviews.forEach(r => {
            const isWorking = r.status === 'Working';
            reviewsList.innerHTML += `
                <div class="p-3 rounded-lg border text-sm ${isWorking ? 'border-green-100 bg-green-50/30' : 'border-destructive/10 bg-destructive/5'}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isWorking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${isWorking ? 'Working' : 'Issue Reported'}
                        </span>
                        <span class="text-[10px] text-muted-foreground">${new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    ${r.comment ? `<p class="mt-1 text-xs opacity-80">${r.comment}</p>` : ''}
                </div>
            `;
        });
    } catch (e) {
        showToast('Error loading reviews', 'error');
    }
};

// LOAD COMPUTERS
async function loadComputers() {
    const list = document.getElementById('computersList');
    list.innerHTML = '<div class="col-span-full py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse"><svg class="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Loading computers...</span></div>';
    
    try {
        const q = query(collection(db, 'computers'), where('labId', '==', labId));
        const snap = await getDocs(q);
        list.innerHTML = '';
        
        if (snap.empty) {
            list.innerHTML = '<div class="col-span-full py-20 flex flex-col items-center justify-center gap-4 border border-dashed rounded-xl border-border bg-card text-muted-foreground"><svg class="h-10 w-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg><span>No computers added yet.</span></div>';
            return;
        }

        snap.forEach((doc) => {
            const comp = doc.data();
            const isWorking = comp.status !== 'Not Working';

            const card = `
                <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                    <div class="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <div class="space-y-1">
                            <h3 class="tracking-tight text-lg font-bold">System #${comp.number}</h3>
                            <div class="flex items-center gap-2">
                                <span class="flex h-2 w-2 rounded-full ${isWorking ? 'bg-green-500' : 'bg-destructive'} animate-pulse"></span>
                                <span class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">${isWorking ? 'Working' : 'Not Working'}</span>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="toggleStatus('${doc.id}', '${comp.status || 'Working'}')" title="Toggle Status" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8 text-muted-foreground">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m4-4l-4-4"></path></svg>
                            </button>
                            <button onclick="openEditComputer('${doc.id}', ${comp.number}, '${comp.details}', '${comp.password}')" title="Edit Computer" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8 text-muted-foreground">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="deleteComputer('${doc.id}')" title="Delete" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive h-8 w-8 text-muted-foreground">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                    <div class="p-4 pt-2">
                        <div class="space-y-1.5 mb-4">
                            <div class="flex items-center gap-2 text-xs text-muted-foreground">
                                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                                <span>${comp.details}</span>
                            </div>
                            <div class="flex items-center gap-2 text-xs font-mono bg-muted/50 px-2 py-1 rounded border border-border/50 w-fit">
                                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                                <span>${comp.password}</span>
                            </div>
                        </div>
                        
                        <div id="qr-${doc.id}" class="mb-4 flex justify-center bg-white p-2 border border-border rounded-lg mx-auto w-fit"></div>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="downloadQR('${doc.id}', ${comp.number})" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors border border-border bg-background hover:bg-muted h-8 px-2">
                                <svg class="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> QR
                            </button>
                            <button onclick="showReviews('${doc.id}')" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-8 px-2">
                                <svg class="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> Reviews
                            </button>
                        </div>
                    </div>
                </div>
            `;
            list.innerHTML += card;

            setTimeout(() => {
                const qDiv = document.getElementById(`qr-${doc.id}`);
                if (qDiv) new QRCode(qDiv, { text: `${window.location.origin}/computer.html?id=${doc.id}`, width: 100, height: 100 });
            }, 100);
        });
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// OTHER FUNCTIONS
window.toggleStatus = async (id, current) => {
    const next = current === 'Working' ? 'Not Working' : 'Working';
    try {
        await updateDoc(doc(db, 'computers', id), { status: next });
        showToast(`System marked as ${next}`);
        loadComputers();
    } catch (e) {
        showToast('Status update failed', 'error');
    }
};

window.downloadQR = (id, num) => {
    const canvas = document.getElementById(`qr-${id}`).querySelector('canvas');
    if (canvas) {
        const a = document.createElement('a');
        a.download = `PC_${num}_QR.png`;
        a.href = canvas.toDataURL();
        a.click();
    }
};

document.getElementById('bulkDownloadBtn').onclick = async () => {
    showToast('Starting bulk download...');
    const q = query(collection(db, 'computers'), where('labId', '==', labId));
    const snap = await getDocs(q);
    snap.forEach((d, i) => setTimeout(() => window.downloadQR(d.id, d.data().number), i * 500));
};

window.deleteComputer = async (id) => {
    if (await showConfirm('Delete Computer', 'Are you sure you want to remove this system? All related reviews will remain in history but the system card will be gone.')) {
        try {
            await deleteDoc(doc(db, 'computers', id));
            showToast('Computer removed');
            loadComputers();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }
};

// INITIAL
loadLabDetails();
loadComputers();

window.openEditComputer = (id, num, details, pass) => {
    document.getElementById('editCompId').value = id;
    document.getElementById('editCompNumber').value = num;
    document.getElementById('editCompDetails').value = details;
    document.getElementById('editCompPassword').value = pass;
    editComputerModal.classList.remove('hidden');
};

// Password Toggles
document.getElementById('toggleCompPassword')?.addEventListener('click', () => {
    const input = document.getElementById('computerPassword');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
});

document.getElementById('toggleEditCompPassword')?.addEventListener('click', () => {
    const input = document.getElementById('editCompPassword');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
});

