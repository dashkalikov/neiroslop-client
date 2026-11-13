export async function prepareAvatar(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    throw new Error('Choose a PNG, JPEG, or WebP image up to 8 MB.');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 160;
    const side = Math.min(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 160, 160);
    for (const quality of [0.82, 0.64, 0.45, 0.28]) {
      const encoded = canvas.toDataURL('image/webp', quality).split(',')[1];
      if (encoded && encoded.length <= 15_000) return encoded;
    }
  } catch {
    throw new Error('Choose a valid PNG, JPEG, or WebP image.');
  } finally {
    bitmap?.close();
  }
  throw new Error('This image is too detailed. Try a different photo.');
}
