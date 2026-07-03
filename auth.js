// Autentifikatsiya tizimi

// Ro'yxatdan o'tish
async function registerUser(email, password, fullName) {
    try {
        console.log('🔄 Ro\'yxatdan o\'tish boshlandi...', { email, fullName });
        
        // Firebase Authentication orqali foydalanuvchi yaratish
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Foydalanuvchi yaratildi:', user.uid);

        // Firestore-ga foydalanuvchi ma'lumotlarini saqlash
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
        } catch (firestoreError) {
            console.error('❌ Firestore xatolik:', firestoreError);
            // Firestore xatoligi bo'lsa ham davom etamiz
        }

        // Realtime Database-ga ham saqlash
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
        } catch (rtdbError) {
            console.error('❌ Realtime DB xatolik:', rtdbError);
        }

        // Email tasdiqlash yuborish
        try {
            await user.sendEmailVerification();
            console.log('✅ Tasdiqlash emaili yuborildi');
        } catch (verifyError) {
            console.error('❌ Tasdiqlash emaili yuborilmadi:', verifyError);
        }

        // Xush kelibsiz email yuborish (EmailJS orqali)
        try {
            if (typeof sendWelcomeEmail === 'function') {
                await sendWelcomeEmail(email, fullName);
            }
        } catch (emailError) {
            console.log('⚠️ EmailJS xatolik (muhim emas):', emailError);
        }

        return { 
            success: true, 
            message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz! Email manzilingizni tasdiqlang.',
            user: user 
        };
        
    } catch (error) {
        console.error('❌ Ro\'yxatdan o\'tishda xatolik:', error.code, error.message);
        
        let errorMessage = 'Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Bu email allaqachon ro\'yxatdan o\'tgan. Iltimos, kirish qiling.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Noto\'g\'ri email manzil. Iltimos tekshirib qayta kiriting.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/Parol orqali kirish yoqilmagan. Admin bilan bog\'laning.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Internet aloqasi yo\'q. Iltimos internetingizni tekshiring.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Juda ko\'p urinish. Iltimos keyinroq qayta urinib ko\'ring.';
                break;
            default:
                errorMessage = `Xatolik: ${error.message}`;
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
        
        console.log('✅ Login muvaffaqiyatli:', user.email);

        // Oxirgi login vaqtini yangilash
        try {
            const now = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(user.uid).update({
                lastLogin: now
            }).catch(() => {
                // Agar hujjat bo'lmasa, yangi yaratish
                return db.collection('users').doc(user.uid).set({
                    email: email,
                    lastLogin: now
                }, { merge: true });
            });
        } catch (e) {
            console.log('⚠️ Firestore yangilashda xatolik:', e);
        }

        // Realtime DB yangilash
        try {
            await rtdb.ref('users/' + user.uid).update({
                lastLogin: Date.now()
            });
        } catch (e) {
            console.log('⚠️ Realtime DB yangilashda xatolik:', e);
        }

        return { 
            success: true, 
            message: 'Muvaffaqiyatli kirdingiz!',
            user: user 
        };
        
    } catch (error) {
        console.error('❌ Login xatolik:', error.code, error.message);
        
        let errorMessage = 'Xatolik yuz berdi';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Bunday foydalanuvchi topilmadi. Ro\'yxatdan o\'ting.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Noto\'g\'ri parol. Iltimos tekshirib qayta kiriting.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Noto\'g\'ri email manzil.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Bu foydalanuvchi bloklangan.';
                break;
            default:
                errorMessage = `Xatolik: ${error.message}`;
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
        console.error('❌ Parol tiklashda xatolik:', error);
        
        let errorMessage = 'Xatolik yuz berdi.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Bunday email topilmadi.';
        }
        
        return { success: false, message: errorMessage };
    }
}

// Email tasdiqlashni qayta yuborish
async function resendVerificationEmail() {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
        try {
            await user.sendEmailVerification();
            return { success: true, message: 'Tasdiqlash emaili qayta yuborildi!' };
        } catch (error) {
            return { success: false, message: 'Xatolik yuz berdi.' };
        }
    }
    return { success: false, message: 'Email allaqachon tasdiqlangan.' };
}

// Foydalanuvchi holatini kuzatish
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ Foydalanuvchi tizimga kirgan:', user.email, '| Tasdiqlangan:', user.emailVerified);
    } else {
        console.log('❌ Foydalanuvchi tizimga kirmagan');
    }
});
