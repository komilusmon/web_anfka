// Video Player Manager
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

    async openCourse(courseId, courseData) {
        this.currentCourse = { id: courseId, ...courseData };
        this.isOpen = true;
        
        document.getElementById('video-player-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('course-title-display').textContent = courseData.title || 'Kurs';
        
        await this.loadLessons(courseId);
        await this.loadUserProgress();
    }

    async loadLessons(courseId) {
        try {
            const snapshot = await db.collection('videos')
                .where('courseId', '==', courseId)
                .orderBy('order', 'asc')
                .get();

            if (snapshot.empty) {
                this.videoList = this.getDefaultLessons();
            } else {
                this.videoList = [];
                snapshot.forEach(doc => {
                    this.videoList.push({ id: doc.id, ...doc.data() });
                });
            }
            
            this.renderLessonList();
            
            if (this.videoList.length > 0 && this.currentIndex === 0) {
                this.playLesson(0);
            }
        } catch (error) {
            console.error('Darsliklar xatolik:', error);
            this.videoList = this.getDefaultLessons();
            this.renderLessonList();
        }
    }

    getDefaultLessons() {
        return [
            { id: 'l1', title: 'Kirish', description: 'Kurs haqida', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '10:30', order: 1, views: 0 },
            { id: 'l2', title: 'Asosiy tushunchalar', description: 'Nazariy qism', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '15:45', order: 2, views: 0 },
            { id: 'l3', title: 'Amaliyot', description: 'Amaliy ish', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '20:00', order: 3, views: 0 }
        ];
    }

    renderLessonList() {
        const container = document.getElementById('lessons-list');
        container.innerHTML = this.videoList.map((lesson, index) => `
            <div class="lesson-item ${lesson.completed ? 'completed' : ''} ${index === this.currentIndex ? 'active' : ''}" 
                 onclick="videoPlayer.playLesson(${index})">
                <div class="lesson-number">${lesson.completed ? '✓' : (index + 1)}</div>
                <div class="lesson-info">
                    <div class="lesson-title">${lesson.title}</div>
                    <div class="lesson-duration">⏱️ ${lesson.duration || 'Noma\'lum'}</div>
                </div>
                <div class="lesson-status ${lesson.completed ? 'completed' : ''}">
                    ${lesson.completed ? '✓' : ''}
                </div>
            </div>
        `).join('');
    }

    playLesson(index) {
        if (index < 0 || index >= this.videoList.length) return;
        
        this.currentIndex = index;
        this.currentVideo = this.videoList[index];
        
        const container = document.getElementById('video-container');
        const url = this.currentVideo.url;
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(url);
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else {
            container.innerHTML = `<video controls autoplay><source src="${url}" type="video/mp4"></video>`;
        }
        
        document.getElementById('video-title-display').textContent = this.currentVideo.title;
        document.getElementById('video-views').textContent = `👁️ ${this.currentVideo.views || 0} ko'rishlar`;
        
        document.getElementById('btn-prev').style.display = index > 0 ? 'flex' : 'none';
        document.getElementById('btn-next').style.display = index < this.videoList.length - 1 ? 'flex' : 'none';
        
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

    extractYouTubeId(url) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
        return match ? match[1] : url;
    }

    async incrementViews() {
        if (!this.currentVideo?.id) return;
        try {
            await db.collection('videos').doc(this.currentVideo.id).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
            this.currentVideo.views = (this.currentVideo.views || 0) + 1;
            document.getElementById('video-views').textContent = `👁️ ${this.currentVideo.views} ko'rishlar`;
        } catch (e) {}
    }

    async saveProgress() {
        const user = auth.currentUser;
        if (!user || !this.currentCourse) return;
        
        try {
            const completedCount = this.videoList.filter(v => v.completed).length;
            await rtdb.ref(`users/${user.uid}/progress/${this.currentCourse.id}`).update({
                currentLesson: this.currentIndex,
                currentVideoId: this.currentVideo?.id,
                lastAccessed: firebase.database.ServerValue.TIMESTAMP,
                totalLessons: this.videoList.length,
                completedLessons: completedCount
            });
            this.updateProgressBar();
        } catch (e) {}
    }

    updateProgressBar() {
        const completed = this.videoList.filter(v => v.completed).length;
        const total = this.videoList.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('course-progress-text').textContent = `Progress: ${percent}% (${completed}/${total})`;
        document.getElementById('course-progress-fill').style.width = `${percent}%`;
    }

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
        if (user) {
            const completedIds = this.videoList.filter(v => v.completed).map(v => v.id);
            try {
                await db.collection('users').doc(user.uid).set({
                    completedLessons: { [this.currentCourse.id]: completedIds }
                }, { merge: true });
            } catch (e) {}
        }
    }

    async loadUserProgress() {
        const user = auth.currentUser;
        if (!user || !this.currentCourse) return;
        
        try {
            const snap = await rtdb.ref(`users/${user.uid}/progress/${this.currentCourse.id}`).once('value');
            const data = snap.val();
            
            const userDoc = await db.collection('users').doc(user.uid).get();
            const completedData = userDoc.exists ? userDoc.data().completedLessons : null;
            const completedIds = completedData?.[this.currentCourse.id] || [];
            
            this.videoList.forEach(v => {
                v.completed = completedIds.includes(v.id);
            });
            
            if (data?.currentLesson !== undefined) {
                this.currentIndex = data.currentLesson;
            }
            
            this.renderLessonList();
            this.updateProgressBar();
            
            if (this.currentIndex >= 0 && this.currentIndex < this.videoList.length) {
                this.playLesson(this.currentIndex);
            }
        } catch (e) {}
    }

    previousVideo() {
        if (this.currentIndex > 0) this.playLesson(this.currentIndex - 1);
    }

    nextVideo() {
        if (this.currentIndex < this.videoList.length - 1) this.playLesson(this.currentIndex + 1);
    }

    close() {
        this.isOpen = false;
        document.getElementById('video-player-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
        this.saveProgress();
    }
}

const videoPlayer = new VideoPlayer();
console.log('✅ Video Player tayyor');
