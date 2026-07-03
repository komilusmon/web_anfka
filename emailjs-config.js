// EmailJS konfiguratsiyasi
(function() {
    emailjs.init("L8EVbFKC61KtkIqh5");
    console.log('✅ EmailJS tayyor');
})();

// EmailJS sozlamalari - BU YERGA O'Z TEMPLATE ID'LARINGIZNI KIRITING
const EMAILJS_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID', // Email xizmati ID'si (Gmail, Outlook va hokazo)
    templates: {
        feedback: 'YOUR_FEEDBACK_TEMPLATE_ID', // Fikr-mulohaza shabloni ID'si
        welcome: 'YOUR_WELCOME_TEMPLATE_ID', // Xush kelibsiz shabloni ID'si
        courseNotification: 'YOUR_COURSE_TEMPLATE_ID' // Kurs xabarnomasi ID'si (ixtiyoriy)
    }
};

// Fikr-mulohaza yuborish funksiyasi
async function sendFeedback(userEmail, userName, message, subject = '') {
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

// Ro'yxatdan o'tish xabarini yuborish
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

// Kursga yozilish xabarini yuborish
async function sendCourseEnrollmentEmail(userEmail, userName, courseName) {
    try {
        const templateParams = {
            to_email: userEmail,
            to_name: userName,
            course_name: courseName,
            from_name: 'ANFKA Academy',
            subject: `Siz ${courseName} kursiga yozildingiz! 🎉`,
            course_link: window.location.origin + '/dashboard.html'
        };

        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templates.courseNotification,
            templateParams
        );

        console.log('✅ Kurs xabarnomasi yuborildi');
        return true;
    } catch (error) {
        console.error('❌ Kurs xabarnomasi yuborilmadi:', error);
        return false;
    }
}
