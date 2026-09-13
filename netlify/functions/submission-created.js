// ═══════════════════════════════════════════════════════════
// Fonction Netlify déclenchée à chaque soumission du formulaire
// de contact (événement "submission-created").
//
// - Envoie un accusé de réception automatique au visiteur
// - Envoie une notification à la team avec le message complet
//
// Variables d'environnement requises (Netlify > Site configuration
// > Environment variables) :
//   RESEND_API_KEY  -> clé API Resend (https://resend.com/api-keys)
//   NOTIFY_EMAIL    -> adresse où recevoir les messages des visiteurs
//   RESEND_FROM     -> (optionnel) expéditeur, ex: "No Escape <noreply@ton-domaine.gg>"
// ═══════════════════════════════════════════════════════════

const RESEND_API_URL = "https://api.resend.com/emails";

const DEFAULT_FROM = "No Escape <onboarding@resend.dev>";

const SUBJECT_LABELS = {
    tournament: "Inscription tournoi",
    scrim: "Demande de scrim",
    recruitment: "Recrutement",
    partnership: "Partenariat",
    other: "Autre",
};

// On échappe le contenu du visiteur avant de l'injecter dans le HTML
const escapeHtml = (value) => {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const sendEmail = async ({ to, from, subject, html, replyTo }) => {
    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            html,
            ...(replyTo ? { reply_to: replyTo } : {}),
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Resend a répondu ${response.status} : ${errorText}`
        );
    }

    return response.json();
};

// ── Email de confirmation envoyé au visiteur ──

const buildVisitorEmail = (name, subjectLabel) => {
    return `
        <div style="background:#0a0e27;padding:32px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;color:#f0f8ff;">
            <h1 style="margin:0 0 8px;color:#fb3640;font-size:22px;letter-spacing:2px;">NO ESCAPE</h1>
            <p style="margin:0 0 16px;font-size:14px;opacity:0.8;">Accusé de réception automatique</p>

            <p style="font-size:15px;line-height:1.6;">Yo <strong>${escapeHtml(name)}</strong> !</p>

            <p style="font-size:15px;line-height:1.6;">
                On a bien reçu ton message (<strong>${escapeHtml(subjectLabel)}</strong>) et
                on te répondra sous 48h.
            </p>

            <p style="font-size:15px;line-height:1.6;">En attendant, gg et à bientôt sur le terrain !</p>

            <p style="margin-top:24px;font-size:13px;opacity:0.6;">
                — La team No Escape<br/>
                Tu peux nous répondre directement à cet email.
            </p>
        </div>
    `;
};

// ── Email de notification envoyé à la team ──

const buildOwnerEmail = (name, email, subjectLabel, message) => {
    return `
        <div style="background:#0a0e27;padding:32px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;color:#f0f8ff;">
            <h1 style="margin:0 0 16px;color:#fb3640;font-size:20px;letter-spacing:2px;">
                NOUVEAU MESSAGE DE CONTACT
            </h1>

            <p style="font-size:14px;line-height:1.8;margin:0;">
                <strong>Nom :</strong> ${escapeHtml(name)}<br/>
                <strong>Email :</strong> ${escapeHtml(email)}<br/>
                <strong>Sujet :</strong> ${escapeHtml(subjectLabel)}
            </p>

            <p style="font-size:14px;line-height:1.7;margin:16px 0 0;">
                <strong>Message :</strong><br/>
                ${escapeHtml(message).replaceAll("\n", "<br/>")}
            </p>
        </div>
    `;
};

exports.handler = async (event) => {
    const apiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFY_EMAIL;

    if (!apiKey || !notifyEmail) {
        console.error(
            "Variables manquantes : RESEND_API_KEY et/ou NOTIFY_EMAIL ne sont pas définies."
        );
        return { statusCode: 200, body: "Configuration incomplète." };
    }

    let payload;

    try {
        payload = JSON.parse(event.body || "{}").payload;
    } catch (error) {
        console.error("Payload illisible :", error);
        return { statusCode: 200, body: "Payload illisible." };
    }

    if (!payload) {
        return { statusCode: 200, body: "Pas de payload." };
    }

    const data = payload.data || {};

    // Anti-spam : on ignore les soumissions qui remplissent le honeypot
    if (data["bot-field"]) {
        console.log("Soumission ignorée (bot détecté).");
        return { statusCode: 200, body: "Bot ignoré." };
    }

    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const subject = SUBJECT_LABELS[data.subject] || "Autre";
    const message = (data.message || "").trim();
    const from = process.env.RESEND_FROM || DEFAULT_FROM;

    try {
        // 1. Accusé de réception pour le visiteur
        await sendEmail({
            to: email,
            from,
            subject: "On a bien reçu ton message — No Escape",
            html: buildVisitorEmail(name, subject),
            replyTo: notifyEmail,
        });

        console.log(`Accusé de réception envoyé à ${email}.`);

        // 2. Notification pour la team avec le message complet
        await sendEmail({
            to: notifyEmail,
            from,
            subject: `Nouveau message de contact — ${name}`,
            html: buildOwnerEmail(name, email, subject, message),
            replyTo: email,
        });

        console.log(`Notification envoyée à ${notifyEmail}.`);
    } catch (error) {
        console.error("Erreur pendant l'envoi des emails :", error);
    }

    return { statusCode: 200, body: "Terminé." };
};
