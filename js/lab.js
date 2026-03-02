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
        window.location.href = '/index.html';
    }
});

// Get lab ID from URL
const urlParams = new URLSearchParams(window.location.search);
const labId = urlParams.get('id');

if (!labId) {
    alert('Invalid lab ID');
    window.location.href = '/dashboard.html';
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
        const computerRef = await addDoc(collection(db, 'computers'), {
            labId: labId,
            number: parseInt(number),
            details: details,
            password: password,
            createdAt: new Date().toISOString()
        });
        
        alert('✅ Computer added successfully!');
        document.getElementById('addComputerForm').reset();
        loadComputers();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
});

// Load Computers
async function loadComputers() {
    const computersList = document.getElementById('computersList');
    computersList.innerHTML = '<p class="col-span-full text-center text-gray-500">Loading computers...</p>';
    
    try {
        const q = query(collection(db, 'computers'), where('labId', '==', labId));
        const querySnapshot = await getDocs(q);
        computersList.innerHTML = '';
        
        if (querySnapshot.empty) {
            computersList.innerHTML = '<p class="col-span-full text-center text-gray-500">No computers added yet.</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const computer = doc.data();
            const computerCard = `
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold mb-2">Computer #${computer.number}</h3>
                    <p class="text-gray-600 mb-2">📝 ${computer.details}</p>
                    <p class="text-gray-600 mb-4">🔑 Password: ${computer.password}</p>
                    
                    <div id="qr-${doc.id}" class="mb-4 flex justify-center"></div>
                    
                    <div class="flex gap-2">
                        <button onclick="downloadQR('${doc.id}', ${computer.number})" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                            📥 Download QR
                        </button>
                        <button onclick="deleteComputer('${doc.id}')" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                            🗑️
                        </button>
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
                        width: 150,
                        height: 150
                    });
                }
            }, 100);
        });
    } catch (error) {
        computersList.innerHTML = `<p class="col-span-full text-center text-red-500">Error: ${error.message}</p>`;
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
