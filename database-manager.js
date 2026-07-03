// Ma'lumotlar bazasi boshqaruvchisi
class DatabaseManager {
    constructor() {
        this.firestore = db; // Firestore - kurslar, videolar uchun
        this.realtime = rtdb; // Realtime - xabarlar, foydalanuvchilar uchun
    }

    // ========== FIRESTORE OPERATSIYALARI ==========
    
    // Kategoriyalarni olish
    async getCategories() {
        try {
            const snapshot = await this.firestore.collection('categories').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Kategoriyalarni olishda xatolik:', error);
            return [];
        }
    }

    // Kategoriya qo'shish
    async addCategory(categoryData) {
        try {
            const docRef = await this.firestore.collection('categories').add({
                ...categoryData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Kategoriya qo\'shishda xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Videolarni olish (darsliklar)
    async getVideos(categoryId = null) {
        try {
            let query = this.firestore.collection('videos');
            if (categoryId) {
                query = query.where('categoryId', '==', categoryId);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Videolarni olishda xatolik:', error);
            return [];
        }
    }

    // Video qo'shish
    async addVideo(videoData) {
        try {
            // Validatsiya
            if (!videoData.title || videoData.title.length > 200) {
                return { success: false, error: 'Sarlavha noto\'g\'ri' };
            }
            if (!videoData.url) {
                return { success: false, error: 'URL kiritilmagan' };
            }

            const docRef = await this.firestore.collection('videos').add({
                ...videoData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                views: 0
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Video qo\'shishda xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Yangiliklarni olish
    async getNews(limit = 10) {
        try {
            const snapshot = await this.firestore.collection('news')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Yangiliklarni olishda xatolik:', error);
            return [];
        }
    }

    // Yangilik qo'shish
    async addNews(newsData) {
        try {
            if (!newsData.title || newsData.title.length > 300) {
                return { success: false, error: 'Sarlavha noto\'g\'ri' };
            }
            if (!newsData.content) {
                return { success: false, error: 'Kontent kiritilmagan' };
            }

            const docRef = await this.firestore.collection('news').add({
                ...newsData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Yangilik qo\'shishda xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Reels/Shorts videolarni olish
    async getReels(limit = 20) {
        try {
            const snapshot = await this.firestore.collection('reels')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Reelslarni olishda xatolik:', error);
            return [];
        }
    }

    // Foydalanuvchi kurslarini olish
    async getUserCourses(userId) {
        try {
            const userDoc = await this.firestore.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const courseIds = userData.courses || [];
                
                // Kurs ma'lumotlarini olish
                const courses = [];
                for (const courseId of courseIds) {
                    const courseDoc = await this.firestore.collection('courses').doc(courseId).get();
                    if (courseDoc.exists) {
                        courses.push({
                            id: courseDoc.id,
                            ...courseDoc.data()
                        });
                    }
                }
                return courses;
            }
            return [];
        } catch (error) {
            console.error('Kurslarni olishda xatolik:', error);
            return [];
        }
    }

    // ========== REALTIME DATABASE OPERATSIYALARI ==========
    
    // Xabar yuborish (global chat)
    async sendGlobalMessage(userId, username, text) {
        try {
            const messagesRef = this.realtime.ref('global_messages');
            const newMessageRef = messagesRef.push();
            await newMessageRef.set({
                userId: userId,
                username: username,
                text: text,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true };
        } catch (error) {
            console.error('Xabar yuborishda xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Global xabarlarni olish
    onGlobalMessages(callback) {
        const messagesRef = this.realtime.ref('global_messages');
        messagesRef.orderByChild('timestamp').limitToLast(50).on('value', (snapshot) => {
            const messages = [];
            snapshot.forEach((child) => {
                messages.push({
                    id: child.key,
                    ...child.val()
                });
            });
            callback(messages);
        });
    }

    // Foydalanuvchi progressini yangilash (Realtime)
    async updateProgress(userId, courseId, progress) {
        try {
            await this.realtime.ref(`users/${userId}/progress/${courseId}`).update({
                completed: progress.completed || 0,
                total: progress.total || 0,
                lastAccessed: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true };
        } catch (error) {
            console.error('Progress yangilashda xatolik:', error);
            return { success: false };
        }
    }
}

// Global instance
const dbManager = new DatabaseManager();
console.log('✅ Database Manager tayyor');
