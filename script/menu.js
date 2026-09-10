document.addEventListener("headerLoaded", () => {
    const menuBtn = document.querySelector(".menu-btn");
    const nav = document.querySelector(".nav");

    if (!menuBtn || !nav) {
        return;
    }

    menuBtn.addEventListener("click", () => {
        nav.classList.toggle("active");

        const isOpen = nav.classList.contains("active");

        menuBtn.setAttribute(
            "aria-expanded",
            isOpen
        );
    });

    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            nav.classList.remove("active");
            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );
        });
    });
});