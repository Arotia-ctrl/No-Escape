document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".gallery-item");
    const images = document.querySelectorAll(".gallery-item img");
    const lightbox = document.querySelector("#lightbox");
    const lightboxImage = document.querySelector("#lightbox-image");
    const closeButton = document.querySelector("#lightbox-close");
    const prevButton = document.querySelector("#lightbox-prev");
    const nextButton = document.querySelector("#lightbox-next");
    const lightboxContent = document.querySelector(".lightbox-content");

    if (
        !items.length ||
        !images.length ||
        !lightbox ||
        !lightboxImage ||
        !closeButton ||
        !prevButton ||
        !nextButton ||
        !lightboxContent
    ) {
        return;
    }

    let currentIndex = 0;

    function showImage(index) {
        currentIndex = (index + images.length) % images.length;

        lightboxImage.src = images[currentIndex].src;
        lightboxImage.alt = images[currentIndex].alt;
    }

    function openLightbox(index) {
        showImage(index);

        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
        closeButton.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        if (items[currentIndex]) {
            items[currentIndex].focus();
        }
    }

    function showPrevious() {
        showImage(currentIndex - 1);
    }

    function showNext() {
        showImage(currentIndex + 1);
    }

    items.forEach((item, index) => {
        item.addEventListener("click", () => {
            openLightbox(index);
        });

        item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openLightbox(index);
            }
        });
    });

    closeButton.addEventListener("click", closeLightbox);
    prevButton.addEventListener("click", showPrevious);
    nextButton.addEventListener("click", showNext);

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox || event.target === lightboxContent) {
            closeLightbox();
        }
    });

    // Navigation tactile (swipe) sur mobile
    let touchStartX = 0;
    lightbox.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener("touchend", (event) => {
        const touchEndX = event.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) > 50) {
            if (diff < 0) {
                showNext();
            } else {
                showPrevious();
            }
        }
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
        if (!lightbox.classList.contains("active")) {
            return;
        }

        switch (event.key) {
            case "Escape":
                closeLightbox();
                break;

            case "ArrowLeft":
                showPrevious();
                break;

            case "ArrowRight":
                showNext();
                break;
        }
    });
});
