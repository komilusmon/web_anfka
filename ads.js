// Google AdSense boshqaruvi
class AdManager {
    constructor() {
        this.initialized = false;
    }

    createAd(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-7357410271113724"
                 data-ad-slot=""
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        `;

        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.log('AdSense xatolik:', e);
        }
    }

    showAllAds() {
        this.createAd('header-ad');
        this.createAd('content-ad');
        this.createAd('footer-ad');
    }
}

window.addEventListener('load', () => {
    setTimeout(() => {
        const adManager = new AdManager();
        adManager.showAllAds();
    }, 1000);
});
