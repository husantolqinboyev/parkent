// Client-side image compression utility
// Reduces image file size before uploading

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.7,
  maxSizeMB: 0.5,
};

export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<File> => {
  const { maxWidth, maxHeight, quality, maxSizeMB } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Skip if already small enough
  if (file.size <= (maxSizeMB! * 1024 * 1024)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth! || height > maxHeight!) {
        const ratio = Math.min(maxWidth! / width, maxHeight! / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw and compress
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not compress image"));
            return;
          }

          // Create new file with original name
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          console.log(
            `Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`
          );

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Could not load image"));

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
};

export const compressImages = async (
  files: FileList | File[],
  options: CompressOptions = {}
): Promise<File[]> => {
  const fileArray = Array.from(files);
  const compressed: File[] = [];

  for (const file of fileArray) {
    if (file.type.startsWith("image/")) {
      try {
        const compressedFile = await compressImage(file, options);
        compressed.push(compressedFile);
      } catch (error) {
        console.error("Compression failed for", file.name, error);
        compressed.push(file); // Use original if compression fails
      }
    }
  }

  return compressed;
};
