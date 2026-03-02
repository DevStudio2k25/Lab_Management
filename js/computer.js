import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get computer ID from URL
const urlParams = new URLSearchParams(window.location.search);
const computerId = urlParams.get('id');

if (!computerId) {
    alert('Invalid computer ID');
    window.location.href = '/index.html';
}

// Load Computer Details
async function loadComputerDetails() {
    try {
        const computerDoc = await getDoc(doc(db, 'computers', computerId));
        
        if (!computerDoc.exists()) {
            alert('Computer not found');
            return;
        }
        
        const computer = computerDoc.data();
        const computerInfo = document.getElementById('computerInfo');
        
        computerInfo.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg">
                <h2 class="text-2xl font-bold mb-2">Computer #${computer.number}</h2>
                <p class="text-lg mb-2">📝 <strong>Details:</strong> ${computer.details}</p>
                <p class="text-lg mb-2">🔑 <strong>Password:</strong> <span class="font-mono bg-yellow-100 px-2 py-1 rounded">${computer.password}</span></p>
            </div>
        `;
    } catch (error) {
        document.getElementById('computerInfo').innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
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
        
        alert('✅ Review submitted successfully!');
        document.getElementById('reviewForm').reset();
        loadReviews();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
});

// Load Reviews (New to Old)
async function loadReviews() {
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = '<p class="text-center text-gray-500">Loading reviews...</p>';
    
    try {
        const q = query(
            collection(db, 'reviews'),
            where('computerId', '==', computerId)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            reviewsList.innerHTML = '<p class="text-center text-gray-500">No reviews yet.</p>';
            return;
        }
        
        // Sort by timestamp (newest first)
        const reviews = [];
        querySnapshot.forEach((doc) => {
            reviews.push(doc.data());
        });
        reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        reviewsList.innerHTML = '';
        reviews.forEach((review) => {
            const statusColor = review.status === 'Working' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const date = new Date(review.timestamp).toLocaleString();
            
            const reviewCard = `
                <div class="border rounded-lg p-4 ${statusColor}">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-bold">${review.status}</span>
                        <span class="text-sm">${date}</span>
                    </div>
                    ${review.comment ? `<p class="text-sm">${review.comment}</p>` : ''}
                </div>
            `;
            reviewsList.innerHTML += reviewCard;
        });
    } catch (error) {
        reviewsList.innerHTML = `<p class="text-center text-red-500">Error: ${error.message}</p>`;
    }
}

// Initial load
loadComputerDetails();
loadReviews();
