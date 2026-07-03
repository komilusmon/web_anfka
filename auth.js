// Autentifikatsiya tizimi

// Ro'yxatdan o'tish
async function registerUser(email, password, fullName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Firestore-ga foydalanuvchi ma'lumotlarini saqlash
        await db.collection('users').doc(user.uid).set({
            fullName: fullName,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            courses: [],
            progress: {},
            role: 'student'
        });

        // Realtime Database-ga ham saqlash
        await rtdb.ref('users/' + user.uid).set({
            fullName: fullName,
            email: email,
            username: email.split('@')[0], // Emaildan username yasash
            createdAt: Date.now(),
            lastLogin: Date.now(),
            courses: {},
            progress: {}
        });

        // Email tasdiqlash yuborish
        await user.sendEmailVerification();

        // Xush kelibsiz email yuborish (EmailJS orqali)
        try {
            await sendWelcomeEmail(email, fullName);
        } catch (emailError) {
            console.log('⚠️ Email yuborilmadi, lekin ro\'yxatdan o\'tish muvaffaqiyatli');
        }

        return { 
            success: true, 
            message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz! Email manzilingizni tasdiqlang.',
            user: user 
        };
    } catch (error) {
        let errorMessage = 'Xatolik yuz berdi';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Bu email allaqachon ro\'yxatdan o\'tgan';
                break;
            case 'auth/weak-password':
                errorMessage = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Noto\'g\'ri email manzil';
                break;
        }
        return { success: false, message: errorMessage };
    }
}

// Login qilish
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            return { 
                success: false, 
                message: 'Iltimos, email manzilingizni tasdiqlang!',
                needVerification: true 
            };
        }

        // Oxirgi login vaqtini yangilash (ikkala bazada)
        const now = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('users').doc(user.uid).update({
            lastLogin: now
        });

        await rtdb.ref('users/' + user.uid).update({
            lastLogin: Date.now()
        });

        return { 
            success: true, 
            message: 'Muvaffaqiyatli kirdingiz!',
            user: user 
        };
    } catch (error) {
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
        }
        return { success: false, message: errorMessage };
    }
}

// Chiqish
async function logoutUser() {
    try {
        await auth.signOut();
        return { success: true, message: 'Tizimdan chiqdingiz' };
    } catch (error) {
        return { success: false, message: 'Chiqishda xatolik yuz berdi' };
    }
}

// Parolni tiklash
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { 
            success: true, 
            message: 'Parolni tiklash havolasi email manzilingizga yuborildi' 
        };
    } catch (error) {
        return { 
            success: false, 
            message: 'Xatolik yuz berdi. Email manzilni tekshiring' 
        };
    }
}

// Foydalanuvchi holatini kuzatish
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('✅ Foydalanuvchi tizimga kirgan:', user.email);
        // Dashboard sahifasiga yo'naltirish
        if (window.location.pathname.includes('auth.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        console.log('❌ Foydalanuvchi tizimga kirmagan');
        // Auth sahifasiga yo'naltirish
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'auth.html';
        }
    }
});
