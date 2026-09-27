// SMS notifications stub. Wire up Twilio (or any provider) here using
// TWILIO_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM from .env. Without credentials
// this safely logs to console instead of throwing, so the demo still works.
const hasTwilioCreds = process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM;

let client = null;
if (hasTwilioCreds) {
    try {
        // Lazy require so the app doesn't crash if 'twilio' package isn't installed
        // and credentials aren't configured.
        const twilio = require('twilio');
        client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (e) {
        console.warn('[sms] twilio package not installed. Run `npm install twilio` to enable SMS.');
    }
}

exports.sendSMS = async (to, message) => {
    if (!to) return;
    if (!client) {
        console.log(`[sms] Skipped (no Twilio credentials/package). Would text ${to}: ${message}`);
        return;
    }
    try {
        await client.messages.create({ body: message, from: process.env.TWILIO_FROM, to });
        console.log(`[sms] SMS sent to ${to}`);
    } catch (error) {
        console.error('[sms] Failed to send SMS:', error.message);
    }
};
