// Google AdSense boshqaruvi
function initAds() {
    try {
        if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7357410271113724';
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }
    } catch (e) {
        console.log('AdSense xatolik:', e);
    }
}

window.addEventListener('load', () => {
    setTimeout(initAds, 1000);
});

console.log('✅ AdSense tayyor');
