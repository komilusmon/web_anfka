// EmailJS konfiguratsiyasi
(function() {
    emailjs.init("L8EVbFKC61KtkIqh5");
    console.log('✅ EmailJS tayyor');
})();

// Fikr-mulohaza yuborish funksiyasi
async function sendFeedback(userEmail, userName, message, courseName = '') {
    try {
        const templateParams = {
            from_name: userName,
            from_email: userEmail,
            message: message,
            course_name: courseName,
            reply_to: userEmail
        };

        const response = await emailjs.send(
            'YOUR_SERVICE_ID', // EmailJS xizmat ID'si
            'YOUR_FEEDBACK_TEMPLATE_ID', // Fikr-mulohaza shabloni ID'si
            templateParams
        );

        console.log('✅ Fikr-mulohaza yuborildi:', response.status);
        return { success: true, message: 'Xabaringiz muvaffaqiyatli yuborildi!' };
    } catch (error) {
        console.error('❌ Xatolik:', error);
        return { success: false, message: 'Xabaringiz yuborilmadi. Qayta urinib ko\'ring.' };
    }
}

// Ro'yxatdan o'tish xabarini yuborish
async function sendWelcomeEmail(userEmail, userName) {
    try {
        const templateParams = {
            to_email: userEmail,
            to_name: userName,
            from_name: 'ANFKA Academy',
            subject: 'Xush kelibsiz!'
        };

        const response = await emailjs.send(
            'YOUR_SERVICE_ID', // EmailJS xizmat ID'si
            'YOUR_WELCOME_TEMPLATE_ID', // Xush kelibsiz shabloni ID'si
            templateParams
        );

        console.log('✅ Xush kelibsiz xati yuborildi');
        return true;
    } catch (error) {
        console.error('❌ Xush kelibsiz xati yuborilmadi:', error);
        return false;
    }
}
