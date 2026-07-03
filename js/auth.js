// Autentifikatsiya tizimi

async function registerUser(email, password, fullName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        try {
            await db.collection('users').doc(user.uid).set({
                fullName: fullName,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                courses: [],
                progress: {},
                completedLessons: {},
                streak: 1
            });
        } catch (e) {
            console.error('Firestore xatolik:', e);
        }

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
        } catch (e) {
            console.error('Realtime DB xatolik:', e);
        }

        try {
            await user.sendEmailVerification();
        } catch (e) {
            console.error('Tasdiqlash emaili:', e);
        }

        return { success: true, message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz! Email manzilingizni tasdiqlang.', user: user };
    } catch (error) {
        console.error('Ro\'yxatdan o\'tish xatolik:', error.code);
        let errorMessage = 'Xatolik yuz berdi';
        switch (error.code) {
            case 'auth/email-already-in-use': errorMessage = 'Bu email allaqachon ro\'yxatdan o\'tgan'; break;
            case 'auth/invalid-email': errorMessage = 'Noto\'g\'ri email manzil'; break;
            case 'auth/operation-not-allowed': errorMessage = 'Email/Parol orqali kirish yoqilmagan'; break;
            case 'auth/weak-password': errorMessage = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'; break;
            default: errorMessage = error.message;
        }
        return { success: false, message: errorMessage };
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        try {
            await db.collection('users').doc(user.uid).set({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {}

        try {
            await rtdb.ref('users/' + user.uid).update({ lastLogin: Date.now() });
        } catch (e) {}

        return { success: true, message: 'Muvaffaqiyatli kirdingiz!', user: user };
    } catch (error) {
        console.error('Login xatolik:', error.code);
        let errorMessage = 'Xatolik yuz berdi';
        switch (error.code) {
            case 'auth/user-not-found': errorMessage = 'Bunday foydalanuvchi topilmadi'; break;
            case 'auth/wrong-password': errorMessage = 'Noto\'g\'ri parol'; break;
            case 'auth/invalid-email': errorMessage = 'Noto\'g\'ri email manzil'; break;
            default: errorMessage = error.message;
        }
        return { success: false, message: errorMessage };
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        return { success: true, message: 'Tizimdan chiqdingiz' };
    } catch (error) {
        return { success: false, message: 'Chiqishda xatolik yuz berdi' };
    }
}

async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true, message: 'Parolni tiklash havolasi email manzilingizga yuborildi' };
    } catch (error) {
        return { success: false, message: 'Xatolik yuz berdi. Email manzilni tekshiring' };
    }
}

console.log('✅ Auth tizimi tayyor');
