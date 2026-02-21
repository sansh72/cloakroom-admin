const CLOUD_NAME = 'dlxv7oikk';
const UPLOAD_PRESET = 'ml_default';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Upload a single image file to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export const uploadImage = async (file, folder = 'products') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url;
};

/**
 * Upload multiple image files to Cloudinary.
 * Returns an array of secure URLs.
 */
export const uploadImages = async (files, folder = 'products') => {
  const uploads = Array.from(files).map((file) => uploadImage(file, folder));
  return Promise.all(uploads);
};
