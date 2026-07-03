<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-adsense-account" content="ca-pub-7357410271113724">
    <title>ANFKA Academy - Kirish</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .auth-container {
            max-width: 450px;
            margin: 100px auto;
            padding: 2rem;
        }
        .auth-tabs {
            display: flex;
            margin-bottom: 2rem;
            border-bottom: 2px solid var(--border-color);
        }
        .auth-tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 1.1rem;
            font-weight: 500;
            color: var(--text-secondary);
            transition: all 0.3s;
        }
        .auth-tab.active {
            color: var(--primary-color);
            border-bottom: 2px solid var(--primary-color);
        }
        .auth-form {
            display: none;
        }
        .auth-form.active {
            display: block;
        }
        .password-field {
            position: relative;
        }
        .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            background: none;
            border: none;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar">
        <a href="index.html" class="navbar-brand">🎓 ANFKA Academy</a>
        <ul class="navbar-nav">
            <li><a href="index.html" class="nav-link">Asosiy</a></li>
            <li><a href="courses.html" class="nav-link">Kurslar</a></li>
            <li><a href="contact.html" class="nav-link">Aloqa</a></li>
        </ul>
    </nav>

    <!-- Auth Container -->
    <div class="auth-container card">
        <div class="auth-tabs">
            <button class="auth-tab active" onclick="switchTab('login')">Kirish</button>
            <button class="auth-tab" onclick="switchTab('register')">Ro'yxatdan o'tish</button>
        </div>

        <!-- Xabar maydoni -->
        <div id="message"></div>

        <!-- Login Formasi -->
        <form id="login-form" class="auth-form active">
            <div class="form-group">
                <label class="form-label">📧 Email</label>
                <input type="email" id="login-email" class="form-control" 
                       placeholder="Email manzilingiz" required>
            </div>
            <div class="form-group password-field">
                <label class="form-label">🔒 Parol</label>
                <input type="password" id="login-password" class="form-control" 
                       placeholder="Parolingiz" required>
                <button type="button" class="toggle-password" onclick="togglePassword('login-password')">
                    👁️
                </button>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                🔑 Kirish
            </button>
            <div class="text-center mt-1">
                <a href="#" onclick="showResetPassword()" style="color: var(--primary-color);">
                    Parolni unutdingizmi?
                </a>
            </div>
        </form>

        <!-- Register Formasi -->
        <form id="register-form" class="auth-form">
            <div class="form-group">
                <label class="form-label">👤 To'liq ism</label>
                <input type="text" id="register-name" class="form-control" 
                       placeholder="Ismingiz va familiyangiz" required>
            </div>
            <div class="form-group">
                <label class="form-label">📧 Email</label>
                <input type="email" id="register-email" class="form-control" 
                       placeholder="Email manzilingiz" required>
            </div>
            <div class="form-group password-field">
                <label class="form-label">🔒 Parol</label>
                <input type="password" id="register-password" class="form-control" 
                       placeholder="Parol (kamida 6 ta belgi)" required>
                <button type="button" class="toggle-password" onclick="togglePassword('register-password')">
                    👁️
                </button>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                📝 Ro'yxatdan o'tish
            </button>
        </form>

        <!-- Parolni tiklash Formasi -->
        <form id="reset-form" class="auth-form">
            <h3 class="text-center mb-2">🔑 Parolni Tiklash</h3>
            <p class="text-center mb-2">Email manzilingizni kiriting, tiklash havolasini yuboramiz.</p>
            <div class="form-group">
                <label class="form-label">📧 Email</label>
                <input type="email" id="reset-email" class="form-control" 
                       placeholder="Email manzilingiz" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                📤 Tiklash havolasini yuborish
            </button>
            <div class="text-center mt-1">
                <a href="#" onclick="switchTab('login')" style="color: var(--primary-color);">
                    ← Kirish sahifasiga qaytish
                </a>
            </div>
        </form>
    </div>

    <!-- Reklama bo'limi -->
    <div id="header-ad" class="ad-container container"></div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js"></script>
    
    <!-- EmailJS -->
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7357410271113724" crossorigin="anonymous"></script>
    
    <!-- Custom JavaScript -->
    <script src="firebase-config.js"></script>
    <script src="emailjs-config.js"></script>
    <script src="auth.js"></script>
    <script src="database-manager.js"></script>
    <script src="ads.js"></script>
    
    <script>
        // Tab almashtirish
        function switchTab(tab) {
            const tabs = document.querySelectorAll('.auth-tab');
            const forms = document.querySelectorAll('.auth-form');
            
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            if (tab === 'login') {
                tabs[0].classList.add('active');
                document.getElementById('login-form').classList.add('active');
            } else if (tab === 'register') {
                tabs[1].classList.add('active');
                document.getElementById('register-form').classList.add('active');
            }
            
            document.getElementById('message').innerHTML = '';
        }
        
        function showResetPassword() {
            const tabs = document.querySelectorAll('.auth-tab');
            const forms = document.querySelectorAll('.auth-form');
            
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            document.getElementById('reset-form').classList.add('active');
        }
        
        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 5000);
        }
        
        function showLoading(button) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span> Kuting...';
        }
        
        function hideLoading(button, originalHTML) {
            button.disabled = false;
            button.innerHTML = originalHTML;
        }
        
        // Parol ko'rsatish/yashirish
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            input.type = input.type === 'password' ? 'text' : 'password';
        }
        
        // Login formasi
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const button = e.target.querySelector('button[type="submit"]');
            const originalHTML = button.innerHTML;
            
            showLoading(button);
            
            const result = await loginUser(email, password);
            
            if (result.success) {
                showMessage(result.message, 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(result.message, 'danger');
                if (result.needVerification) {
                    showMessage('Tasdiqlash emaili qayta yuborilsinmi? <a href="#" onclick="resendVerification()">Ha</a>', 'info');
                }
                hideLoading(button, originalHTML);
            }
        });
        
        // Register formasi
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const button = e.target.querySelector('button[type="submit"]');
            const originalHTML = button.innerHTML;
            
            if (password.length < 6) {
                showMessage('Parol kamida 6 ta belgidan iborat bo\'lishi kerak', 'danger');
                return;
            }
            
            if (!fullName || fullName.length < 2) {
                showMessage('Iltimos, to\'liq ismingizni kiriting', 'danger');
                return;
            }
            
            showLoading(button);
            
            const result = await registerUser(email, password, fullName);
            
            if (result.success) {
                showMessage(result.message, 'success');
                setTimeout(() => {
                    switchTab('login');
                    document.getElementById('login-email').value = email;
                }, 2000);
            } else {
                showMessage(result.message, 'danger');
            }
            
            hideLoading(button, originalHTML);
        });
        
        // Parolni tiklash formasi
        document.getElementById('reset-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('reset-email').value.trim();
            const button = e.target.querySelector('button[type="submit"]');
            const originalHTML = button.innerHTML;
            
            showLoading(button);
            
            const result = await resetPassword(email);
            
            if (result.success) {
                showMessage(result.message, 'success');
                setTimeout(() => {
                    switchTab('login');
                }, 2000);
            } else {
                showMessage(result.message, 'danger');
            }
            
            hideLoading(button, originalHTML);
        });
        
        // Tasdiqlash emailini qayta yuborish
        async function resendVerification() {
            const user = auth.currentUser;
            if (user) {
                try {
                    await user.sendEmailVerification();
                    showMessage('Tasdiqlash emaili yuborildi!', 'success');
                } catch (error) {
                    showMessage('Xatolik yuz berdi. Qayta urinib ko\'ring.', 'danger');
                }
            }
        }
    </script>
</body>
</html>
