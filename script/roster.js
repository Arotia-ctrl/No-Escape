document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".roster-card");
    const modal = document.querySelector("#roster-modal");
    const closeBtn = document.querySelector("#roster-modal-close");

    const modalImage = document.querySelector("#modal-image");
    const modalName = document.querySelector("#modal-name");
    const modalRole = document.querySelector("#modal-role");
    const modalRealname = document.querySelector("#modal-realname");
    const modalBio = document.querySelector("#modal-bio");
    const modalStats = document.querySelector("#modal-stats");
    const modalSocials = document.querySelector("#modal-socials");

    if (
        !cards.length ||
        !modal ||
        !closeBtn ||
        !modalImage ||
        !modalName ||
        !modalRole ||
        !modalRealname ||
        !modalBio ||
        !modalStats ||
        !modalSocials
    ) {
        return;
    }

    // Icônes simples pour les réseaux
    const socialIcons = {
        discord: "💬",
        twitter: "🐦",
        instagram: "📸",
        tiktok: "🎵"
    };

    const socialLabels = {
        discord: "Discord",
        twitter: "Twitter",
        instagram: "Instagram",
        tiktok: "TikTok"
    };

    function openModal(card) {
        const data = card.dataset;

        // Image
        modalImage.src = data.image || "";
        modalImage.alt = `Photo de ${data.name}`;

        // Infos principales
        modalName.textContent = data.name || "";
        modalRole.textContent = data.role || "";
        modalRealname.textContent = data.realname || "";

        // Bio
        modalBio.textContent = data.bio || "";

        // Stats
        modalStats.innerHTML = "";

        const stats = [
            { value: data.kills, label: "Kills" },
            { value: data.kd, label: "K/D" },
            { value: data.wwcd, label: "WWCD" }
        ];

        stats.forEach(stat => {
            if (!stat.value) return;

            const statEl = document.createElement("div");
            statEl.className = "roster-modal-stat";
            statEl.innerHTML = `
                <span class="stat-value">${stat.value}</span>
                <span class="stat-label">${stat.label}</span>
            `;
            modalStats.appendChild(statEl);
        });

        // Réseaux sociaux
        modalSocials.innerHTML = "";

        const socialKeys = ["discord", "twitter", "instagram", "tiktok"];
        let hasSocials = false;

        socialKeys.forEach(key => {
            const value = data[key];
            if (!value) return;

            hasSocials = true;

            const link = document.createElement("span");
            link.className = "roster-social-link";
            link.innerHTML = `
                <span class="roster-social-icon">${socialIcons[key]}</span>
                ${socialLabels[key]} : @${value}
            `;
            modalSocials.appendChild(link);
        });

        if (!hasSocials) {
            const empty = document.createElement("p");
            empty.className = "roster-no-social";
            empty.textContent = "Aucun réseau renseigné pour le moment.";
            modalSocials.appendChild(empty);
        }

        // Ouvrir
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeBtn.focus();
    }

    function closeModal() {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    // Events cartes
    cards.forEach(card => {
        card.addEventListener("click", () => {
            openModal(card);
        });

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openModal(card);
            }
        });
    });

    // Fermeture
    closeBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) {
            closeModal();
        }
    });
});
