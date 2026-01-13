/**
 * ضغط الصور باستخدام Canvas لتقليل الحجم قبل الرفع
 */
export async function compressImage(file: File, maxWidth = 1024, quality = 0.7): Promise<File> {
    return new Promise((resolve, reject) => {
        // إذا كان الملف صغيراً بالفعل (أقل من 500KB)، لا تضغطه
        if (file.size < 500 * 1024) {
            resolve(file);
            return;
        }

        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = () => {
            URL.revokeObjectURL(image.src);
            const canvas = document.createElement('canvas');
            let width = image.width;
            let height = image.height;

            // حساب الأبعاد الجديدة
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob failed'));
                        return;
                    }
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    console.log(`✅ Compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
                    resolve(compressedFile);
                },
                'image/jpeg',
                quality
            );
        };

        image.onerror = (error) => reject(error);
    });
}
