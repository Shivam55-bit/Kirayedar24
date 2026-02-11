// Property Helper Functions
import { BASE_URL, IMAGE_BASE_URL } from '../config/api.config';

// Helper function to format image URLs
// Images are stored on IMAGE_BASE_URL (old server), NOT on BASE_URL (API server)
export const formatImageUrl = (url) => {
    if (!url || url === 'undefined' || url === 'null') {
        return 'https://placehold.co/400x200/CCCCCC/888888?text=No+Image';
    }

    // Normalize backslashes and trim
    url = url.replace(/\\/g, '/').trim();

    // If already a complete URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Protocol-relative URL (e.g., //cdn.example.com/image.jpg)
    if (url.startsWith('//')) {
      return `https:${url}`;
    }

    // Use IMAGE_BASE_URL for serving uploaded images (separate from API server)
    const imageBase = IMAGE_BASE_URL || BASE_URL || 'https://kiraeydarback.bhoomi.cloud';
    
    // If it's a relative path, prepend image base URL
    if (url.startsWith('/')) {
        return `${imageBase}${url}`;
    }

    // If it starts with 'uploads/', prepend image base URL
    if (url.startsWith('uploads/')) {
        return `${imageBase}/${url}`;
    }

    // If it's just a filename, assume it's in uploads directory
    if (!url.startsWith('/')) {
        return `${imageBase}/uploads/${url}`;
    }

    // Fallback
    return url;
};

// Helper function to format price
export const formatPrice = (price) => {
    if (typeof price === 'number') {
        return `₹${price.toLocaleString('en-IN')}`;
    }
    if (typeof price === 'string' && !isNaN(parseFloat(price))) {
        return `₹${parseFloat(price).toLocaleString('en-IN')}`;
    }
    return price || 'Price not available';
};

// Helper function to get first image URL from photosAndVideo array
export const getFirstImageUrl = (photosAndVideo) => {
    if (!photosAndVideo || !Array.isArray(photosAndVideo) || photosAndVideo.length === 0) {
        return null;
    }

    const firstImage = photosAndVideo[0];
    
    if (typeof firstImage === 'string') {
        return firstImage;
    }
    
    if (firstImage && typeof firstImage === 'object') {
        return firstImage.uri || firstImage.url || firstImage;
    }
    
    return null;
};