// Video Player Manager - Firestore videolari bilan ishlaydi
class VideoPlayer {
    constructor() {
        this.currentVideo = null;
        this.currentCourse = null;
        this.videoList = [];
        this.currentIndex = 0;
        this.isOpen = false;
        this.createModal();
    }

    createModal() {
        const existingModal = document.getElementById('video-player-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'video-player-modal';
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <div class="video-controls-top">
                    <span>🎥</span>
                    <span class="video-title-display" id="video-title-display">Video yuklanmoqda...</span>
                    <button class="btn-close-video" onclick="videoPlayer.close()">✕</button>
                </div>
                <div class="video-container" id="video-container">
                    <div style="color: white; text-align: center; padding: 2rem;">
                        <div class="spinner"></div>
                        <p>Video yuklanmoqda...</p>
                    </div>
                </div>
                <div class="video-info-bar">
                    <span id="video-views">👁️ 0 ko'rishlar</span>
                    <span id="video-date">📅 Sana</span>
                    <div class="video-actions">
                        <button class="btn-video-action" id="btn-mark-completed" onclick="videoPlayer.toggleCompleted()">
                            ☑️ Yakunlash
                        </button>
                        <button class="btn-video-action" onclick="videoPlayer.previousVideo()" id="btn-prev" style="display:none;">
                            ⬅️ Oldingi
                        </button>
                        <button class="btn-video-action" onclick="videoPlayer.nextVideo()" id="btn-next" style="display:none;">
                            Keyingi ➡️
                        </button>
                    </div>
                </div>
                <div class="lessons-sidebar" id="lessons-list"></div>
                <div class="course-info-panel" id="course-info-panel">
                    <h3 id="course-title-display">Kurs</h3>
                    <div class="course-progress-large">
                        <span id="course-progress-text">Progress: 0%</span>
                        <div class="progress-bar-large">
                            <div class="progress-fill-large" id="course-progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    // Kursni ochish - Firestore'dan videolarni yuklaydi
    async openCourse(courseId, courseData) {
        this.currentCourse = { id: courseId, ...courseData };
        this.currentIndex = 0;
        this.isOpen = true;
        
        const modal = document.getElementById('video-player-modal');
        if (modal) modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('course-title-display').textContent = courseData.title || 'Kurs';
        
        await this.loadLessons(courseId);
    }

    // Firestore'dan darsliklarni yuklash
    async loadLessons(courseId) {
        console.log('📥 Darsliklar yuklanmoqda. Kurs ID:', courseId);
        
        try {
            // SIZNING TIZIMINGIZDA: status: 'active' bo'lgan videolarni olish
            // Avval courseId bo'yicha qidirish
            let snapshot = await db.collection('videos')
                .where('courseId', '==', courseId)
                .orderBy('order', 'asc')
                .get();
            
            console.log('📊 courseId bo\'yicha topilgan:', snapshot.size);
            
            // Agar topilmasa, category bo'yicha qidirish
            if (snapshot.empty) {
                snapshot = await db.collection('videos')
                    .where('category', '==', courseId)
                    .orderBy('order', 'asc')
                    .get();
                console.log('📊 category bo\'yicha topilgan:', snapshot.size);
            }
            
            // Barcha videolarni filtrlab olish (status: 'active')
            this.videoList = [];
            
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Faqat aktiv videolarni qo'shish
                    if (data.status === 'active' || !data.status) {
                        this.videoList.push({ 
                            id: doc.id, 
                            ...data,
                            completed: false 
                        });
                    }
                });
            }
            
            // Agar hali ham topilmasa, barcha aktiv videolarni olish
            if (this.videoList.length === 0) {
                const allSnapshot = await db.collection('videos')
                    .orderBy('order', 'asc')
                    .get();
                
                allSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'active' || !data.status) {
                        // courseId yoki category bo'yicha filtr
                        if (data.courseId === courseId || 
                            data.category === courseId || 
                            !courseId || courseId === 'all') {
                            this.videoList.push({ 
                                id: doc.id, 
                                ...data,
                                completed: false 
                            });
                        }
                    }
                });
            }
            
            console.log('✅ Aktiv videolar:', this.videoList.length, 'ta');
            
            // Agar hech narsa topilmasa, default darsliklar
            if (this.videoList.length === 0) {
                console.log('⚠️ Videolar topilmadi. Default darsliklar ko\'rsatiladi.');
                this.videoList = this.getDefaultLessons();
            }
            
            this.renderLessonList();
            
            // Progressni yuklash
            await this.loadUserProgress();
            
            // Birinchi darslikni boshlash yoki davom ettirish
            if (this.videoList.length > 0) {
                if (this.currentIndex >= this.videoList.length) {
                    this.currentIndex = 0;
                }
                this.playLesson(this.currentIndex);
            }
            
        } catch (error) {
            console.error('❌ Darsliklarni yuklashda xatolik:', error);
            this.videoList = this.getDefaultLessons();
            this.renderLessonList();
            if (this.videoList.length > 0) {
                this.playLesson(0);
            }
        }
    }

    // Default darsliklar (Firebase bo'sh bo'lganda)
    getDefaultLessons() {
        return [
            { 
                id: 'default-1', 
                title: '1-dars: Kirish', 
                description: 'Kurs haqida umumiy ma\'lumot', 
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                duration: '10:30', 
                order: 1, 
                views: 0,
                category: 'umumiy'
            },
            { 
                id: 'default-2', 
                title: '2-dars: Asosiy tushunchalar', 
                description: 'Muhim tushunchalar bilan tanishish', 
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                duration: '15:45', 
                order: 2, 
                views: 0,
                category: 'umumiy'
            },
            { 
                id: 'default-3', 
                title: '3-dars: Amaliy mashg\'ulot', 
                description: 'Birinchi amaliy ish', 
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                duration: '20:00', 
                order: 3, 
                views: 0,
                category: 'umumiy'
            }
        ];
    }

    // Darsliklar ro'yxatini ko'rsatish
    renderLessonList() {
        const container = document.getElementById('lessons-list');
        if (!container) return;
        
        container.innerHTML = this.videoList.map((lesson, index) => `
            <div class="lesson-item ${lesson.completed ? 'completed' : ''} ${index === this.currentIndex ? 'active' : ''}" 
                 onclick="videoPlayer.playLesson(${index})">
                <div class="lesson-number">${lesson.completed ? '✓' : (index + 1)}</div>
                <div class="lesson-info">
                    <div class="lesson-title">${lesson.title || 'Darslik'}</div>
                    <div class="lesson-duration">⏱️ ${lesson.duration || 'Noma\'lum'}</div>
                </div>
                <div class="lesson-status ${lesson.completed ? 'completed' : ''}">
                    ${lesson.completed ? '✓' : ''}
                </div>
            </div>
        `).join('');
    }

    // Darslikni o'ynatish
    playLesson(index) {
        if (index < 0 || index >= this.videoList.length) return;
        
        this.currentIndex = index;
        this.currentVideo = this.videoList[index];
        
        console.log('▶️ O\'ynalmoqda:', this.currentVideo.title, '| URL:', this.currentVideo.url);
        
        const container = document.getElementById('video-container');
        if (!container) return;
        
        const url = this.currentVideo.url || '';
        
        // YouTube URL'larini qayta ishlash
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(url);
            container.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>`;
        } else if (url.includes('vimeo.com')) {
            container.innerHTML = `
                <iframe 
                    src="${url}?autoplay=1" 
                    allow="autoplay; fullscreen" 
                    allowfullscreen>
                </iframe>`;
        } else if (url) {
            container.innerHTML = `
                <video controls autoplay>
                    <source src="${url}" type="video/mp4">
                    Sizning brauzeringiz video tegi qo'llab-quvvatlamaydi.
                </video>`;
        } else {
            container.innerHTML = `
                <div style="color: white; text-align: center; padding: 2rem;">
                    <p>⚠️ Video URL topilmadi</p>
                </div>`;
        }
        
        // Ma'lumotlarni yangilash
        document.getElementById('video-title-display').textContent = this.currentVideo.title || 'Darslik';
        document.getElementById('video-views').textContent = `👁️ ${this.currentVideo.views || 0} ko'rishlar`;
        
        if (this.currentVideo.createdAt) {
            const date = this.currentVideo.createdAt.toDate ? 
                this.currentVideo.createdAt.toDate() : 
                new Date(this.currentVideo.createdAt);
            document.getElementById('video-date').textContent = `📅 ${date.toLocaleDateString('uz-UZ')}`;
        } else {
            document.getElementById('video-date').textContent = '📅 Bugun';
        }
        
        // Tugmalar
        document.getElementById('btn-prev').style.display = index > 0 ? 'flex' : 'none';
        document.getElementById('btn-next').style.display = index < this.videoList.length - 1 ? 'flex' : 'none';
        
        // Yakunlash tugmasi
        const completedBtn = document.getElementById('btn-mark-completed');
        if (this.currentVideo.completed) {
            completedBtn.classList.add('completed');
            completedBtn.innerHTML = '✅ Yakunlangan';
        } else {
            completedBtn.classList.remove('completed');
            completedBtn.innerHTML = '☑️ Yakunlash';
        }
        
        this.renderLessonList();
        this.incrementViews();
        this.saveProgress();
    }

    // YouTube ID'sini ajratib olish
    extractYouTubeId(url) {
        if (!url) return '';
        const patterns = [
            /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/,
            /youtube.com\/shorts\/([^&?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }
        return url;
    }

    // Ko'rishlar sonini oshirish
    async incrementViews() {
        if (!this.currentVideo?.id) return;
        if (this.currentVideo.id.startsWith('default-')) return;
        
        try {
            const videoRef = db.collection('videos').doc(this.currentVideo.id);
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(videoRef);
                if (!doc.exists) return;
                const currentViews = doc.data().views || 0;
                transaction.update(videoRef, { views: currentViews + 1 });
            });
            
            this.currentVideo.views = (this.currentVideo.views || 0) + 1;
            document.getElementById('video-views').textContent = `👁️ ${this.currentVideo.views} ko'rishlar`;
        } catch (e) {
            console.log('Ko\'rishlar yangilanmadi:', e);
        }
    }

    // Progressni saqlash
    async saveProgress() {
        const user = auth.currentUser;
        if (!user || !this.currentCourse) return;
        
        try {
            const completedCount = this.videoList.filter(v => v.completed).length;
            const progressData = {
                currentLesson: this.currentIndex,
                currentVideoId: this.currentVideo?.id || '',
                lastAccessed: firebase.database.ServerValue.TIMESTAMP,
                totalLessons: this.videoList.length,
                completedLessons: completedCount
            };
            
            await rtdb.ref(`users/${user.uid}/progress/${this.currentCourse.id}`).update(progressData);
            this.updateProgressBar();
        } catch (e) {
            console.log('Progress saqlanmadi:', e);
        }
    }

    // Progress bar'ni yangilash
    updateProgressBar() {
        const completed = this.videoList.filter(v => v.completed).length;
        const total = this.videoList.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('course-progress-text').textContent = 
            `Progress: ${percent}% (${completed}/${total})`;
        document.getElementById('course-progress-fill').style.width = `${percent}%`;
    }

    // Yakunlash
    async toggleCompleted() {
        if (!this.currentVideo) return;
        
        this.currentVideo.completed = !this.currentVideo.completed;
        
        const btn = document.getElementById('btn-mark-completed');
        if (this.currentVideo.completed) {
            btn.classList.add('completed');
            btn.innerHTML = '✅ Yakunlangan';
        } else {
            btn.classList.remove('completed');
            btn.innerHTML = '☑️ Yakunlash';
        }
        
        this.renderLessonList();
        this.updateProgressBar();
        await this.saveProgress();
        
        const user = auth.currentUser;
        if (user && this.currentCourse) {
            const completedIds = this.videoList.filter(v => v.completed).map(v => v.id);
            try {
                await db.collection('users').doc(user.uid).set({
                    completedLessons: { [this.currentCourse.id]: completedIds }
                }, { merge: true });
            } catch (e) {}
        }
    }

    // Foydalanuvchi progressini yuklash
    async loadUserProgress() {
        const user = auth.currentUser;
        if (!user || !this.currentCourse) return;
        
        try {
            const snap = await rtdb.ref(`users/${user.uid}/progress/${this.currentCourse.id}`).once('value');
            const data = snap.val();
            
            let completedIds = [];
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const completedData = userDoc.data().completedLessons;
                    if (completedData && completedData[this.currentCourse.id]) {
                        completedIds = completedData[this.currentCourse.id];
                    }
                }
            } catch (e) {}
            
            this.videoList.forEach(v => {
                v.completed = completedIds.includes(v.id);
            });
            
            if (data && data.currentLesson !== undefined) {
                this.currentIndex = data.currentLesson;
            }
            
            this.renderLessonList();
            this.updateProgressBar();
            
        } catch (e) {
            console.log('Progress yuklanmadi:', e);
        }
    }

    // Oldingi video
    previousVideo() {
        if (this.currentIndex > 0) this.playLesson(this.currentIndex - 1);
    }

    // Keyingi video
    nextVideo() {
        if (this.currentIndex < this.videoList.length - 1) this.playLesson(this.currentIndex + 1);
    }

    // Yopish
    close() {
        this.isOpen = false;
        const modal = document.getElementById('video-player-modal');
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.saveProgress();
    }
}

// Global instance
const videoPlayer = new VideoPlayer();
console.log('✅ Video Player tayyor');
