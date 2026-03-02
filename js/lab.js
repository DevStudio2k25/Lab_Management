import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
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

// Modal Logic
const computerModal = document.getElementById('computerModal');
const openModalBtn = document.getElementById('openAddComputerModal');
const closeModalBtn = document.getElementById('closeComputerModal');

openModalBtn.addEventListener('click', () => {
    computerModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
    computerModal.classList.add('hidden');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === computerModal) {
        computerModal.classList.add('hidden');
    }
});

// Get lab ID from URL
const urlParams = new URLSearchParams(window.location.search);
const labId = urlParams.get('id');

if (!labId) {
    alert('Invalid lab ID');
    window.location.href = './dashboard.html';
}

// Load lab details
async function loadLabDetails() {
    try {
        const labDoc = await getDoc(doc(db, 'labs', labId));
        if (labDoc.exists()) {
            document.getElementById('labTitle').textContent = labDoc.data().name;
        }
    } catch (error) {
        console.error('Error loading lab:', error);
    }
}

// Add Computer
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
            createdAt: new Date().toISOString()
        });
        
        alert('✅ Computer added successfully!');
        document.getElementById('addComputerForm').reset();
        computerModal.classList.add('hidden');
        loadComputers();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
});

// Load Computers
async function loadComputers() {
    const computersList = document.getElementById('computersList');
    computersList.innerHTML = '<p class="col-span-full text-center text-muted-foreground text-sm py-8 border border-dashed rounded-lg">Loading computers...</p>';
    
    try {
        const q = query(collection(db, 'computers'), where('labId', '==', labId));
        const querySnapshot = await getDocs(q);
        computersList.innerHTML = '';
        
        if (querySnapshot.empty) {
            computersList.innerHTML = '<p class="col-span-full text-center text-muted-foreground text-sm py-8 border border-dashed rounded-lg">No computers added yet.</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const computer = doc.data();
            const computerCard = `
                <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 class="tracking-tight text-xl font-bold">Computer #${computer.number}</h3>
                        <button onclick="deleteComputer('${doc.id}')" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-destructive h-9 w-9 text-muted-foreground">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="p-6 pt-0">
                        <p class="text-sm text-muted-foreground mb-1">📝 ${computer.details}</p>
                        <p class="text-sm text-foreground bg-muted/50 rounded inline-block px-1 border border-border/50 mb-4">🔑 ${computer.password}</p>
                        
                        <div id="qr-${doc.id}" class="mb-4 flex justify-center bg-white p-2 border border-border rounded-lg mx-auto w-fit"></div>
                        
                        <div class="flex gap-2">
                            <button onclick="downloadQR('${doc.id}', ${computer.number})" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 w-full">
                                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Download QR
                            </button>
                        </div>
                    </div>
                </div>
            `;
            computersList.innerHTML += computerCard;
            
            // Generate QR code
            setTimeout(() => {
                const qrDiv = document.getElementById(`qr-${doc.id}`);
                if (qrDiv) {
                    new QRCode(qrDiv, {
                        text: `${window.location.origin}/computer.html?id=${doc.id}`,
                        width: 120,
                        height: 120
                    });
                }
            }, 100);
        });
    } catch (error) {
        computersList.innerHTML = `<p class="col-span-full text-center text-destructive text-sm py-8">Error: ${error.message}</p>`;
    }
}

// Download QR
window.downloadQR = (computerId, computerNumber) => {
    const qrDiv = document.getElementById(`qr-${computerId}`);
    const canvas = qrDiv.querySelector('canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `Computer_${computerNumber}_QR.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
};

// Bulk Download QR
document.getElementById('bulkDownloadBtn').addEventListener('click', async () => {
    alert('Bulk download will start. Each QR will download separately.');
    const q = query(collection(db, 'computers'), where('labId', '==', labId));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc, index) => {
        setTimeout(() => {
            window.downloadQR(doc.id, doc.data().number);
        }, index * 500);
    });
});

// Delete Computer
window.deleteComputer = async (computerId) => {
    if (confirm('Are you sure you want to delete this computer?')) {
        try {
            await deleteDoc(doc(db, 'computers', computerId));
            alert('✅ Computer deleted successfully!');
            loadComputers();
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    }
};

// Initial load
loadLabDetails();
loadComputers();
