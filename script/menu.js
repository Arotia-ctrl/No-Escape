document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.querySelector(".menu-btn");
    const nav = document.querySelector(".nav");

    if (menuBtn && nav) {

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
                menuBtn.setAttribute("aria-expanded", "false");
            });
        });
    }



    const slider = document.querySelector(".team-slider");
    const players = document.querySelectorAll(".team-player");

    if (!slider || players.length === 0) {
        return;
    }

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
            (activePlayer.offsetWidth / 2);

        const targetPosition =
            (viewportWidth / 2) - playerCenter;

        slider.style.transform =
            `translateX(${targetPosition}px)`;
    };


    const nextPlayer = () => {

        currentPlayer++;

        if (currentPlayer >= players.length) {
            currentPlayer = 0;
        }

        updateTeam();
    };



    updateTeam();



    const carouselInterval = setInterval(
        nextPlayer,
        3000
    );


    window.addEventListener("resize", () => {
        updateTeam();
    });

});