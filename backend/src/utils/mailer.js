// Email notifications. Uses Gmail SMTP via nodemailer by default; if
// EMAIL_USER / EMAIL_PASS are not set in .env, emails are skipped safely
// (logged to console) so the rest of the app keeps working in dev/demo mode.
const nodemailer = require('nodemailer');

const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

const transporter = hasCredentials
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
    : null;

const sendMail = async ({ to, subject, text, html }) => {
    if (!to) return;
    if (!transporter) {
        console.log(`[mailer] Skipped (no EMAIL_USER/EMAIL_PASS set). Would send to ${to}: ${subject}`);
        return;
    }
    try {
        await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text, html });
        console.log(`[mailer] Email sent to ${to}`);
    } catch (error) {
        console.error('[mailer] Failed to send email:', error.message);
    }
};

exports.sendMail = sendMail;

exports.sendPassNotification = async (email, passDetails) => {
    await sendMail({
        to: email,
        subject: 'Your Visitor Pass',
        text: `Your visitor pass has been generated. ${passDetails}`
    });
};

exports.sendAppointmentInvite = async (email, { visitorName, hostName, date, purpose }) => {
    await sendMail({
        to: email,
        subject: 'You have been invited to visit',
        text: `Hi ${visitorName}, ${hostName} has invited you to visit on ${new Date(date).toLocaleString()} for: ${purpose}. Please check your visitor dashboard for details.`
    });
};

exports.sendApprovalNotification = async (email, { visitorName, status, date }) => {
    await sendMail({
        to: email,
        subject: `Your visit request has been ${status}`,
        text: `Hi ${visitorName}, your appointment request for ${new Date(date).toLocaleString()} has been ${status}.`
    });
};
