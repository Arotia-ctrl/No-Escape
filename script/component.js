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