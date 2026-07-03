// Ma'lumotlar bazasi boshqaruvchisi
class DatabaseManager {
    constructor() {
        this.firestore = db;
        this.realtime = rtdb;
    }

    async getCategories() {
        try {
            const snapshot = await this.firestore.collection('categories').orderBy('name').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Kategoriyalar xatolik:', error);
            return [];
        }
    }

    async getActiveVideos() {
        try {
            const snapshot = await this.firestore.collection('videos')
                .orderBy('order', 'asc')
                .get();
            
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'active' || !data.status) {
                    videos.push({ id: doc.id, ...data });
                }
            });
            return videos;
        } catch (error) {
            console.error('Videolar xatolik:', error);
            return [];
        }
    }

    async getVideosByCourse(courseId) {
        try {
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
            return videos;
        } catch (error) {
            console.error('Kurs videolari xatolik:', error);
            return [];
        }
    }

    async getVideosByCategory(categoryId) {
        try {
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
            return videos;
        } catch (error) {
            console.error('Kategoriya videolari xatolik:', error);
            return [];
        }
    }

    async getNews(limit = 10) {
        try {
            const snapshot = await this.firestore.collection('news')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Yangiliklar xatolik:', error);
            return [];
        }
    }

    async getUserCourses(userId) {
        try {
            const userDoc = await this.firestore.collection('users').doc(userId).get();
            if (userDoc.exists) {
                return userDoc.data().courses || [];
            }
            return [];
        } catch (error) {
            return [];
        }
    }

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
            return { success: false };
        }
    }

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
}

const dbManager = new DatabaseManager();
console.log('✅ Database Manager tayyor');
