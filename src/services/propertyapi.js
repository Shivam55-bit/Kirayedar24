import { 
  saveProperty as savePropertyAPI,
  getSavedProperties as getSavedPropertiesAPI,
  removeSavedProperty as removeSavedPropertyAPI,
  getMySellProperties as getMySellPropertiesAPI,
  updateProperty as updatePropertyAPI,
  deleteProperty as deletePropertyAPI
} from './api.js';

// Property Service for Save/Unsave functionality
export const propertyService = {

  // Get saved/bookmarked properties
  getSavedProperties: async () => {
    try {
      const response = await getSavedPropertiesAPI();
      console.log('Property Service - Get Saved Properties Response:', response);
      return response;
    } catch (error) {
      console.error('Property Service - Get Saved Properties Error:', error);
      return {
        success: false,
        savedProperties: [],
        message: error.message || 'Failed to fetch saved properties'
      };
    }
  },

  // Save/bookmark a property
  saveProperty: async (propertyId) => {
    try {
      const response = await savePropertyAPI(propertyId);
      console.log('Property Service - Save Property Response:', response);
      return response;
    } catch (error) {
      console.error('Property Service - Save Property Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to save property'
      };
    }
  },

  // Remove saved/bookmarked property
  removeSavedProperty: async (propertyId) => {
    try {
      const response = await removeSavedPropertyAPI(propertyId);
      console.log('Property Service - Remove Saved Property Response:', response);
      return response;
    } catch (error) {
      console.error('Property Service - Remove Saved Property Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove saved property'
      };
    }
  },

  // Get user's posted properties (for owners)
  getMySellProperties: async () => {
    try {
      const response = await getMySellPropertiesAPI();
      console.log('Property Service - Get My Sell Properties Response:', response);
      return response;
    } catch (error) {
      console.error('Property Service - Get My Sell Properties Error:', error);
      return {
        success: false,
        properties: [],
        message: error.message || 'Failed to fetch your posted properties'
      };
    }
  },

  // Update existing property
  updateProperty: async (propertyId, formData) => {
    try {
      const response = await updatePropertyAPI(propertyId, formData);
      console.log('Property Service - Update Property Response:', response);
      return response;
    } catch (error) {
      console.error('Property Service - Update Property Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update property'
      };
    }
  },

  // Delete property
  deleteProperty: async (propertyId) => {
    try {
      const response = await deletePropertyAPI(propertyId);
      console.log('Property Service - Delete Property Response:', response);
      return response;
    } catch (error) {
      console.error('Property Service - Delete Property Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete property'
      };
    }
  },

};

export default propertyService;