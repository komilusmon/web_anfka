// ========================================
// MA'LUMOTLAR BAZASI BOSHQARUVCHISI
// ========================================

class DatabaseManager {
    constructor() {
        this.firestore = db;
        this.realtime = rtdb;
    }

    // Kategoriyalarni olish
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

    // BARCHA AKTIV VIDEOLARNI OLISH
    async getActiveVideos() {
        try {
            console.log('🔍 Barcha videolar olinmoqda...');
            
            const snapshot = await this.firestore.collection('videos')
                .orderBy('createdAt', 'desc')
                .get();
            
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // status: 'active' bo'lgan videolarni olish
                if (data.status === 'active' || !data.status) {
                    videos.push({ 
                        id: doc.id, 
                        ...data,
                        // category yoki courseId bo'lmasa 'umumiy' deb belgilash
                        category: data.category || 'umumiy',
                        courseId: data.courseId || data.category || 'umumiy'
                    });
                }
            });
            
            console.log('✅ Barcha aktiv videolar:', videos.length, 'ta');
            
            // Debug uchun birinchi videoni ko'rsatish
            if (videos.length > 0) {
                console.log('📹 Birinchi video:', {
                    id: videos[0].id,
                    title: videos[0].title,
                    category: videos[0].category,
                    courseId: videos[0].courseId,
                    status: videos[0].status
                });
            }
            
            return videos;
        } catch (error) {
            console.error('❌ Videolar xatolik:', error);
            return [];
        }
    }

    // Kurs bo'yicha videolarni olish
    async getVideosByCourse(courseId) {
        try {
            console.log('🔍 Kurs videolari qidirilmoqda:', courseId);
            
            // Avval courseId bo'yicha
            let snapshot = await this.firestore.collection('videos')
                .where('courseId', '==', courseId)
                .orderBy('createdAt', 'desc')
                .get();
            
            console.log('📊 courseId bo\'yicha:', snapshot.size, 'ta');
            
            // Topilmasa, category bo'yicha qidirish
            if (snapshot.empty) {
                console.log('⚠️ courseId topilmadi, category bo\'yicha qidirilmoqda...');
                snapshot = await this.firestore.collection('videos')
                    .where('category', '==', courseId)
                    .orderBy('createdAt', 'desc')
                    .get();
                console.log('📊 category bo\'yicha:', snapshot.size, 'ta');
            }
            
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'active' || !data.status) {
                    videos.push({ 
                        id: doc.id, 
                        ...data,
                        category: data.category || 'umumiy',
                        courseId: data.courseId || data.category || 'umumiy'
                    });
                }
            });
            
            console.log('✅ Topilgan videolar:', videos.length, 'ta');
            return videos;
        } catch (error) {
            console.error('❌ Kurs videolari xatolik:', error);
            return [];
        }
    }

    // Kategoriya bo'yicha videolarni olish
    async getVideosByCategory(categoryId) {
        try {
            console.log('🔍 Kategoriya videolari:', categoryId);
            
            const snapshot = await this.firestore.collection('videos')
                .where('category', '==', categoryId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'active' || !data.status) {
                    videos.push({ 
                        id: doc.id, 
                        ...data,
                        category: data.category || 'umumiy',
                        courseId: data.courseId || data.category || 'umumiy'
                    });
                }
            });
            
            console.log('✅ Kategoriya videolari:', videos.length, 'ta');
            return videos;
        } catch (error) {
            console.error('❌ Kategoriya videolari xatolik:', error);
            return [];
        }
    }

    // Yangiliklarni olish
    async getNews(limit = 10) {
        try {
            const snapshot = await this.firestore.collection('news')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const news = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'published' || !data.status) {
                    news.push({ id: doc.id, ...data });
                }
            });
            
            console.log('📰 Yangiliklar:', news.length, 'ta');
            return news;
        } catch (error) {
            console.error('❌ Yangiliklar xatolik:', error);
            return [];
        }
    }

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

    // Progress saqlash
    async saveUserProgress(userId, courseId, progressData) {
        try {
            await this.realtime.ref(`users/${userId}/progress/${courseId}`).update(progressData);
            return { success: true };
        } catch (error) {
            try {
                await this.realtime.ref(`users/${userId}/progress/${courseId}`).set(progressData);
                return { success: true };
            } catch (e) {
                return { success: false };
            }
        }
    }

    // Progress olish
    async getUserProgress(userId, courseId) {
        try {
            const snapshot = await this.realtime.ref(`users/${userId}/progress/${courseId}`).once('value');
            return snapshot.val() || null;
        } catch (error) {
            return null;
        }
    }

    // Foydalanuvchi ma'lumotlari
    async getUserData(userId) {
        try {
            const doc = await this.firestore.collection('users').doc(userId).get();
            if (doc.exists) return { id: doc.id, ...doc.data() };
            return null;
        } catch (error) {
            return null;
        }
    }

    // Ko'rishlar sonini oshirish
    async incrementVideoViews(videoId) {
        try {
            const ref = this.firestore.collection('videos').doc(videoId);
            await this.firestore.runTransaction(async (t) => {
                const doc = await t.get(ref);
                if (!doc.exists) return;
                t.update(ref, { views: (doc.data().views || 0) + 1 });
            });
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }
}

const dbManager = new DatabaseManager();
console.log('✅ Database Manager tayyor');
