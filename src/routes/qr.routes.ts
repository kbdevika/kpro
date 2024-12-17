import express from 'express'; 

const qrRouter = express.Router();

/**
 * Redirect to different URLs based on the device (Android, iOS, or Web).
 */
qrRouter.get('/qrcode', (req: any, res: any) => {
    const userAgent = req.headers['user-agent'];

    // Check if the device is Android
    if (/android/i.test(userAgent)) {
        // Redirect to the Android link
        return res.redirect(301, 'https://google.com');
    }

    // Check if the device is iOS
    if (/iphone|ipod|ipad/i.test(userAgent)) {
        // Redirect to the iOS link
        return res.redirect(301, 'https://google.com');
    }

    // If it's neither Android nor iOS, assume it's a Web device
    return res.redirect(301, 'https://google.com');
});

export default qrRouter;