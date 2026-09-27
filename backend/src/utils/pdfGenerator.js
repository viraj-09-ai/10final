// Generates a printable visitor PDF badge (photo + QR + details) using pdfkit,
// and saves it under /uploads/badges so it can be downloaded via a static URL.
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const badgeDir = path.join(__dirname, '..', '..', 'uploads', 'badges');
if (!fs.existsSync(badgeDir)) fs.mkdirSync(badgeDir, { recursive: true });

/**
 * @param {Object} pass - Pass mongoose document (with visitor populated)
 * @returns {Promise<string>} absolute file path of the generated PDF
 */
async function generateBadgePDF(pass) {
    const visitor = pass.visitor;
    const filename = `badge-${pass._id}.pdf`;
    const filePath = path.join(badgeDir, filename);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [320, 480], margin: 20 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.rect(0, 0, 320, 70).fill('#1d4ed8');
        doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
            .text('VISITOR PASS', 20, 25, { align: 'left' });
        doc.fillColor('#000000');

        let cursorY = 90;

        // Photo (if available)
        if (visitor.photoUrl) {
            const photoPath = path.join(__dirname, '..', '..', visitor.photoUrl.replace(/^\/+/, ''));
            if (fs.existsSync(photoPath)) {
                try {
                    doc.image(photoPath, 110, cursorY, { width: 100, height: 100, fit: [100, 100] });
                } catch (e) { /* ignore bad image */ }
            }
        }
        cursorY += 115;

        doc.font('Helvetica-Bold').fontSize(16).text(visitor.name || 'Visitor', 20, cursorY, {
            width: 280, align: 'center'
        });
        cursorY += 25;

        doc.font('Helvetica').fontSize(10).fillColor('#444444');
        const infoLines = [
            visitor.company ? `Company: ${visitor.company}` : null,
            visitor.phone ? `Phone: ${visitor.phone}` : null,
            `Purpose: ${pass.purpose}`,
            `Valid Until: ${new Date(pass.validUntil).toLocaleString()}`
        ].filter(Boolean);

        infoLines.forEach((line) => {
            doc.text(line, 20, cursorY, { width: 280, align: 'center' });
            cursorY += 16;
        });

        cursorY += 10;

        // QR code image (base64 data URL -> buffer)
        if (pass.qrCodeUrl) {
            const base64Data = pass.qrCodeUrl.replace(/^data:image\/\w+;base64,/, '');
            const qrBuffer = Buffer.from(base64Data, 'base64');
            doc.image(qrBuffer, 110, cursorY, { width: 100, height: 100 });
            cursorY += 110;
        }

        doc.fontSize(8).fillColor('#888888')
            .text(`Pass ID: ${pass._id}`, 20, cursorY, { width: 280, align: 'center' });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

module.exports = { generateBadgePDF, badgeDir };
