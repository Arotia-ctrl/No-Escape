/**
 * ==========================================================================
 * NO ESCAPE - SYSTÈME DE CHARGEMENT & PRÉCHARGEMENT DES MÉDIAS
 * ==========================================================================
 */

(function () {
    "use strict";

    const ASSETS_TO_PRELOAD = [
        // Visuels & Logos
        { type: "image", url: "assets/logos/logo.png", desc: "Logo No Escape" },
        { type: "image", url: "assets/img/team/ares_profile.webp", desc: "Profil ARES" },
        { type: "image", url: "assets/img/team/thor_profile.webp", desc: "Profil THOR" },
        { type: "image", url: "assets/img/team/placeholder-avatar.svg", desc: "Avatars" },
        { type: "image", url: "assets/img/galerie/img1.webp", desc: "Galerie photo 1" },
        { type: "image", url: "assets/img/galerie/img2.webp", desc: "Galerie photo 2" },
        { type: "image", url: "assets/img/galerie/img3.webp", desc: "Galerie photo 3" },
        { type: "image", url: "assets/img/placeholder.svg", desc: "Composants visuels" },

        // Vidéos highlights du site
        { type: "video", url: "assets/video/no_escape.mp4", desc: "Highlights vidéo" },
        { type: "video", url: "assets/video/no_escape1.mp4", desc: "Highlights vidéo (alt)" }
    ];

    const MIN_ANIMATION_DURATION = 1400; // ms (rythme élégant même avec cache)
    const AUTO_ENTER_DELAY_SEC = 2; // Délai avant entrée automatique à 100%

    // DOM Elements
    let loaderEl,
        progressBarEl,
        percentageEl,
        statusTextEl,
        itemsCountEl,
        actionAreaEl,
        enterBtnEl,
        timerEl,
        pulseDotEl,
        skipBtnEl;

    let hasEntered = false;
    let autoEnterInterval = null;
    let animationFrameId = null;

    // Progression
    let totalTasks = ASSETS_TO_PRELOAD.length + 2; // + Header + Highlight Video DOM
    let completedTasks = 0;
    let displayProgress = 0;
    let targetProgress = 0;
    const startTime = performance.now();

    /**
     * Initialisation principale
     */
    function init() {
        loaderEl = document.getElementById("site-loader");
        if (!loaderEl) return;

        progressBarEl = document.getElementById("loader-progress-bar");
        percentageEl = document.getElementById("loader-percentage");
        statusTextEl = document.getElementById("loader-status-text");
        itemsCountEl = document.getElementById("loader-items-count");
        actionAreaEl = document.getElementById("loader-action-area");
        enterBtnEl = document.getElementById("loader-enter-btn");
        timerEl = document.getElementById("loader-timer");
        pulseDotEl = document.querySelector(".loader-pulse-dot");
        skipBtnEl = document.getElementById("loader-skip-btn");

        // Vérification de session : si déjà entré et simple navigation interne (sans reload)
        const navEntry = window.performance && performance.getEntriesByType
            ? performance.getEntriesByType("navigation")[0]
            : null;
        const isReload = navEntry ? navEntry.type === "reload" : false;
        const urlParams = new URLSearchParams(window.location.search);
        const forceIntro = urlParams.has("intro") || urlParams.has("loader");
        let alreadyEntered = false;
        try {
            alreadyEntered = sessionStorage.getItem("noescape_entered") === "true";
        } catch (e) {
            alreadyEntered = false;
        }

        if (alreadyEntered && !isReload && !forceIntro) {
            instantEntry();
            return;
        }

        // Configuration des événements utilisateur
        setupEvents();

        // Lancement du préchargement en parallèle
        startPreloading();

        // Lancement de la boucle d'animation fluide
        runProgressLoop();
    }

    /**
     * Configuration des écouteurs de clics et raccourcis
     */
    function setupEvents() {
        if (enterBtnEl) {
            enterBtnEl.addEventListener("click", () => enterSite());
        }

        if (skipBtnEl) {
            skipBtnEl.addEventListener("click", () => enterSite());
        }

        // Support clavier : Entrée ou Espace pour entrer, Échap pour passer
        window.addEventListener("keydown", (e) => {
            if (hasEntered) return;

            if (e.key === "Escape") {
                enterSite();
            } else if ((e.key === "Enter" || e.key === " ") && displayProgress >= 100) {
                e.preventDefault();
                enterSite();
            }
        });
    }

    /**
     * Préchargement d'une image avec promesse
     */
    function preloadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;

            if (img.complete) {
                resolve(true);
            }
        });
    }

    /**
     * Préchargement d'une vidéo (mise en mémoire tampon initiale)
     */
    function preloadVideo(url) {
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "auto";
            video.muted = true;
            video.playsInline = true;

            let finished = false;
            const done = (success) => {
                if (!finished) {
                    finished = true;
                    video.oncanplay = null;
                    video.oncanplaythrough = null;
                    video.onloadeddata = null;
                    video.onerror = null;
                    resolve(success);
                }
            };

            if (video.readyState >= 2) {
                done(true);
                return;
            }

            video.oncanplay = () => done(true);
            video.oncanplaythrough = () => done(true);
            video.onloadeddata = () => done(true);
            video.onerror = () => done(false);

            // Timeout de sécurité pour ne pas bloquer les réseaux lents
            setTimeout(() => done(true), 5000);

            video.src = url;
            video.load();
        });
    }

    /**
     * Préchargement de la vidéo directement présente dans la page
     */
    function preloadDOMVideo() {
        return new Promise((resolve) => {
            const videoEl = document.querySelector(".highlight-video");
            if (!videoEl) {
                resolve(true);
                return;
            }

            videoEl.preload = "auto";

            if (videoEl.readyState >= 2) {
                resolve(true);
                return;
            }

            let finished = false;
            const done = () => {
                if (!finished) {
                    finished = true;
                    resolve(true);
                }
            };

            videoEl.addEventListener("canplay", done, { once: true });
            videoEl.addEventListener("canplaythrough", done, { once: true });
            videoEl.addEventListener("loadeddata", done, { once: true });
            videoEl.addEventListener("error", done, { once: true });

            setTimeout(done, 5000);
        });
    }

    /**
     * Attente du composant header (injecté par component.js)
     */
    function waitForHeader() {
        return new Promise((resolve) => {
            if (document.querySelector("#header .header")) {
                resolve(true);
                return;
            }

            const onHeaderLoaded = () => {
                resolve(true);
            };

            document.addEventListener("headerLoaded", onHeaderLoaded, { once: true });
            setTimeout(() => resolve(true), 3000);
        });
    }

    /**
     * Déclenche le chargement de toutes les ressources
     */
    function startPreloading() {
        // Préchargement de la liste d'assets
        ASSETS_TO_PRELOAD.forEach((item) => {
            const promise = item.type === "video"
                ? preloadVideo(item.url)
                : preloadImage(item.url);

            promise.then(() => {
                completedTasks++;
                onTaskProgress(item.desc);
            });
        });

        // Vidéo principale DOM
        preloadDOMVideo().then(() => {
            completedTasks++;
            onTaskProgress("Vidéo d'accueil");
        });

        // Composant header
        waitForHeader().then(() => {
            completedTasks++;
            onTaskProgress("Interface de navigation");
        });
    }

    /**
     * Mise à jour textuelle lors de la fin d'une tâche
     */
    function onTaskProgress(lastItemDesc) {
        if (displayProgress >= 100) return;

        if (itemsCountEl) {
            itemsCountEl.textContent = `${completedTasks} / ${totalTasks} médias`;
        }

        if (statusTextEl && lastItemDesc) {
            if (displayProgress < 30) {
                statusTextEl.textContent = "Initialisation des systèmes...";
            } else if (displayProgress < 65) {
                statusTextEl.textContent = `Chargement des visuels : ${lastItemDesc}`;
            } else if (displayProgress < 90) {
                statusTextEl.textContent = `Mise en cache : ${lastItemDesc}`;
            } else {
                statusTextEl.textContent = "Optimisation de l'affichage...";
            }
        }
    }

    /**
     * Boucle d'interpolation fluide pour la barre de progression (requestAnimationFrame)
     */
    function runProgressLoop() {
        function tick(now) {
            if (hasEntered) return;

            const elapsed = now - startTime;
            const timeProgress = Math.min(100, (elapsed / MIN_ANIMATION_DURATION) * 100);
            const actualTaskProgress = (completedTasks / totalTasks) * 100;

            // La cible est le minimum entre le temps de pacing et les tâches réelles terminées
            targetProgress = Math.min(timeProgress, actualTaskProgress);

            // Si toutes les tâches sont achevées et le temps minimal écoulé, atteindre 100%
            if (completedTasks >= totalTasks && elapsed >= MIN_ANIMATION_DURATION) {
                targetProgress = 100;
            }

            // Progression douce
            const diff = targetProgress - displayProgress;
            if (diff > 0) {
                displayProgress += Math.max(0.35, diff * 0.12);
                if (displayProgress > 100) displayProgress = 100;
            }

            updateUI(Math.round(displayProgress));

            if (displayProgress >= 100) {
                onLoadingFinished();
                return;
            }

            animationFrameId = requestAnimationFrame(tick);
        }

        animationFrameId = requestAnimationFrame(tick);
    }

    /**
     * Met à jour la jauge et les textes dans le DOM
     */
    function updateUI(percent) {
        if (progressBarEl) {
            progressBarEl.style.width = `${percent}%`;
        }
        if (percentageEl) {
            percentageEl.textContent = `${percent}%`;
        }
    }

    /**
     * Déclenché quand la barre atteint 100%
     */
    function onLoadingFinished() {
        if (pulseDotEl) {
            pulseDotEl.classList.add("is-ready");
        }

        if (statusTextEl) {
            statusTextEl.textContent = "Tous les médias sont chargés et prêts !";
            statusTextEl.style.color = "#00ff88";
        }

        if (itemsCountEl) {
            itemsCountEl.textContent = `${totalTasks} / ${totalTasks} médias prêts`;
        }

        if (actionAreaEl) {
            actionAreaEl.classList.add("is-visible");
        }

        // Compte à rebours avant entrée automatique
        let remainingSeconds = AUTO_ENTER_DELAY_SEC;
        if (timerEl) timerEl.textContent = remainingSeconds;

        autoEnterInterval = setInterval(() => {
            remainingSeconds--;
            if (timerEl) timerEl.textContent = remainingSeconds;

            if (remainingSeconds <= 0) {
                clearInterval(autoEnterInterval);
                enterSite();
            }
        }, 1000);
    }

    /**
     * Entrée dans le site (transition de sortie cinématique)
     */
    function enterSite() {
        if (hasEntered) return;
        hasEntered = true;

        if (autoEnterInterval) clearInterval(autoEnterInterval);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        // Mémoriser la visite dans la session
        try {
            sessionStorage.setItem("noescape_entered", "true");
        } catch (e) {
            // Support navigation privée
        }

        // Lancer la lecture de la vidéo d'accueil avec fluidité
        const highlightVideo = document.querySelector(".highlight-video");
        if (highlightVideo) {
            highlightVideo.play().catch(() => {
                // Lecture bloquée par politique navigateur si non muted
            });
        }

        // Activer la transition de sortie du preloader
        if (loaderEl) {
            loaderEl.classList.add("is-exiting");
        }

        // Déverrouiller le défilement et afficher le contenu
        document.body.classList.remove("is-loading");

        // Masquer complètement du DOM après la fin de la transition CSS
        setTimeout(() => {
            if (loaderEl) {
                loaderEl.style.display = "none";
                loaderEl.setAttribute("aria-hidden", "true");
            }
        }, 750);
    }

    /**
     * Accès direct (si déjà entré et simple navigation interne)
     */
    function instantEntry() {
        hasEntered = true;
        document.body.classList.remove("is-loading");
        if (loaderEl) {
            loaderEl.style.display = "none";
            loaderEl.setAttribute("aria-hidden", "true");
        }

        const highlightVideo = document.querySelector(".highlight-video");
        if (highlightVideo) {
            highlightVideo.play().catch(() => {});
        }
    }

    // Lancer dès que le DOM est prêt
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
