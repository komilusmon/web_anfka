// EmailJS konfiguratsiyasi
(function() {
    emailjs.init("L8EVbFKC61KtkIqh5");
    console.log('✅ EmailJS tayyor');
})();

// EmailJS sozlamalari - O'Z TEMPLATE ID'LARINGIZNI KIRITING
const EMAILJS_CONFIG = {
    serviceId: 'service_default', // O'z xizmat ID'ingiz
    templates: {
        feedback: 'template_feedback', // O'z template ID'ingiz
        welcome: 'template_welcome', // O'z template ID'ingiz
        courseNotification: 'template_course' // O'z template ID'ingiz
    }
};

// Fikr-mulohaza yuborish
async function sendFeedback(userEmail, userName, message, subject) {
    try {
        const templateParams = {
            from_name: userName,
            from_email: userEmail,
            message: message,
            subject: subject || 'Umumiy savol',
            reply_to: userEmail,
            to_name: 'ANFKA Admin',
            date: new Date().toLocaleDateString('uz-UZ')
        };

        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templates.feedback,
            templateParams
        );

        console.log('✅ Fikr-mulohaza yuborildi:', response.status);
        return { success: true, message: 'Xabaringiz muvaffaqiyatli yuborildi!' };
    } catch (error) {
        console.error('❌ EmailJS xatolik:', error);
        return { success: false, message: 'Xabaringiz yuborilmadi. Iltimos qayta urinib ko\'ring.' };
    }
}

// Xush kelibsiz email yuborish
async function sendWelcomeEmail(userEmail, userName) {
    try {
        const templateParams = {
            to_email: userEmail,
            to_name: userName,
            from_name: 'ANFKA Academy',
            subject: 'ANFKA Academyga xush kelibsiz! 🎓',
            welcome_message: 'Siz muvaffaqiyatli ro\'yxatdan o\'tdingiz. Endi barcha bepul kurslarimizdan foydalanishingiz mumkin.',
            login_link: window.location.origin + '/auth.html',
            courses_link: window.location.origin + '/courses.html'
        };

        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templates.welcome,
            templateParams
        );

        console.log('✅ Xush kelibsiz xati yuborildi');
        return true;
    } catch (error) {
        console.error('❌ Xush kelibsiz xati yuborilmadi:', error);
        return false;
    }
}
