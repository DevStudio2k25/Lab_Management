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
    window.location.href = './index.html';
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
            <div class="flex flex-col space-y-2 pb-2">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-muted-foreground">Computer No.</span>
                    <span class="text-lg font-bold">${computer.number}</span>
                </div>
                <div class="grid gap-1">
                    <span class="text-sm font-medium text-muted-foreground">Details</span>
                    <p class="text-sm border rounded-md p-2 bg-muted/20">${computer.details}</p>
                </div>
                <div class="grid gap-1">
                    <span class="text-sm font-medium text-muted-foreground">Computer Password</span>
                    <p class="text-sm border border-border/50 rounded-md p-2 bg-muted/50 font-mono tracking-wider">${computer.password}</p>
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('computerInfo').innerHTML = `<p class="text-destructive text-sm bg-destructive/10 p-3 rounded-md">Error: ${error.message}</p>`;
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
    reviewsList.innerHTML = '<p class="text-center text-muted-foreground text-sm py-4">Loading reviews...</p>';
    
    try {
        const q = query(
            collection(db, 'reviews'),
            where('computerId', '==', computerId)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            reviewsList.innerHTML = '<p class="text-center text-muted-foreground text-sm py-4 border border-dashed rounded-lg">No reviews yet.</p>';
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
            const isWorking = review.status === 'Working';
            const statusColor = isWorking ? 'border-green-200 bg-green-50/50' : 'border-destructive/20 bg-destructive/5';
            const badgeColor = isWorking ? 'bg-green-100 text-green-800 border-green-200' : 'bg-destructive/10 text-destructive border-destructive/20';
            const date = new Date(review.timestamp).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const reviewCard = `
                <div class="border rounded-lg p-4 ${statusColor}">
                    <div class="flex justify-between items-start mb-2 gap-2">
                        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${badgeColor}">
                            ${isWorking ? `<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` : `<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`}
                            ${review.status}
                        </span>
                        <span class="text-xs text-muted-foreground shrink-0">${date}</span>
                    </div>
                    ${review.comment ? `<p class="text-sm mt-2 text-foreground break-words">${review.comment}</p>` : ''}
                </div>
            `;
            reviewsList.innerHTML += reviewCard;
        });
    } catch (error) {
        reviewsList.innerHTML = `<p class="text-center text-destructive text-sm py-4">Error: ${error.message}</p>`;
    }
}

// Initial load
loadComputerDetails();
loadReviews();
