// ========================================
// MA'LUMOTLAR BAZASI BOSHQARUVCHISI
// Firestore qoidalariga to'liq moslangan
// ========================================

class DatabaseManager {
    constructor() {
        this.firestore = db;
        this.realtime = rtdb;
    }

    // ========== KATEGORIYALAR ==========
    
    // Barcha kategoriyalarni olish
    async getCategories() {
        try {
            const snapshot = await this.firestore.collection('categories')
                .orderBy('name', 'asc')
                .get();
            
            const categories = [];
            snapshot.forEach(doc => {
                categories.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('📁 Kategoriyalar:', categories.length, 'ta');
            return categories;
        } catch (error) {
            console.error('❌ Kategoriyalar xatolik:', error);
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
            console.log('✅ Kategoriya qo\'shildi:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Kategoriya qo\'shish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Kategoriyani o'chirish
    async deleteCategory(categoryId) {
        try {
            await this.firestore.collection('categories').doc(categoryId).delete();
            console.log('✅ Kategoriya o\'chirildi:', categoryId);
            return { success: true };
        } catch (error) {
            console.error('❌ Kategoriya o\'chirish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== VIDEOLAR (DARSLIKLAR) ==========
    
    // Barcha aktiv videolarni olish
    async getActiveVideos() {
        try {
            const snapshot = await this.firestore.collection('videos')
                .orderBy('order', 'asc')
                .get();
            
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Faqat aktiv videolarni olish
                if (data.status === 'active' || !data.status) {
                    videos.push({ id: doc.id, ...data });
                }
            });
            
            console.log('🎬 Aktiv videolar:', videos.length, 'ta');
            return videos;
        } catch (error) {
            console.error('❌ Videolar xatolik:', error);
            return [];
        }
    }

    // courseId bo'yicha videolarni olish
    async getVideosByCourse(courseId) {
        try {
            console.log('🔍 Kurs videolari qidirilmoqda. courseId:', courseId);
            
            const snapshot = await this.firestore.collection('videos')
                .where('courseId', '==', courseId)
                .orderBy('order', 'asc')
                .get();
            
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'active' || !data.status) {
                    videos.push({ id: doc.id, ...data });
                }
            });
            
            console.log('📊 courseId bo\'yicha:', videos.length, 'ta video');
            return videos;
        } catch (error) {
            console.error('❌ Kurs videolari xatolik:', error);
            return [];
        }
    }

    // category bo'yicha videolarni olish
    async getVideosByCategory(categoryId) {
        try {
            console.log('🔍 Kategoriya videolari qidirilmoqda. category:', categoryId);
            
            const snapshot = await this.firestore.collection('videos')
                .where('category', '==', categoryId)
                .orderBy('order', 'asc')
                .get();
            
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'active' || !data.status) {
                    videos.push({ id: doc.id, ...data });
                }
            });
            
            console.log('📊 category bo\'yicha:', videos.length, 'ta video');
            return videos;
        } catch (error) {
            console.error('❌ Kategoriya videolari xatolik:', error);
            return [];
        }
    }

    // Bitta videoni olish
    async getVideoById(videoId) {
        try {
            const doc = await this.firestore.collection('videos').doc(videoId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Video olish xatolik:', error);
            return null;
        }
    }

    // Video qo'shish
    async addVideo(videoData) {
        try {
            // Validatsiya
            if (!videoData.title || videoData.title.length > 200) {
                return { success: false, error: 'Sarlavha noto\'g\'ri (1-200 belgi)' };
            }
            if (!videoData.url) {
                return { success: false, error: 'URL kiritilmagan' };
            }

            const docRef = await this.firestore.collection('videos').add({
                ...videoData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                views: 0,
                status: 'active'
            });
            
            console.log('✅ Video qo\'shildi:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Video qo\'shish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Videoni yangilash
    async updateVideo(videoId, videoData) {
        try {
            await this.firestore.collection('videos').doc(videoId).update(videoData);
            console.log('✅ Video yangilandi:', videoId);
            return { success: true };
        } catch (error) {
            console.error('❌ Video yangilash xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Videoni o'chirish
    async deleteVideo(videoId) {
        try {
            await this.firestore.collection('videos').doc(videoId).delete();
            console.log('✅ Video o\'chirildi:', videoId);
            return { success: true };
        } catch (error) {
            console.error('❌ Video o\'chirish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Ko'rishlar sonini oshirish
    async incrementVideoViews(videoId) {
        try {
            const videoRef = this.firestore.collection('videos').doc(videoId);
            await this.firestore.runTransaction(async (transaction) => {
                const doc = await transaction.get(videoRef);
                if (!doc.exists) return;
                const currentViews = doc.data().views || 0;
                transaction.update(videoRef, { views: currentViews + 1 });
            });
            return { success: true };
        } catch (error) {
            console.error('❌ Views oshirish xatolik:', error);
            return { success: false };
        }
    }

    // ========== YANGILIKLAR ==========
    
    // Yangiliklarni olish
    async getNews(limit = 10) {
        try {
            const snapshot = await this.firestore.collection('news')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const news = [];
            snapshot.forEach(doc => {
                news.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('📰 Yangiliklar:', news.length, 'ta');
            return news;
        } catch (error) {
            // Agar indeks xatosi bo'lsa, oddiy query bilan urinish
            console.warn('⚠️ Indeks xatosi, oddiy query ishlatilmoqda');
            try {
                const snapshot = await this.firestore.collection('news')
                    .orderBy('createdAt', 'desc')
                    .limit(limit)
                    .get();
                
                const news = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'published') {
                        news.push({ id: doc.id, ...data });
                    }
                });
                return news;
            } catch (err) {
                console.error('❌ Yangiliklar xatolik:', err);
                return [];
            }
        }
    }

    // Bitta yangilikni olish
    async getNewsById(newsId) {
        try {
            const doc = await this.firestore.collection('news').doc(newsId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Yangilik olish xatolik:', error);
            return null;
        }
    }

    // Yangilik qo'shish
    async addNews(newsData) {
        try {
            if (!newsData.title || newsData.title.length > 300) {
                return { success: false, error: 'Sarlavha noto\'g\'ri (1-300 belgi)' };
            }
            if (!newsData.content) {
                return { success: false, error: 'Kontent kiritilmagan' };
            }

            const docRef = await this.firestore.collection('news').add({
                ...newsData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                views: 0,
                status: 'published'
            });
            
            console.log('✅ Yangilik qo\'shildi:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Yangilik qo\'shish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Yangilikni o'chirish
    async deleteNews(newsId) {
        try {
            await this.firestore.collection('news').doc(newsId).delete();
            console.log('✅ Yangilik o\'chirildi:', newsId);
            return { success: true };
        } catch (error) {
            console.error('❌ Yangilik o\'chirish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Yangilik ko'rishlarini oshirish
    async incrementNewsViews(newsId) {
        try {
            const newsRef = this.firestore.collection('news').doc(newsId);
            await this.firestore.runTransaction(async (transaction) => {
                const doc = await transaction.get(newsRef);
                if (!doc.exists) return;
                const currentViews = doc.data().views || 0;
                transaction.update(newsRef, { views: currentViews + 1 });
            });
            return { success: true };
        } catch (error) {
            console.error('❌ Views oshirish xatolik:', error);
            return { success: false };
        }
    }

    // ========== REELS/SHORTS ==========
    
    // Reelslarni olish
    async getReels(limit = 20) {
        try {
            const snapshot = await this.firestore.collection('reels')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const reels = [];
            snapshot.forEach(doc => {
                reels.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('🎥 Reels:', reels.length, 'ta');
            return reels;
        } catch (error) {
            console.error('❌ Reels xatolik:', error);
            return [];
        }
    }

    // Reel qo'shish
    async addReel(reelData) {
        try {
            if (!reelData.title || reelData.title.length > 200) {
                return { success: false, error: 'Sarlavha noto\'g\'ri' };
            }
            if (!reelData.url) {
                return { success: false, error: 'URL kiritilmagan' };
            }

            const docRef = await this.firestore.collection('reels').add({
                ...reelData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                views: 0
            });
            
            console.log('✅ Reel qo\'shildi:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Reel qo\'shish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Reelni o'chirish
    async deleteReel(reelId) {
        try {
            await this.firestore.collection('reels').doc(reelId).delete();
            console.log('✅ Reel o\'chirildi:', reelId);
            return { success: true };
        } catch (error) {
            console.error('❌ Reel o\'chirish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== FOYDALANUVCHILAR ==========
    
    // Foydalanuvchi ma'lumotlarini olish
    async getUserData(userId) {
        try {
            const doc = await this.firestore.collection('users').doc(userId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Foydalanuvchi xatolik:', error);
            return null;
        }
    }

    // Foydalanuvchi yaratish/yangilash
    async saveUserData(userId, userData) {
        try {
            await this.firestore.collection('users').doc(userId).set(userData, { merge: true });
            console.log('✅ Foydalanuvchi saqlandi:', userId);
            return { success: true };
        } catch (error) {
            console.error('❌ Foydalanuvchi saqlash xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Foydalanuvchi kurslarini olish
    async getUserCourses(userId) {
        try {
            const userData = await this.getUserData(userId);
            if (userData) {
                return userData.courses || [];
            }
            return [];
        } catch (error) {
            console.error('❌ Kurslar xatolik:', error);
            return [];
        }
    }

    // Foydalanuvchi kursiga qo'shish
    async addUserCourse(userId, courseId) {
        try {
            const userRef = this.firestore.collection('users').doc(userId);
            const doc = await userRef.get();
            
            if (doc.exists) {
                const courses = doc.data().courses || [];
                if (!courses.includes(courseId)) {
                    courses.push(courseId);
                    await userRef.update({ courses: courses });
                }
            } else {
                await userRef.set({ courses: [courseId] }, { merge: true });
            }
            
            console.log('✅ Kurs qo\'shildi:', courseId);
            return { success: true };
        } catch (error) {
            console.error('❌ Kurs qo\'shish xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // Yakunlangan darsliklarni saqlash
    async saveCompletedLessons(userId, courseId, completedIds) {
        try {
            await this.firestore.collection('users').doc(userId).set({
                completedLessons: {
                    [courseId]: completedIds
                }
            }, { merge: true });
            
            console.log('✅ Yakunlangan darsliklar saqlandi');
            return { success: true };
        } catch (error) {
            console.error('❌ Yakunlangan darsliklar xatolik:', error);
            return { success: false };
        }
    }

    // Yakunlangan darsliklarni olish
    async getCompletedLessons(userId, courseId) {
        try {
            const userData = await this.getUserData(userId);
            if (userData && userData.completedLessons) {
                return userData.completedLessons[courseId] || [];
            }
            return [];
        } catch (error) {
            console.error('❌ Yakunlangan darsliklar xatolik:', error);
            return [];
        }
    }

    // ========== FEEDBACK (ALOQA) ==========
    
    // Fikr-mulohaza qo'shish
    async addFeedback(feedbackData) {
        try {
            const docRef = await this.firestore.collection('feedbacks').add({
                ...feedbackData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'yangi'
            });
            
            console.log('✅ Fikr-mulohaza qo\'shildi:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Fikr-mulohaza xatolik:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== REALTIME DATABASE OPERATSIYALARI ==========
    
    // Global xabar yuborish
    async sendGlobalMessage(userId, username, text) {
        try {
            const ref = this.realtime.ref('global_messages');
            const newRef = ref.push();
            await newRef.set({
                userId: userId,
                username: username,
                text: text,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ Xabar yuborildi');
            return { success: true };
        } catch (error) {
            console.error('❌ Xabar xatolik:', error);
            return { success: false };
        }
    }

    // Global xabarlarni tinglash
    onGlobalMessages(callback) {
        const ref = this.realtime.ref('global_messages');
        ref.orderByChild('timestamp').limitToLast(50).on('value', (snapshot) => {
            const messages = [];
            snapshot.forEach((child) => {
                messages.push({ id: child.key, ...child.val() });
            });
            callback(messages);
        });
    }

    // Foydalanuvchi progressini saqlash (Realtime DB)
    async saveUserProgress(userId, courseId, progressData) {
        try {
            await this.realtime.ref(`users/${userId}/progress/${courseId}`).update(progressData);
            return { success: true };
        } catch (error) {
            // Agar update ishlamasa, set ishlatish
            try {
                await this.realtime.ref(`users/${userId}/progress/${courseId}`).set(progressData);
                return { success: true };
            } catch (e) {
                console.error('❌ Progress xatolik:', e);
                return { success: false };
            }
        }
    }

    // Foydalanuvchi progressini olish (Realtime DB)
    async getUserProgress(userId, courseId) {
        try {
            const snapshot = await this.realtime.ref(`users/${userId}/progress/${courseId}`).once('value');
            return snapshot.val() || null;
        } catch (error) {
            console.error('❌ Progress olish xatolik:', error);
            return null;
        }
    }

    // Foydalanuvchilar sonini olish (Realtime DB)
    async getUsersCount() {
        try {
            const snapshot = await this.realtime.ref('users').once('value');
            return snapshot.numChildren();
        } catch (error) {
            console.error('❌ Foydalanuvchilar soni xatolik:', error);
            return 0;
        }
    }
}

// Global instance
const dbManager = new DatabaseManager();
console.log('✅ Database Manager tayyor');
console.log('📦 Kolleksiyalar: categories, videos, news, reels, users, feedbacks');
console.log('🔄 Realtime: global_messages, users/{uid}/progress');
