/**
 * Adds a logo to a base image using a canvas.
 * @param baseImageSrc The source of the base image (data URL or regular URL).
 * @param logoImageSrc The source of the logo image (data URL).
 * @param logoScale The scale of the logo relative to the base image width (e.g., 0.1 for 10%).
 * @param logoPosition The position of the logo ('bottom-right', 'bottom-left', 'top-right', 'top-left').
 * @param padding The padding of the logo from the edges, relative to the base image width.
 * @returns A promise that resolves to the data URL of the new image with the logo.
 */
export function addLogoToImage(
    baseImageSrc: string,
    logoImageSrc: string,
    logoScale: number = 0.15,
    logoPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right',
    padding: number = 0.02
): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Could not get canvas context.'));
        }

        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous'; // Important for external images
        baseImage.onload = () => {
            canvas.width = baseImage.naturalWidth;
            canvas.height = baseImage.naturalHeight;

            // Draw the base image
            ctx.drawImage(baseImage, 0, 0);

            const logoImage = new Image();
            logoImage.onload = () => {
                // Calculate logo dimensions
                const logoWidth = canvas.width * logoScale;
                const logoAspectRatio = logoImage.naturalHeight / logoImage.naturalWidth;
                const logoHeight = logoWidth * logoAspectRatio;
                const paddingPixels = canvas.width * padding;

                // Calculate logo position
                let x, y;
                switch (logoPosition) {
                    case 'bottom-right':
                        x = canvas.width - logoWidth - paddingPixels;
                        y = canvas.height - logoHeight - paddingPixels;
                        break;
                    case 'bottom-left':
                        x = paddingPixels;
                        y = canvas.height - logoHeight - paddingPixels;
                        break;
                    case 'top-right':
                        x = canvas.width - logoWidth - paddingPixels;
                        y = paddingPixels;
                        break;
                    case 'top-left':
                        x = paddingPixels;
                        y = paddingPixels;
                        break;
                }

                // Draw the logo
                ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);

                // Export the canvas to a data URL
                resolve(canvas.toDataURL('image/png'));
            };
            logoImage.onerror = (err) => reject(new Error(`Failed to load logo image: ${err}`));
            logoImage.src = logoImageSrc;
        };
        baseImage.onerror = (err) => reject(new Error(`Failed to load base image: ${err}`));
        baseImage.src = baseImageSrc;
    });
}

/**
 * Adds a text watermark to a base image using a canvas.
 * @param baseImageSrc The source of the base image (data URL or regular URL).
 * @param watermarkText The text to use as a watermark.
 * @param position The position of the watermark.
 * @param padding The padding of the watermark from the edges, relative to the base image width.
 * @returns A promise that resolves to the data URL of the new image with the watermark.
 */
export function addWatermark(
    baseImageSrc: string,
    watermarkText: string,
    position: 'bottom-left' | 'bottom-right' = 'bottom-left',
    padding: number = 0.02
): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Could not get canvas context.'));
        }

        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';
        baseImage.onload = () => {
            canvas.width = baseImage.naturalWidth;
            canvas.height = baseImage.naturalHeight;
            ctx.drawImage(baseImage, 0, 0);

            // Clean up URL for display
            const cleanUrl = watermarkText.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
            
            // Text style
            const fontSize = Math.max(14, canvas.width * 0.015);
            ctx.font = `600 ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = position === 'bottom-left' ? 'left' : 'right';
            ctx.textBaseline = 'bottom';
            
            // Text shadow for readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            // Text position
            const paddingPixels = canvas.width * padding;
            const x = position === 'bottom-left' ? paddingPixels : canvas.width - paddingPixels;
            const y = canvas.height - paddingPixels;

            ctx.fillText(cleanUrl, x, y);
            
            resolve(canvas.toDataURL('image/png'));
        };
        baseImage.onerror = (err) => reject(new Error(`Failed to load base image for watermark: ${err}`));
        baseImage.src = baseImageSrc;
    });
}
