// ===== VIDEOLARNI RENDER QILISH (YANGILANGAN) =====
function renderVideos() {
    if (!elements.videosContainer) {
        console.warn('videosContainer topilmadi!');
        return;
    }
    
    let filteredVideos = [...allVideos];
    
    // Kategoriya filtri
    if (currentFilter !== 'all') {
        filteredVideos = filteredVideos.filter(v => v.category === currentFilter);
    }
    
    // Qidiruv
    const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase().trim() : '';
    if (searchTerm) {
        filteredVideos = filteredVideos.filter(v =>
            v.title.toLowerCase().includes(searchTerm) ||
            (v.description && v.description.toLowerCase().includes(searchTerm))
        );
    }
    
    console.log('Render qilinmoqda:', filteredVideos.length, 'ta video');
    
    if (filteredVideos.length === 0) {
        elements.videosContainer.innerHTML = '';
        if (elements.noVideos) {
            elements.noVideos.style.display = 'block';
        }
        return;
    }
    
    if (elements.noVideos) {
        elements.noVideos.style.display = 'none';
    }
    
    // ===== YANGI: Videolarni kurslar bo'yicha guruhlash =====
    const courseGroups = {};
    
    filteredVideos.forEach(video => {
        // Kurs ID sifatida courseId yoki category ishlatiladi
        const courseId = video.courseId || video.category || 'umumiy';
        
        if (!courseGroups[courseId]) {
            courseGroups[courseId] = {
                id: courseId,
                title: video.courseTitle || video.category || 'Kurs',
                icon: video.courseIcon || '📚',
                description: video.courseDescription || video.description || '',
                videos: [],
                totalDuration: 0
            };
        }
        courseGroups[courseId].videos.push(video);
    });
    
    // Kurs kartochkalarini yaratish
    const courses = Object.values(courseGroups);
    
    elements.videosContainer.innerHTML = courses.map(course => {
        const totalLessons = course.videos.length;
        
        return `
            <div class="video-card course-group-card" style="border: 2px solid var(--primary-color);">
                <div class="video-thumbnail" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; min-height: 180px;">
                    <span style="font-size: 4rem;">${course.icon || '📚'}</span>
                </div>
                <div class="video-info">
                    <h3>${course.title}</h3>
                    <p>${course.description ? course.description.substring(0, 100) + '...' : ''}</p>
                    <div class="video-meta">
                        <span class="category-badge">📚 ${totalLessons} ta dars</span>
                        <span class="date">🎓 Kurs</span>
                    </div>
                    <button class="cta-button" style="width: 100%; margin-top: 1rem; padding: 0.8rem;" 
                            onclick="openCourseGroup('${course.id}')">
                        🎓 Kursni Boshlash
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Reklamani qayta yuklash
    setTimeout(() => {
        if (typeof loadAdUnits === 'function') loadAdUnits();
    }, 500);
}

// ===== YANGI FUNKSIYA: Kurs guruhini ochish =====
function openCourseGroup(courseId) {
    // Kurs ma'lumotlarini topish
    const courseVideos = allVideos.filter(v => 
        (v.courseId === courseId) || (v.category === courseId)
    );
    
    let courseData = {
        title: 'Kurs',
        icon: '📚',
        description: '',
        lessonsCount: courseVideos.length
    };
    
    if (courseVideos.length > 0) {
        const first = courseVideos[0];
        courseData.title = first.courseTitle || first.category || 'Kurs';
        courseData.icon = first.courseIcon || '📚';
        courseData.description = first.courseDescription || '';
    }
    
    // Video player'ni ochish
    if (typeof videoPlayer !== 'undefined') {
        videoPlayer.openCourse(courseId, courseData);
    } else {
        console.error('videoPlayer topilmadi!');
    }
}
