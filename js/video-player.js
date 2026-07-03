// ========================================
// VIDEO PLAYER - Yopilganda video to'xtaydi
// ========================================

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
                    <button class="player-close-btn" id="player-close-btn">✕</button>
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
                                <button class="player-action-btn" id="btn-mark-done">☑️ Yakunlash</button>
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
                            <button class="player-nav-btn" id="btn-prev-lesson" style="display:none;">⬅️ Oldingi</button>
                            <button class="player-nav-btn" id="btn-next-lesson" style="display:none;">Keyingi ➡️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Yopish tugmasi
        const closeBtn = document.getElementById('player-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // ESC tugmasi
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Modal tashqarisiga bosilganda
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });

        // Tugmalar
        const doneBtn = document.getElementById('btn-mark-done');
        if (doneBtn) {
            doneBtn.addEventListener('click', () => this.toggleCompleted());
        }

        const prevBtn = document.getElementById('btn-prev-lesson');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousVideo());
        }

        const nextBtn = document.getElementById('btn-next-lesson');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextVideo());
        }
    }

    // Kursni ochish
    async openCourse(courseId, courseData) {
        this.currentCourse = { id: courseId, ...courseData };
        this.currentIndex = 0;
        this.isOpen = true;

        document.getElementById('course-player-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('player-course-title').textContent = courseData.title || 'Kurs';
        
        await this.loadLessons(courseId);
    }

    // Firestore'dan darsliklarni yuklash
    async loadLessons(courseId) {
        const lessonsList = document.getElementById('player-lessons-list');
        lessonsList.innerHTML = '<div class="spinner"></div>';

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
                videos = allVideos.filter(v => 
                    v.courseId === courseId || 
                    v.category === courseId ||
                    !v.courseId || !v.category
                );
            }

            this.videoList = videos.map(v => ({ ...v, completed: false }));

            console.log('✅ Darsliklar:', this.videoList.length, 'ta');

            if (this.videoList.length === 0) {
                lessonsList.innerHTML = '<div style="color:#aaa;text-align:center;padding:2rem;">📭 Darsliklar topilmadi</div>';
                return;
            }

            await this.loadUserProgress();
            this.renderLessonList();

            if (this.currentIndex >= this.videoList.length) this.currentIndex = 0;
            this.playLesson(this.currentIndex);

        } catch (error) {
            console.error('❌ Darsliklar xatolik:', error);
            lessonsList.innerHTML = '<div style="color:#aaa;text-align:center;padding:2rem;">❌ Yuklashda xatolik</div>';
        }
    }

    // Darsliklar ro'yxatini ko'rsatish
    renderLessonList() {
        const container = document.getElementById('player-lessons-list');
        if (!container) return;

        container.innerHTML = this.videoList.map((lesson, index) => `
            <div class="lesson-item ${lesson.completed ? 'completed' : ''} ${index === this.currentIndex ? 'active' : ''}"
                 data-index="${index}">
                <div class="lesson-number">${lesson.completed ? '✓' : (index + 1)}</div>
                <div class="lesson-info">
                    <div class="lesson-title">${lesson.title || 'Darslik'}</div>
                    <div class="lesson-duration">⏱️ ${lesson.duration || ''}</div>
                </div>
                ${lesson.completed ? '<span class="lesson-done">✅</span>' : ''}
            </div>
        `).join('');

        // Click event'larni qo'shish
        container.querySelectorAll('.lesson-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.playLesson(index);
            });
        });
    }

    // Darslikni o'ynatish
    playLesson(index) {
        if (index < 0 || index >= this.videoList.length) return;

        this.currentIndex = index;
        this.currentVideo = this.videoList[index];

        console.log('▶️', this.currentVideo.title);

        const wrapper = document.getElementById('player-video-wrapper');
        const url = this.currentVideo.url || '';

        // AVVALGI VIDEONI TO'LIQ O'CHIRISH
        wrapper.innerHTML = '';

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(url);
            wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1" allow="autoplay; encrypted-media" allowfullscreen id="youtube-player"></iframe>`;
        } else if (url.includes('vimeo.com')) {
            wrapper.innerHTML = `<iframe src="${url}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        } else if (url) {
            wrapper.innerHTML = `<video controls autoplay id="html5-player"><source src="${url}" type="video/mp4"></video>`;
        } else {
            wrapper.innerHTML = `<div style="color:white;text-align:center;padding:3rem;">⚠️ Video URL topilmadi</div>`;
        }

        // Ma'lumotlarni yangilash
        document.getElementById('player-video-title').textContent = this.currentVideo.title || 'Darslik';
        document.getElementById('player-video-views').textContent = `👁️ ${this.currentVideo.views || 0}`;
        
        if (this.currentVideo.createdAt) {
            const d = this.currentVideo.createdAt.toDate ? this.currentVideo.createdAt.toDate() : new Date(this.currentVideo.createdAt);
            document.getElementById('player-video-date').textContent = '📅 ' + d.toLocaleDateString('uz-UZ');
        }

        // Tugmalar
        const prevBtn = document.getElementById('btn-prev-lesson');
        const nextBtn = document.getElementById('btn-next-lesson');
        if (prevBtn) prevBtn.style.display = index > 0 ? 'block' : 'none';
        if (nextBtn) nextBtn.style.display = index < this.videoList.length - 1 ? 'block' : 'none';

        // Yakunlash tugmasi
        const doneBtn = document.getElementById('btn-mark-done');
        if (doneBtn) {
            if (this.currentVideo.completed) {
                doneBtn.classList.add('done');
                doneBtn.innerHTML = '✅ Yakunlangan';
            } else {
                doneBtn.classList.remove('done');
                doneBtn.innerHTML = '☑️ Yakunlash';
            }
        }

        this.renderLessonList();
        this.incrementViews();
        this.saveProgress();
    }

    // YouTube ID'sini ajratib olish
    extractYouTubeId(url) {
        if (!url) return '';
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?#]+)/);
        return match ? match[1] : url;
    }

    // Ko'rishlar sonini oshirish
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
        } catch (e) {
            console.log('Views:', e);
        }
    }

    // Progressni saqlash
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
        } catch (e) {
            try {
                await rtdb.ref(`users/${user.uid}/progress/${this.currentCourse.id}`).set({
                    currentLesson: this.currentIndex,
                    totalLessons: this.videoList.length,
                    completedLessons: completed,
                    lastAccessed: Date.now()
                });
            } catch (e2) {}
        }
    }

    // Progress bar'ni yangilash
    updateProgressBar() {
        const completed = this.videoList.filter(v => v.completed).length;
        const total = this.videoList.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        const textEl = document.getElementById('player-progress-text');
        const fillEl = document.getElementById('player-progress-fill');
        if (textEl) textEl.textContent = `${percent}% (${completed}/${total})`;
        if (fillEl) fillEl.style.width = `${percent}%`;
    }

    // Yakunlash
    async toggleCompleted() {
        if (!this.currentVideo) return;
        this.currentVideo.completed = !this.currentVideo.completed;

        const btn = document.getElementById('btn-mark-done');
        if (btn) {
            if (this.currentVideo.completed) {
                btn.classList.add('done');
                btn.innerHTML = '✅ Yakunlangan';
            } else {
                btn.classList.remove('done');
                btn.innerHTML = '☑️ Yakunlash';
            }
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

    // Foydalanuvchi progressini yuklash
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

    // ===== ASOSIY TUZATILGAN QISM: YOPISH =====
    close() {
        console.log('🔒 Video player yopilmoqda...');
        
        this.isOpen = false;
        
        // 1. Video konteynerni to'liq tozalash (video to'xtaydi)
        const wrapper = document.getElementById('player-video-wrapper');
        if (wrapper) {
            wrapper.innerHTML = ''; // Barcha iframe/video elementlarni o'chirish
        }
        
        // 2. Modalni yashirish
        const modal = document.getElementById('course-player-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // 3. Scroll'ni qaytarish
        document.body.style.overflow = 'auto';
        
        // 4. Progressni saqlash
        this.saveProgress();
        
        // 5. Joriy videoni tozalash
        this.currentVideo = null;
        
        console.log('✅ Video player yopildi');
    }
}

// Global instance
const videoPlayer = new VideoPlayer();
console.log('✅ Video Player tayyor');
