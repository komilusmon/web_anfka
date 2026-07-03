// Video Player Manager - Faqat Firestore'dagi real videolarni ko'rsatadi
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
        const existing = document.getElementById('course-player-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'course-player-modal';
        modal.className = 'course-player-overlay';
        modal.innerHTML = `
            <div class="course-player-container">
                <div class="player-top-bar">
                    <span class="player-logo">🎓 ANFKA Academy</span>
                    <span class="player-video-title" id="player-video-title">Video yuklanmoqda...</span>
                    <button class="player-close-btn" onclick="videoPlayer.close()">✕</button>
                </div>
                <div class="player-main">
                    <div class="player-video-area">
                        <div class="player-video-wrapper" id="player-video-wrapper">
                            <div style="color:white;text-align:center;padding:3rem;">
                                <div class="spinner"></div><p>Video yuklanmoqda...</p>
                            </div>
                        </div>
                        <div class="player-info-bar">
                            <div class="player-info-left">
                                <span id="player-video-views">👁️ 0</span>
                                <span id="player-video-date">📅 Sana</span>
                            </div>
                            <div class="player-info-right">
                                <button class="player-action-btn" id="btn-mark-done" onclick="videoPlayer.toggleCompleted()">☑️ Yakunlash</button>
                            </div>
                        </div>
                    </div>
                    <div class="player-sidebar">
                        <div class="player-course-header">
                            <h3 id="player-course-title">Kurs</h3>
                            <div class="player-progress">
                                <span class="player-progress-text" id="player-progress-text">0% yakunlangan</span>
                                <div class="player-progress-bar">
                                    <div class="player-progress-fill" id="player-progress-fill" style="width:0%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="player-lessons-list" id="player-lessons-list"></div>
                        <div class="player-nav-buttons">
                            <button class="player-nav-btn" id="btn-prev-lesson" onclick="videoPlayer.previousVideo()" style="display:none;">⬅️ Oldingi</button>
                            <button class="player-nav-btn" id="btn-next-lesson" onclick="videoPlayer.nextVideo()" style="display:none;">Keyingi ➡️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }

    async openCourse(courseId, courseData) {
        this.currentCourse = { id: courseId, ...courseData };
        this.currentIndex = 0;
        this.isOpen = true;

        document.getElementById('course-player-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('player-course-title').textContent = courseData.title || 'Kurs';
        
        await this.loadLessons(courseId);
    }

    async loadLessons(courseId) {
        document.getElementById('player-lessons-list').innerHTML = '<div class="spinner"></div>';

        try {
            // Avval courseId bo'yicha
            let videos = await dbManager.getVideosByCourse(courseId);
            
            // Topilmasa, category bo'yicha
            if (videos.length === 0) {
                videos = await dbManager.getVideosByCategory(courseId);
            }
            
            // Hali ham bo'sh bo'lsa, barcha videolarni olish
            if (videos.length === 0) {
                const allVideos = await dbManager.getActiveVideos();
                videos = allVideos.filter(v => v.courseId === courseId || v.category === courseId);
            }

            this.videoList = videos.map(v => ({ ...v, completed: false }));

            if (this.videoList.length === 0) {
                document.getElementById('player-lessons-list').innerHTML = 
                    '<div style="color:#aaa;text-align:center;padding:2rem;">📭 Darsliklar topilmadi</div>';
                return;
            }

            await this.loadUserProgress();
            this.renderLessonList();

            if (this.currentIndex >= this.videoList.length) this.currentIndex = 0;
            this.playLesson(this.currentIndex);

        } catch (error) {
            console.error('Darsliklar xatolik:', error);
            document.getElementById('player-lessons-list').innerHTML = 
                '<div style="color:#aaa;text-align:center;padding:2rem;">❌ Yuklashda xatolik</div>';
        }
    }

    renderLessonList() {
        const container = document.getElementById('player-lessons-list');
        container.innerHTML = this.videoList.map((lesson, index) => `
            <div class="lesson-item ${lesson.completed ? 'completed' : ''} ${index === this.currentIndex ? 'active' : ''}"
                 onclick="videoPlayer.playLesson(${index})">
                <div class="lesson-number">${lesson.completed ? '✓' : (index + 1)}</div>
                <div class="lesson-info">
                    <div class="lesson-title">${lesson.title || 'Darslik'}</div>
                    <div class="lesson-duration">⏱️ ${lesson.duration || ''}</div>
                </div>
                ${lesson.completed ? '<span class="lesson-done">✅</span>' : ''}
            </div>
        `).join('');
    }

    playLesson(index) {
        if (index < 0 || index >= this.videoList.length) return;

        this.currentIndex = index;
        this.currentVideo = this.videoList[index];

        const wrapper = document.getElementById('player-video-wrapper');
        const url = this.currentVideo.url || '';

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(url);
            wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else if (url.includes('vimeo.com')) {
            wrapper.innerHTML = `<iframe src="${url}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        } else if (url) {
            wrapper.innerHTML = `<video controls autoplay><source src="${url}" type="video/mp4"></video>`;
        } else {
            wrapper.innerHTML = `<div style="color:white;text-align:center;padding:3rem;">⚠️ Video URL topilmadi</div>`;
        }

        document.getElementById('player-video-title').textContent = this.currentVideo.title || 'Darslik';
        document.getElementById('player-video-views').textContent = `👁️ ${this.currentVideo.views || 0}`;
        
        if (this.currentVideo.createdAt) {
            const d = this.currentVideo.createdAt.toDate ? this.currentVideo.createdAt.toDate() : new Date(this.currentVideo.createdAt);
            document.getElementById('player-video-date').textContent = '📅 ' + d.toLocaleDateString('uz-UZ');
        }

        document.getElementById('btn-prev-lesson').style.display = index > 0 ? 'block' : 'none';
        document.getElementById('btn-next-lesson').style.display = index < this.videoList.length - 1 ? 'block' : 'none';

        const doneBtn = document.getElementById('btn-mark-done');
        if (this.currentVideo.completed) {
            doneBtn.classList.add('done');
            doneBtn.innerHTML = '✅ Yakunlangan';
        } else {
            doneBtn.classList.remove('done');
            doneBtn.innerHTML = '☑️ Yakunlash';
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
            const ref = db.collection('videos').doc(this.currentVideo.id);
            await db.runTransaction(async (t) => {
                const doc = await t.get(ref);
                if (!doc.exists) return;
                t.update(ref, { views: (doc.data().views || 0) + 1 });
            });
            this.currentVideo.views = (this.currentVideo.views || 0) + 1;
        } catch (e) {}
    }

    async saveProgress() {
        const user = auth.currentUser;
        if (!user || !this.currentCourse) return;
        try {
            const completed = this.videoList.filter(v => v.completed).length;
            await rtdb.ref(`users/${user.uid}/progress/${this.currentCourse.id}`).update({
                currentLesson: this.currentIndex,
                totalLessons: this.videoList.length,
                completedLessons: completed,
                lastAccessed: Date.now()
            });
            this.updateProgressBar();
        } catch (e) {}
    }

    updateProgressBar() {
        const completed = this.videoList.filter(v => v.completed).length;
        const total = this.videoList.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        document.getElementById('player-progress-text').textContent = `${percent}% (${completed}/${total})`;
        document.getElementById('player-progress-fill').style.width = `${percent}%`;
    }

    async toggleCompleted() {
        if (!this.currentVideo) return;
        this.currentVideo.completed = !this.currentVideo.completed;

        const btn = document.getElementById('btn-mark-done');
        if (this.currentVideo.completed) {
            btn.classList.add('done');
            btn.innerHTML = '✅ Yakunlangan';
        } else {
            btn.classList.remove('done');
            btn.innerHTML = '☑️ Yakunlash';
        }

        this.renderLessonList();
        this.updateProgressBar();
        await this.saveProgress();

        const user = auth.currentUser;
        if (user && this.currentCourse) {
            const ids = this.videoList.filter(v => v.completed).map(v => v.id);
            try {
                await db.collection('users').doc(user.uid).set({
                    completedLessons: { [this.currentCourse.id]: ids }
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
            let completedIds = [];
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    const d = doc.data().completedLessons;
                    if (d && d[this.currentCourse.id]) completedIds = d[this.currentCourse.id];
                }
            } catch (e) {}
            this.videoList.forEach(v => v.completed = completedIds.includes(v.id));
            if (data?.currentLesson !== undefined) this.currentIndex = data.currentLesson;
            this.renderLessonList();
            this.updateProgressBar();
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
        document.getElementById('course-player-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.saveProgress();
    }
}

const videoPlayer = new VideoPlayer();
console.log('✅ Video Player tayyor');
