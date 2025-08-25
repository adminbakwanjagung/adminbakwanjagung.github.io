// Konstanta Supabase
const SUPABASE_URL = "https://ygpkzqivuhuztjityeik.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncGt6cWl2dWh1enRqaXR5ZWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODQwNTIsImV4cCI6MjA3MTM2MDA1Mn0.2u5e1XQR1nQNjp9yEPCDukwzgpvLaU0eW5UiJ2ST30I";

// Inisialisasi Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Debug mode - set to false untuk production
const DEBUG_MODE = true;

// Elemen DOM
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');
const playersTable = document.getElementById('players-table');
const userEmailSpan = document.getElementById('user-email');
const debugInfo = document.getElementById('debug-info');
const debugContent = document.getElementById('debug-content');
const toggleDebugBtn = document.getElementById('toggle-debug');

// Event listener untuk form login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    logDebug('Attempting login with:', { email, password: '***' });
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            logDebug('Login error:', error);
            showMessage(error.message, 'error');
        } else {
            logDebug('Login successful:', data);
            showMessage('Login berhasil! Mengalihkan...', 'success');
            
            // Simpan session info
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
            
            // Tampilkan email user
            if (userEmailSpan && data.user) {
                userEmailSpan.textContent = data.user.email;
            }
            
            setTimeout(() => {
                showDashboard();
                loadPlayersData();
            }, 1000);
        }
    } catch (err) {
        logDebug('Login exception:', err);
        showMessage('Terjadi kesalahan saat login: ' + err.message, 'error');
    }
});

// Event listener untuk logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showMessage('Error during logout: ' + error.message, 'error');
        } else {
            // Hapus session dari localStorage
            localStorage.removeItem('supabase_session');
            showLogin();
        }
    });
}

// Event listener untuk toggle debug
if (toggleDebugBtn) {
    toggleDebugBtn.addEventListener('click', () => {
        if (debugInfo) {
            debugInfo.classList.toggle('hidden');
        }
    });
}

// Fungsi untuk memeriksa session
async function checkSession() {
    try {
        // Cek session dari localStorage terlebih dahulu
        const savedSession = localStorage.getItem('supabase_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            const currentTime = new Date().getTime();
            const expiresAt = new Date(session.expires_at).getTime();
            
            // Cek jika session masih valid
            if (currentTime < expiresAt) {
                logDebug('Session found in localStorage:', session);
                if (userEmailSpan && session.user) {
                    userEmailSpan.textContent = session.user.email;
                }
                showDashboard();
                loadPlayersData();
                return;
            } else {
                // Session expired, hapus dari localStorage
                localStorage.removeItem('supabase_session');
            }
        }
        
        // Jika tidak ada session di localStorage, cek dari Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            logDebug('Session check error:', error);
            showLogin();
            return;
        }
        
        logDebug('Session data from Supabase:', data);
        
        if (data.session) {
            // Simpan session ke localStorage
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
            
            if (userEmailSpan && data.session.user) {
                userEmailSpan.textContent = data.session.user.email;
            }
            showDashboard();
            loadPlayersData();
        } else {
            showLogin();
        }
    } catch (err) {
        logDebug('Session check exception:', err);
        showLogin();
    }
}

// Fungsi untuk menampilkan halaman login
function showLogin() {
    if (loginPage) loginPage.classList.remove('hidden');
    if (dashboardPage) dashboardPage.classList.add('hidden');
}

// Fungsi untuk menampilkan dashboard
function showDashboard() {
    if (loginPage) loginPage.classList.add('hidden');
    if (dashboardPage) dashboardPage.classList.remove('hidden');
}

// Fungsi untuk menampilkan pesan
function showMessage(message, type = 'info') {
    if (loginMessage) {
        loginMessage.textContent = message;
        loginMessage.className = 'text-center';
        
        // Hapus kelas sebelumnya
        loginMessage.classList.remove('message-error', 'message-success', 'message-info');
        
        // Tambahkan kelas sesuai type
        if (type === 'error') {
            loginMessage.classList.add('message-error');
            loginMessage.style.color = '#ff6b6b';
        } else if (type === 'success') {
            loginMessage.classList.add('message-success');
            loginMessage.style.color = '#51cf66';
        } else {
            loginMessage.classList.add('message-info');
            loginMessage.style.color = '#fff';
        }
    }
}

// Fungsi untuk logging debug
function logDebug(title, data) {
    if (!DEBUG_MODE) return;
    
    if (debugInfo) debugInfo.classList.remove('hidden');
    if (debugContent) {
        const debugEntry = document.createElement('div');
        debugEntry.innerHTML = `<strong>${new Date().toLocaleTimeString()}: ${title}</strong><br>${JSON.stringify(data, null, 2)}`;
        debugContent.appendChild(debugEntry);
        debugContent.scrollTop = debugContent.scrollHeight;
    }
    
    console.log(title, data);
}

// Fungsi untuk memuat data players
async function loadPlayersData() {
    try {
        logDebug('Loading players data...');
        const response = await fetch('/.netlify/functions/getPlayerRanks');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const players = await response.json();
        logDebug('Players data loaded:', players);
        
        renderPlayersTable(players);
    } catch (error) {
        logDebug('Error loading players:', error);
        showMessage('Error loading data: ' + error.message, 'error');
    }
}

// Fungsi untuk merender tabel players
function renderPlayersTable(players) {
    if (!playersTable) return;
    
    const tbody = playersTable.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!players || players.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="text-center">Tidak ada data players</td>`;
        tbody.appendChild(row);
        return;
    }
    
    players.forEach(player => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${player.username || 'N/A'}</td>
            <td>${player.rank || 'N/A'}</td>
            <td>${player.last_update ? new Date(player.last_update).toLocaleString() : 'N/A'}</td>
            <td>
                <div class="update-form">
                    <input type="text" id="rank-${player.username}" value="${player.rank || ''}" placeholder="New rank">
                    <button class="update-btn" onclick="updateRank('${player.username}')">Update</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Fungsi untuk update rank (dipanggil dari HTML)
async function updateRank(username) {
    const newRank = document.getElementById(`rank-${username}`).value;
    
    if (!newRank) {
        showMessage('Please enter a rank', 'error');
        return;
    }
    
    try {
        logDebug('Updating rank:', { username, newRank });
        
        const response = await fetch('/.netlify/functions/updatePlayerRank', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, rank: newRank })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        logDebug('Update result:', result);
        
        if (result.success) {
            showMessage('Rank updated successfully', 'success');
            loadPlayersData();
        } else {
            showMessage('Error updating rank: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        logDebug('Error updating player:', error);
        showMessage('Error updating rank: ' + error.message, 'error');
    }
}

// Cek session saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    logDebug('DOM loaded, checking session...');
    checkSession();
});

// Export fungsi untuk akses global (dipanggil dari onclick di HTML)
window.updateRank = updateRank;
