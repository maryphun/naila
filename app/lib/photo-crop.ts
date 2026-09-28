import { MAX_MEDIA_BYTES, MENU_PHOTO_ASPECT, MENU_PHOTO_MAX_WIDTH } from './media';

export type CropPosition = { centerX: number; centerY: number; zoom: number };
export type CropRect = { x: number; y: number; width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function cropRect(imageWidth: number, imageHeight: number, position: CropPosition): CropRect {
  const baseWidth = Math.min(imageWidth, imageHeight * MENU_PHOTO_ASPECT);
  const width = baseWidth / clamp(position.zoom, 1, 3);
  const height = width / MENU_PHOTO_ASPECT;
  const centerX = clamp(position.centerX, width / 2, imageWidth - width / 2);
  const centerY = clamp(position.centerY, height / 2, imageHeight - height / 2);
  return { x: centerX - width / 2, y: centerY - height / 2, width, height };
}

export function moveCrop(imageWidth: number, imageHeight: number, position: CropPosition, deltaX: number, deltaY: number): CropPosition {
  const rect = cropRect(imageWidth, imageHeight, position);
  return {
    ...position,
    centerX: clamp(position.centerX + deltaX, rect.width / 2, imageWidth - rect.width / 2),
    centerY: clamp(position.centerY + deltaY, rect.height / 2, imageHeight - rect.height / 2),
  };
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image encoding failed.')), type, quality);
  });
}

export async function compressCroppedPhoto(image: HTMLImageElement, position: CropPosition, sourceType: string): Promise<File> {
  const rect = cropRect(image.naturalWidth, image.naturalHeight, position);
  const maxWidth = Math.max(1, Math.min(MENU_PHOTO_MAX_WIDTH, Math.round(rect.width)));
  const widths = [...new Set([maxWidth, Math.max(1, Math.round(maxWidth * 0.8)), Math.max(1, Math.round(maxWidth * 0.65))])];
  const canvas = document.createElement('canvas');

  for (const width of widths) {
    canvas.width = width;
    canvas.height = Math.max(1, Math.round(width / MENU_PHOTO_ASPECT));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.9, 0.82]) {
      let blob = await encode(canvas, 'image/webp', quality);
      if (blob.type !== 'image/webp' && sourceType !== 'image/png') blob = await encode(canvas, 'image/jpeg', quality);
      if (blob.size <= MAX_MEDIA_BYTES) {
        const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
        return new File([blob], `service-photo.${extension}`, { type: blob.type });
      }
      if (blob.type === 'image/png') break;
    }
  }

  throw new Error('The cropped photo is still too large.');
}
