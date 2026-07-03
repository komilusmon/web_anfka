// Ma'lumotlar bazasi boshqaruvchisi
class DatabaseManager {
    constructor() {
        this.firestore = db;
        this.realtime = rtdb;
    }

    // Kategoriyalarni olish
    async getCategories() {
        try {
            const snapshot = await this.firestore.collection('categories').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Kategoriyalar xatolik:', error);
            return [];
        }
    }

    // Videolarni olish
    async getVideos(categoryId = null) {
        try {
            let query = this.firestore.collection('videos');
            if (categoryId) {
                query = query.where('categoryId', '==', categoryId);
            }
            query = query.orderBy('order', 'asc');
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Videolar xatolik:', error);
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
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Yangiliklar xatolik:', error);
            return [];
        }
    }

    // Global xabar yuborish
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
            console.error('Xabar xatolik:', error);
            return { success: false };
        }
    }

    // Global xabarlarni tinglash
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

    // Foydalanuvchi kurslarini olish
    async getUserCourses(userId) {
        try {
            const userDoc = await this.firestore.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.courses || [];
            }
            return [];
        } catch (error) {
            console.error('Kurslar xatolik:', error);
            return [];
        }
    }
}

// Global instance
const dbManager = new DatabaseManager();
console.log('✅ Database Manager tayyor');
