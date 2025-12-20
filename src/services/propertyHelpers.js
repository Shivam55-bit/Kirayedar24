// Property Helper Functions
import { BASE_URL } from '../config/api.config';

// Helper function to format image URLs
export const formatImageUrl = (url) => {
    console.log('[formatImageUrl] Input:', url);
    
    if (!url || url === 'undefined' || url === 'null') {
        console.log('[formatImageUrl] No valid URL, using placeholder');
        return 'https://placehold.co/400x200/CCCCCC/888888?text=No+Image';
    }

    // If already a complete URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('[formatImageUrl] Complete URL, returning as is:', url);
        return url;
    }

    // Use the known base URL if BASE_URL is not available
    const baseUrl = BASE_URL || 'https://n5.bhoomitechzone.us';
    
    // If it's a relative path, prepend base URL
    if (url.startsWith('/')) {
        const fullUrl = `${baseUrl}${url}`;
        console.log('[formatImageUrl] Relative path with base URL:', fullUrl);
        return fullUrl;
    }

    // If it starts with 'uploads/', prepend base URL
    if (url.startsWith('uploads/')) {
        const fullUrl = `${baseUrl}/${url}`;
        console.log('[formatImageUrl] Uploads path with base URL:', fullUrl);
        return fullUrl;
    }

    // If it's just a filename, assume it's in uploads directory
    if (!url.startsWith('/')) {
        const fullUrl = `${baseUrl}/uploads/${url}`;
        console.log('[formatImageUrl] Filename with uploads path:', fullUrl);
        return fullUrl;
    }

    // Fallback
    console.log('[formatImageUrl] Fallback, returning input:', url);
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