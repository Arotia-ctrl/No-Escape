document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector("#header");

    if (!header) {
        return;
    }

    fetch("partials/header.html")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }

            return response.text();
        })
        .then(data => {
            header.innerHTML = data;

            const updateHeaderSpacing = () => {
                const headerEl = header.querySelector(".header");
                if (headerEl) {
                    const h = headerEl.offsetHeight;
                    header.style.height = `${h}px`;
                    document.documentElement.style.setProperty("--header-height", `${h}px`);
                }
            };

            updateHeaderSpacing();
            window.addEventListener("resize", updateHeaderSpacing);

            const logo = header.querySelector(".logo");
            if (logo && !logo.complete) {
                logo.addEventListener("load", updateHeaderSpacing);
            }

            document.dispatchEvent(
                new Event("headerLoaded")
            );
        })
        .catch(error => {
            console.error(
                "Erreur lors du chargement du header :",
                error
            );
        });
});