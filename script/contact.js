document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#contact-form");
    const submitBtn = document.querySelector("#contact-submit");
    const statusEl = document.querySelector("#contact-form-status");
    const charCount = document.querySelector("#contact-char-count");

    if (!form) {
        return;
    }

    const fields = {
        name: document.querySelector("#contact-name"),
        email: document.querySelector("#contact-email"),
        subject: document.querySelector("#contact-subject"),
        message: document.querySelector("#contact-message"),
    };

    // ═══════════════════════════════════════
    // Validation
    // ═══════════════════════════════════════

    const validators = {
        name: (value) => {
            if (value.trim().length < 2) {
                return "Entre au moins 2 caractères.";
            }
            return "";
        },

        email: (value) => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                return "Entre une adresse email valide.";
            }
            return "";
        },

        subject: (value) => {
            if (!value) {
                return "Choisis un sujet.";
            }
            return "";
        },

        message: (value) => {
            if (value.trim().length < 10) {
                return "Ton message doit faire au moins 10 caractères.";
            }
            return "";
        },
    };

    const showFieldError = (field, errorMessage) => {
        field.classList.add("invalid");

        const errorEl = document.querySelector(
            `[data-error-for="${field.id}"]`
        );

        if (errorEl) {
            errorEl.textContent = errorMessage;
        }
    };

    const clearFieldError = (field) => {
        field.classList.remove("invalid");

        const errorEl = document.querySelector(
            `[data-error-for="${field.id}"]`
        );

        if (errorEl) {
            errorEl.textContent = "";
        }
    };

    const validateField = (field) => {
        const validate = validators[field.name];

        if (!validate) {
            return true;
        }

        const errorMessage = validate(field.value);

        if (errorMessage) {
            showFieldError(field, errorMessage);
            return false;
        }

        clearFieldError(field);
        return true;
    };

    // Validation en direct : on efface l'erreur dès que le champ devient valide
    Object.values(fields).forEach((field) => {
        if (!field) {
            return;
        }

        field.addEventListener("input", () => {
            if (field.classList.contains("invalid")) {
                validateField(field);
            }
        });

        field.addEventListener("change", () => {
            if (field.classList.contains("invalid")) {
                validateField(field);
            }
        });

        field.addEventListener("blur", () => {
            if (field.value !== "") {
                validateField(field);
            }
        });
    });

    // ═══════════════════════════════════════
    // Compteur de caractères
    // ═══════════════════════════════════════

    const updateCharCount = () => {
        if (!charCount || !fields.message) {
            return;
        }

        const maxLength = fields.message.getAttribute("maxlength");

        charCount.textContent = `${fields.message.value.length} / ${maxLength}`;
    };

    if (fields.message) {
        fields.message.addEventListener("input", updateCharCount);
        updateCharCount();
    }

    // ═══════════════════════════════════════
    // Message de statut
    // ═══════════════════════════════════════

    const setStatus = (type, text) => {
        if (!statusEl) {
            return;
        }

        statusEl.className = `contact-form-status ${type}`;
        statusEl.textContent = text;
    };

    const clearStatus = () => {
        if (!statusEl) {
            return;
        }

        statusEl.className = "contact-form-status";
        statusEl.textContent = "";
    };

    // ═══════════════════════════════════════
    // Envoi du formulaire
    // ═══════════════════════════════════════

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        clearStatus();

        // On valide tous les champs d'un coup
        const invalidFields = Object.values(fields).filter(
            (field) => field && !validateField(field)
        );

        if (invalidFields.length > 0) {
            invalidFields[0].focus();
            setStatus("error", "Corrige les champs en rouge avant d'envoyer.");
            return;
        }

        // ═══════════════════════════════════════
        // Envoi vers Netlify Forms
        // ═══════════════════════════════════════

        const formData = new FormData(form);
        if (!formData.has("form-name")) {
            formData.append("form-name", form.getAttribute("name") || "contact");
        }
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";

        fetch("/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(formData).toString(),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP : ${response.status}`);
                }

                setStatus(
                    "success",
                    "Message envoyé ! On te répondra sous 48h. GG !"
                );

                form.reset();
                updateCharCount();

                setTimeout(clearStatus, 8000);
            })
            .catch((error) => {
                console.error(
                    "Erreur lors de l'envoi du message :",
                    error
                );

                setStatus(
                    "error",
                    "Oups, l'envoi a échoué. Réessaie ou contacte-nous sur Discord."
                );
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
    });
});
