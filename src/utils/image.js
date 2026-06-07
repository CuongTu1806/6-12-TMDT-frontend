export function getProductImageUrl(imageUrl) {
  if (!imageUrl) return '';
  
  // If the path is already a full URL (http://, https:// or data:image)
  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl;
  }

  // Prepends the Backend API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  // If path starts with /image/ or image/
  if (imageUrl.startsWith('/image/')) {
    return `${baseUrl}${imageUrl}`;
  }
  if (imageUrl.startsWith('image/')) {
    return `${baseUrl}/${imageUrl}`;
  }

  // If it is just a file name like "1.png"
  return `${baseUrl}/image/${imageUrl}`;
}
