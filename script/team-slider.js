document.addEventListener("DOMContentLoaded", () => {
    const slider = document.querySelector(".team-slider");
    const players = document.querySelectorAll(".team-player");

    if (!slider || players.length === 0) return;

    let currentPlayer = 0;

    const updateTeam = () => {
        players.forEach((player, index) => {
            player.classList.toggle(
                "active",
                index === currentPlayer
            );
        });

        const activePlayer = players[currentPlayer];
        const viewport = slider.parentElement;

        const viewportWidth = viewport.clientWidth;

        const playerCenter =
            activePlayer.offsetLeft +
            activePlayer.offsetWidth / 2;

        const targetPosition =
            viewportWidth / 2 - playerCenter;

        slider.style.transform =
            `translateX(${targetPosition}px)`;
    };

    const nextPlayer = () => {
        currentPlayer =
            (currentPlayer + 1) % players.length;

        updateTeam();
    };

    const AVATAR_PLACEHOLDER = "assets/img/team/placeholder-avatar.svg";

    players.forEach((player, index) => {
        const img = player.querySelector(".team-player-image");
        if (img) {
            img.addEventListener("error", () => {
                img.src = AVATAR_PLACEHOLDER;
            });
        }

        player.addEventListener("click", () => {
            currentPlayer = index;
            updateTeam();
        });
    });

    updateTeam();

    let autoSlideInterval = setInterval(nextPlayer, 3000);

    const viewport = slider.parentElement;
    if (viewport) {
        viewport.addEventListener("mouseenter", () => {
            clearInterval(autoSlideInterval);
        });
        viewport.addEventListener("mouseleave", () => {
            autoSlideInterval = setInterval(nextPlayer, 3000);
        });
    }

    window.addEventListener("resize", updateTeam);
});