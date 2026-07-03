// Autentifikatsiya tizimi

// Ro'yxatdan o'tish
async function registerUser(email, password, fullName) {
    try {
        console.log('🔄 Ro\'yxatdan o\'tish boshlandi...');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Foydalanuvchi yaratildi:', user.uid);

        // Firestore-ga saqlash
        try {
            await db.collection('users').doc(user.uid).set({
                fullName: fullName,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                courses: [],
                progress: {},
                completedLessons: {},
                role: 'student',
                streak: 1
            });
            console.log('✅ Firestore-ga saqlandi');
        } catch (e) {
            console.error('Firestore xatolik:', e);
        }

        // Realtime DB-ga saqlash
        try {
            await rtdb.ref('users/' + user.uid).set({
                fullName: fullName,
                email: email,
                username: email.split('@')[0],
                createdAt: Date.now(),
                lastLogin: Date.now(),
                courses: {},
                progress: {}
            });
            console.log('✅ Realtime DB-ga saqlandi');
        } catch (e) {
            console.error('Realtime DB xatolik:', e);
        }

        // Email tasdiqlash
        try {
            await user.sendEmailVerification();
            console.log('✅ Tasdiqlash emaili yuborildi');
        } catch (e) {
            console.error('Tasdiqlash emaili:', e);
        }

        // Xush kelibsiz email (xatolik bo'lsa ham davom etadi)
        try {
            await sendWelcomeEmail(email, fullName);
        } catch (e) {
            console.log('EmailJS:', e);
        }

        return { 
            success: true, 
            message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz! Email manzilingizni tasdiqlang.',
            user: user 
        };
        
    } catch (error) {
        console.error('❌ Ro\'yxatdan o\'tish xatolik:', error.code);
        
        let errorMessage = 'Xatolik yuz berdi';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Bu email allaqachon ro\'yxatdan o\'tgan';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Noto\'g\'ri email manzil';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/Parol orqali kirish yoqilmagan';
                break;
            case 'auth/weak-password':
                errorMessage = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
                break;
            default:
                errorMessage = error.message;
        }
        
        return { success: false, message: errorMessage };
    }
}

// Login qilish
async function loginUser(email, password) {
    try {
        console.log('🔄 Login boshlandi...');
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Login muvaffaqiyatli');

        // Oxirgi login vaqtini yangilash
        try {
            await db.collection('users').doc(user.uid).set({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.log('Firestore yangilash:', e);
        }

        try {
            await rtdb.ref('users/' + user.uid).update({
                lastLogin: Date.now()
            });
        } catch (e) {
            console.log('Realtime DB yangilash:', e);
        }

        return { 
            success: true, 
            message: 'Muvaffaqiyatli kirdingiz!',
            user: user 
        };
        
    } catch (error) {
        console.error('❌ Login xatolik:', error.code);
        
        let errorMessage = 'Xatolik yuz berdi';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Bunday foydalanuvchi topilmadi';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Noto\'g\'ri parol';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Noto\'g\'ri email manzil';
                break;
            default:
                errorMessage = error.message;
        }
        
        return { success: false, message: errorMessage };
    }
}

// Chiqish
async function logoutUser() {
    try {
        await auth.signOut();
        console.log('✅ Tizimdan chiqildi');
        return { success: true, message: 'Tizimdan chiqdingiz' };
    } catch (error) {
        console.error('❌ Chiqishda xatolik:', error);
        return { success: false, message: 'Chiqishda xatolik yuz berdi' };
    }
}

// Parolni tiklash
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        console.log('✅ Parol tiklash emaili yuborildi');
        return { 
            success: true, 
            message: 'Parolni tiklash havolasi email manzilingizga yuborildi' 
        };
    } catch (error) {
        console.error('❌ Parol tiklash xatolik:', error);
        return { 
            success: false, 
            message: 'Xatolik yuz berdi. Email manzilni tekshiring' 
        };
    }
}

// Foydalanuvchi holatini kuzatish
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ Foydalanuvchi:', user.email, '| Tasdiqlangan:', user.emailVerified);
        
        // Auth sahifasida bo'lsa, dashboardga yo'naltirish
        if (window.location.pathname.includes('auth.html') && user.emailVerified) {
            window.location.href = 'dashboard.html';
        }
    } else {
        console.log('❌ Foydalanuvchi tizimga kirmagan');
        
        // Dashboardda bo'lsa, auth sahifasiga yo'naltirish
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'auth.html';
        }
    }
});

console.log('✅ Auth tizimi tayyor');
