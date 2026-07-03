// Video Player Manager
class VideoPlayer {
    constructor() {
        this.currentVideo = null;
        this.currentCourse = null;
        this.videoList = [];
        this.currentIndex = 0;
        this.isOpen = false;
        
        // Modal elementlarini yaratish
        this.createModal();
    }
    
    // Modal yaratish
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'video-player-modal';
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <!-- Video controls top -->
                <div class="video-controls-top">
                    <span>🎥</span>
                    <span class="video-title-display" id="video-title-display">Video yuklanmoqda...</span>
                    <button class="btn-close-video" onclick="videoPlayer.close()">✕</button>
                </div>
                
                <!-- Video player -->
                <div class="video-container" id="video-container">
                    <div style="color: white; text-align: center; padding: 2rem;">
                        <div class="spinner"></div>
                        <p>Video yuklanmoqda...</p>
                    </div>
                </div>
                
                <!-- Video info bar -->
                <div class="video-info-bar">
                    <span id="video-views">👁️ 0 ko'rishlar</span>
                    <span id="video-date">📅 Sana</span>
                    <div class="video-actions">
                        <button class="btn-video-action" id="btn-mark-completed" onclick="videoPlayer.toggleCompleted()">
                            ✅ Yakunlandi
                        </button>
                        <button class="btn-video-action" onclick="videoPlayer.previousVideo()" id="btn-prev">
                            ⬅️ Oldingi
                        </button>
                        <button class="btn-video-action" onclick="videoPlayer.nextVideo()" id="btn-next">
                            Keyingi ➡️
                        </button>
                    </div>
                </div>
                
                <!-- Darsliklar ro'yxati -->
                <div class="lessons-sidebar" id="lessons-list">
                    <!-- Darsliklar dinamik yuklanadi -->
                </div>
                
                <!-- Kurs ma'lumotlari -->
                <div class="course-info-panel" id="course-info-panel">
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
        
        // ESC tugmasi bilan yopish
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    // Kursni ochish
    async openCourse(courseId, courseData) {
        this.currentCourse = { id: courseId, ...courseData };
        this.isOpen = true;
        
        // Modalni ko'rsatish
        document.getElementById('video-player-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Kurs ma'lumotlarini yangilash
        document.getElementById('course-info-panel').querySelector('h3').textContent = 
            courseData.title || 'Kurs';
        
        // Darsliklarni yuklash
        await this.loadLessons(courseId);
        
        // Progressni yuklash
        await this.loadProgress();
    }
    
    // Darsliklarni yuklash
    async loadLessons(courseId) {
        try {
            // Firestore'dan darsliklarni olish
            const lessonsSnapshot = await db.collection('videos')
                .where('courseId', '==', courseId)
                .orderBy('order', 'asc')
                .get();
            
            if (lessonsSnapshot.empty) {
                // Test darsliklar (agar bo'sh bo'lsa)
                this.videoList = this.getDefaultLessons();
            } else {
                this.videoList = [];
                lessonsSnapshot.forEach(doc => {
                    this.videoList.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }
            
            // Darsliklar ro'yxatini ko'rsatish
            this.renderLessonList();
            
            // Progress ma'lumotlarini yuklash
            await this.loadUserProgress();
            
        } catch (error) {
            console.error('Darsliklarni yuklashda xatolik:', error);
            this.videoList = this.getDefaultLessons();
            this.renderLessonList();
        }
    }
    
    // Default darsliklar (test uchun)
    getDefaultLessons() {
        return [
            {
                id: 'lesson-1',
                title: 'Kirish va tanishuv',
                description: 'Kurs haqida umumiy ma\'lumot',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '10:30',
                order: 1,
                views: 150
            },
            {
                id: 'lesson-2',
                title: 'Asosiy tushunchalar',
                description: 'Muhim tushunchalar bilan tanishish',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '15:45',
                order: 2,
                views: 120
            },
            {
                id: 'lesson-3',
                title: 'Amaliy mashg\'ulot',
                description: 'Birinchi amaliy ish',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '20:00',
                order: 3,
                views: 100
            },
            {
                id: 'lesson-4',
                title: 'Mustaqil ish',
                description: 'Mustaqil bajarish uchun topshiriq',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '12:15',
                order: 4,
                views: 90
            }
        ];
    }
    
    // Darsliklar ro'yxatini render qilish
    renderLessonList() {
        const container = document.getElementById('lessons-list');
        
        container.innerHTML = this.videoList.map((lesson, index) => `
            <div class="lesson-item ${lesson.completed ? 'completed' : ''} ${index === this.currentIndex ? 'active' : ''}" 
                 onclick="videoPlayer.playLesson(${index})">
                <div class="lesson-number">
                    ${lesson.completed ? '✓' : (index + 1)}
                </div>
                <div class="lesson-info">
                    <div class="lesson-title">${lesson.title}</div>
                    <div class="lesson-duration">⏱️ ${lesson.duration || 'Noma\'lum'}</div>
                </div>
                <div class="lesson-status ${lesson.completed ? 'completed' : ''}">
                    ${lesson.completed ? '✓ Yakunlangan' : ''}
                </div>
            </div>
        `).join('');
        
        // Birinchi darslikni avtomatik yuklash
        if (this.videoList.length > 0 && this.currentIndex === 0) {
            this.playLesson(0);
        }
    }
    
    // Darslikni ko'rsatish
    async playLesson(index) {
        if (index < 0 || index >= this.videoList.length) return;
        
        this.currentIndex = index;
        this.currentVideo = this.videoList[index];
        
        // Video konteynerni yangilash
        const videoContainer = document.getElementById('video-container');
        const videoUrl = this.currentVideo.url;
        
        // URL turiga qarab iframe yoki video tegi
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            // YouTube uchun
            const videoId = this.extractYouTubeId(videoUrl);
            videoContainer.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>
            `;
        } else if (videoUrl.includes('vimeo.com')) {
            // Vimeo uchun
            videoContainer.innerHTML = `
                <iframe 
                    src="${videoUrl}?autoplay=1" 
                    allow="autoplay; fullscreen" 
                    allowfullscreen>
                </iframe>
            `;
        } else {
            // Oddiy video fayl uchun
            videoContainer.innerHTML = `
                <video controls autoplay>
                    <source src="${videoUrl}" type="video/mp4">
                    Sizning brauzeringiz video tegi qo'llab-quvvatlamaydi.
                </video>
            `;
        }
        
        // Ma'lumotlarni yangilash
        document.getElementById('video-title-display').textContent = this.currentVideo.title;
        document.getElementById('video-views').textContent = `👁️ ${this.currentVideo.views || 0} ko'rishlar`;
        document.getElementById('video-date').textContent = `📅 ${this.currentVideo.createdAt ? new Date(this.currentVideo.createdAt.toDate()).toLocaleDateString('uz-UZ') : 'Bugun'}`;
        
        // Tugmalarni yangilash
        document.getElementById('btn-prev').style.display = index > 0 ? 'flex' : 'none';
        document.getElementById('btn-next').style.display = index < this.videoList.length - 1 ? 'flex' : 'none';
        
        // Yakunlangan holatini yangilash
        const completedBtn = document.getElementById('btn-mark-completed');
        if (this.currentVideo.completed) {
            completedBtn.classList.add('completed');
            completedBtn.innerHTML = '✅ Yakunlangan';
        } else {
            completedBtn.classList.remove('completed');
            completedBtn.innerHTML = '☑️ Yakunlash';
        }
        
        // Darsliklar ro'yxatini yangilash
        this.renderLessonList();
        
        // Ko'rishlar sonini oshirish
        await this.incrementViews();
        
        // Progressni saqlash (Realtime DB)
        await this.saveProgress();
    }
    
    // YouTube ID'sini ajratib olish
    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url;
    }
    
    // Ko'rishlar sonini oshirish
    async incrementViews() {
        if (!this.currentVideo || !this.currentVideo.id) return;
        
        try {
            await db.collection('videos').doc(this.currentVideo.id).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
            
            // Lokal ko'rishlar sonini yangilash
            this.currentVideo.views = (this.currentVideo.views || 0) + 1;
            document.getElementById('video-views').textContent = `👁️ ${this.currentVideo.views} ko'rishlar`;
            
        } catch (error) {
            console.error('Ko\'rishlar sonini yangilashda xatolik:', error);
        }
    }
    
    // Progressni saqlash
    async saveProgress() {
        const user = auth.currentUser;
        if (!user || !this.currentCourse || !this.currentVideo) return;
        
        try {
            const progressData = {
                currentLesson: this.currentIndex,
                currentVideoId: this.currentVideo.id,
                lastAccessed: firebase.database.ServerValue.TIMESTAMP,
                totalLessons: this.videoList.length,
                completedLessons: this.videoList.filter(v => v.completed).length
            };
            
            await rtdb.ref(`users/${user.uid}/progress/${this.currentCourse.id}`).update(progressData);
            
            // Progress bar'ni yangilash
            this.updateProgressBar();
            
        } catch (error) {
            console.error('Progress saqlashda xatolik:', error);
        }
    }
    
    // Progress bar'ni yangilash
    updateProgressBar() {
        const completedCount = this.videoList.filter(v => v.completed).length;
        const totalCount = this.videoList.length;
        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        document.getElementById('course-progress-text').textContent = `Progress: ${percent}% (${completedCount}/${totalCount})`;
        document.getElementById('course-progress-fill').style.width = `${percent}%`;
    }
    
    // Yakunlangan holatini o'zgartirish
    async toggleCompleted() {
        if (!this.currentVideo) return;
        
        this.currentVideo.completed = !this.currentVideo.completed;
        
        // UI yangilash
        const completedBtn = document.getElementById('btn-mark-completed');
        if (this.currentVideo.completed) {
            completedBtn.classList.add('completed');
            completedBtn.innerHTML = '✅ Yakunlangan';
        } else {
            completedBtn.classList.remove('completed');
            completedBtn.innerHTML = '☑️ Yakunlash';
        }
        
        // Darsliklar ro'yxatini yangilash
        this.renderLessonList();
        
        // Progressni yangilash
        this.updateProgressBar();
        await this.saveProgress();
        
        // Firestore'da yakunlangan darsliklarni saqlash
        await this.saveCompletedLessons();
    }
    
    // Yakunlangan darsliklarni Firestore'da saqlash
    async saveCompletedLessons() {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            const completedIds = this.videoList
                .filter(v => v.completed)
                .map(v => v.id);
            
            await db.collection('users').doc(user.uid).update({
                [`completedLessons.${this.currentCourse.id}`]: completedIds
            });
        } catch (error) {
            console.error('Yakunlangan darsliklarni saqlashda xatolik:', error);
        }
    }
    
    // Oldingi video
    previousVideo() {
        if (this.currentIndex > 0) {
            this.playLesson(this.currentIndex - 1);
        }
    }
    
    // Keyingi video
    nextVideo() {
        if (this.currentIndex < this.videoList.length - 1) {
            this.playLesson(this.currentIndex + 1);
        }
    }
    
    // Foydalanuvchi progressini yuklash
    async loadUserProgress() {
        const user = auth.currentUser;
        if (!user || !this.currentCourse) return;
        
        try {
            // Realtime Database'dan progress
            const progressSnapshot = await rtdb.ref(
                `users/${user.uid}/progress/${this.currentCourse.id}`
            ).once('value');
            const progressData = progressSnapshot.val();
            
            // Firestore'dan yakunlangan darsliklar
            const userDoc = await db.collection('users').doc(user.uid).get();
            const completedData = userDoc.exists ? userDoc.data().completedLessons : null;
            const completedIds = completedData ? (completedData[this.currentCourse.id] || []) : [];
            
            // Yakunlangan darsliklarni belgilash
            this.videoList.forEach(video => {
                video.completed = completedIds.includes(video.id);
            });
            
            // Davom etish nuqtasi
            if (progressData && progressData.currentLesson) {
                this.currentIndex = progressData.currentLesson;
            }
            
            // Darsliklar ro'yxatini yangilash
            this.renderLessonList();
            this.updateProgressBar();
            
            // Oxirgi ko'rilgan darslikni yuklash
            if (this.currentIndex >= 0 && this.currentIndex < this.videoList.length) {
                this.playLesson(this.currentIndex);
            }
            
        } catch (error) {
            console.error('Progress yuklashda xatolik:', error);
        }
    }
    
    // Progressni yuklash (umumiy)
    async loadProgress() {
        await this.loadUserProgress();
    }
    
    // Modalni yopish
    close() {
        this.isOpen = false;
        document.getElementById('video-player-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Progressni saqlash
        this.saveProgress();
    }
}

// Global video player instance
const videoPlayer = new VideoPlayer();
console.log('✅ Video Player tayyor');
