// Scrolling image gallery for 'Who We Are' section

document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.querySelector('.who-we-are .scrolling-image-gallery');
    if (!gallery) return;

    // Duplicate images for infinite loop effect
    const images = Array.from(gallery.querySelectorAll('.gallery-image'));
    images.forEach(img => {
        const clone = img.cloneNode(true);
        clone.classList.add('clone');
        gallery.appendChild(clone);
    });

    let pos = 0;
    function animate() {
        pos -= 0.5; // Adjust speed here
        if (Math.abs(pos) >= gallery.scrollWidth / 2) {
            pos = 0;
        }
        gallery.style.transform = `translateX(${pos}px)`;
        requestAnimationFrame(animate);
    }
    animate();
});
