function initMenu() {
    const menuBtn = document.querySelector(".menu-btn");
    const nav = document.querySelector(".nav");

    if (!menuBtn || !nav) {
        return;
    }

    const closeMenu = () => {
        nav.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
    };

    menuBtn.addEventListener("click", () => {
        nav.classList.toggle("active");
        const isOpen = nav.classList.contains("active");
        menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        if (nav.classList.contains("active") && !nav.contains(event.target) && !menuBtn.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("active")) {
            closeMenu();
            menuBtn.focus();
        }
    });
}

document.addEventListener("headerLoaded", initMenu);