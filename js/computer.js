import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

const urlParams = new URLSearchParams(window.location.search);
const computerId = urlParams.get('id');

if (!computerId) {
    showToast('Invalid computer ID', 'error');
    setTimeout(() => window.location.href = './index.html', 1000);
}

// Load Computer
async function loadComputerDetails() {
    try {
        const docSnap = await getDoc(doc(db, 'computers', computerId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('computerInfo').innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <div class="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                            <p class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">System Number</p>
                            <p class="text-xl font-bold">#${data.number}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 gap-3">
                        <div class="p-3 rounded-lg border">
                            <p class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Specifications</p>
                            <p class="text-sm font-medium flex items-center gap-2">
                                <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                                ${data.details}
                            </p>
                        </div>
                        <div class="p-3 rounded-lg border">
                            <p class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Computer Password</p>
                            <div class="flex items-center gap-2">
                                <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                                <code class="text-sm font-bold bg-muted px-2 py-0.5 rounded">${data.password}</code>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        showToast('Error loading details', 'error');
    }
}

// Submit Review
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('reviewStatus').value;
    const comment = document.getElementById('reviewComment').value;
    
    try {
        await addDoc(collection(db, 'reviews'), {
            computerId: computerId,
            status: status,
            comment: comment,
            timestamp: new Date().toISOString()
        });
        showToast('Thank you! Status submitted.');
        document.getElementById('reviewForm').reset();
        loadReviews();
    } catch (e) {
        showToast('Failed to submit', 'error');
    }
});

// Load Reviews
async function loadReviews() {
    const list = document.getElementById('reviewsList');
    list.innerHTML = '<div class="py-10 flex justify-center animate-spin"><svg class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>';
    
    try {
        const q = query(collection(db, 'reviews'), where('computerId', '==', computerId));
        const snap = await getDocs(q);
        list.innerHTML = '';
        
        if (snap.empty) {
            list.innerHTML = '<p class="text-center py-10 text-xs text-muted-foreground border border-dashed rounded-lg">No report history yet.</p>';
            return;
        }
        
        const reviews = snap.docs.map(d => d.data());
        reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        reviews.forEach(r => {
            const isWorking = r.status === 'Working';
            list.innerHTML += `
                <div class="p-3 rounded-lg border text-sm transition-colors ${isWorking ? 'border-green-100 bg-green-50/20' : 'border-destructive/10 bg-destructive/5'}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isWorking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${isWorking ? 'Working' : 'Issue'}
                        </span>
                        <span class="text-[10px] text-muted-foreground">${new Date(r.timestamp).toLocaleDateString()}</span>
                    </div>
                    ${r.comment ? `<p class="mt-1 text-xs opacity-80 leading-relaxed">${r.comment}</p>` : ''}
                </div>
            `;
        });
    } catch (e) {
        showToast('Error loading history', 'error');
    }
}

// Initial
loadComputerDetails();
loadReviews();

