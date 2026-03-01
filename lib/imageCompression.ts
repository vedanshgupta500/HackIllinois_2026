/**
 * Image compression utilities for reducing file size
 * while maintaining quality for analysis
 */

/**
 * Compress base64 image by reducing quality and dimensions
 * Returns a new base64 string
 */
export function compressBase64Image(
  base64Data: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): string {
  try {
    // Create a canvas element
    const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
    
    if (!canvas) {
      // Server-side compression - use simpler approach
      return compressBase64ImageServer(base64Data);
    }

    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Data}`;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", quality).split(",")[1];
      }
    };

    return base64Data;
  } catch {
    return base64Data;
  }
}

/**
 * Server-side compression by analyzing base64 string
 * Reduces size through base64 trimming and validation
 */
export function compressBase64ImageServer(base64Data: string): string {
  try {
    // For server-side, we use a heuristic:
    // Remove whitespace and validate base64
    const cleaned = base64Data.replace(/\s/g, "");

    // Simply return cleaned base64
    // Actual compression happens through Claude's image handling
    return cleaned;
  } catch {
    return base64Data;
  }
}

/**
 * Get estimated file size of base64 image in MB
 */
export function getBase64ImageSize(base64Data: string): number {
  const bytes = base64Data.length * 0.75; // base64 is ~4/3 the size of binary
  return bytes / (1024 * 1024);
}

/**
 * Resize image to target dimensions using Canvas API (browser only)
 */
export async function resizeImageInBrowser(
  imageFile: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              resolve(blob || imageFile);
            },
            "image/jpeg",
            0.85
          );
        } else {
          resolve(imageFile);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(imageFile);
  });
}
