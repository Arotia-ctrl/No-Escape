document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll(".gallery-item img");
    const lightbox = document.querySelector("#lightbox");
    const lightboxImage = document.querySelector("#lightbox-image");
    const closeButton = document.querySelector("#lightbox-close");
    const prevButton = document.querySelector("#lightbox-prev");
    const nextButton = document.querySelector("#lightbox-next");
    const lightboxContent = document.querySelector(".lightbox-content");

    if (
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
    }

    function closeLightbox() {
        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";
    }

    function showPrevious() {
        showImage(currentIndex - 1);
    }

    function showNext() {
        showImage(currentIndex + 1);
    }

    images.forEach((image, index) => {
        image.addEventListener("click", () => {
            openLightbox(index);
        });
    });

    closeButton.addEventListener("click", closeLightbox);
    prevButton.addEventListener("click", showPrevious);
    nextButton.addEventListener("click", showNext);

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

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
