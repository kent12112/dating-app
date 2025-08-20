export default function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous"; // avoid CORS issues
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Fixed output size
      const outputWidth = 400;
      const outputHeight = 600;
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = croppedAreaPixels.x * scaleX;
      const cropY = croppedAreaPixels.y * scaleY;
      const cropWidth = croppedAreaPixels.width * scaleX;
      const cropHeight = croppedAreaPixels.height * scaleY;

      // Draw cropped & resized image
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      // Convert canvas to file
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas is empty"));
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg");
    };
    image.onerror = (err) => reject(err);
  });
}
