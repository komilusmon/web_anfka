// Google AdSense reklamalari boshqaruvi

class AdManager {
    constructor() {
        this.adSlots = {
            header: 'ca-pub-7357410271113724',
            sidebar: 'ca-pub-7357410271113724',
            content: 'ca-pub-7357410271113724',
            footer: 'ca-pub-7357410271113724'
        };
        this.adInitialized = false;
    }

    // Reklamalarni yaratish
    createAdUnit(containerId, format = 'auto') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const adDiv = document.createElement('div');
        adDiv.className = 'ad-container';
        adDiv.innerHTML = `
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-7357410271113724"
                 data-ad-slot="${this.adSlots[containerId] || ''}"
                 data-ad-format="${format}"
                 data-full-width-responsive="true"></ins>
        `;
        
        container.appendChild(adDiv);
        
        if (!this.adInitialized) {
            (adsbygoogle = window.adsbygoogle || []).push({});
            this.adInitialized = true;
        }
    }

    // Reklama joylarini ko'rsatish
    showAds() {
        this.createAdUnit('header-ad', 'auto');
        this.createAdUnit('sidebar-ad', 'rectangle');
        this.createAdUnit('content-ad', 'auto');
        this.createAdUnit('footer-ad', 'auto');
    }

    // Reklamalarni optimallashtirish
    loadOptimizedAds() {
        // Mobil qurilmalar uchun kichikroq reklamalar
        if (window.innerWidth < 768) {
            this.createAdUnit('header-ad', 'horizontal');
        } else {
            this.showAds();
        }
    }
}

// AdSense yuklanganda ishga tushirish
window.addEventListener('load', () => {
    const adManager = new AdManager();
    adManager.loadOptimizedAds();
});
