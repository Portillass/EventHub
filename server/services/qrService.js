const QRCode = require('qrcode');

const generateQRCode = async (eventId) => {
  try {
    // Generate the URL for the landing page with the event ID
    const url = `http://localhost:3000?eventId=${eventId}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      width: 300
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  generateQRCode
}; 