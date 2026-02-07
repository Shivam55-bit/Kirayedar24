import React, { createContext, useState, useContext, useCallback } from 'react';
import subscriptionApi from '../services/subscriptionApi';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

/**
 * Check if subscription is still valid (not expired)
 */
const isSubscriptionValid = (subscription) => {
  if (!subscription) return false;
  
  // Check expiry date
  const expiryDate = subscription.expiryDate || subscription.expiry_date || subscription.endDate || subscription.end_date;
  
  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    
    if (expiry < now) {
      console.log('⚠️ Subscription expired on:', expiry.toISOString());
      return false;
    }
  }
  
  // Check status field if available
  const status = subscription.status || subscription.subscriptionStatus;
  if (status && status.toLowerCase() !== 'active') {
    console.log('⚠️ Subscription status is not active:', status);
    return false;
  }
  
  return true;
};

/**
 * Get days remaining until subscription expires
 */
const getDaysRemaining = (subscription) => {
  if (!subscription) return 0;
  
  const expiryDate = subscription.expiryDate || subscription.expiry_date || subscription.endDate || subscription.end_date;
  if (!expiryDate) return 0;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * Get subscription expiry date formatted
 */
const getExpiryDateFormatted = (subscription) => {
  if (!subscription) return null;
  
  const expiryDate = subscription.expiryDate || subscription.expiry_date || subscription.endDate || subscription.end_date;
  if (!expiryDate) return null;
  
  return new Date(expiryDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const SubscriptionProvider = ({ children }) => {
  const [userHasPackage, setUserHasPackage] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  /**
   * Load active subscription from API
   */
  const loadActiveSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getActiveSubscription();
      
      if (response.success && response.data) {
        // Validate subscription is not expired
        if (isSubscriptionValid(response.data)) {
          console.log('✅ Active subscription found:', response.data.packageName || response.data.planName);
          setActiveSubscription(response.data);
          setUserHasPackage(true);
        } else {
          console.log('⚠️ Subscription found but expired or inactive');
          setActiveSubscription(null);
          setUserHasPackage(false);
        }
      } else {
        console.log('ℹ️ No active subscription found');
        setActiveSubscription(null);
        setUserHasPackage(false);
      }
    } catch (error) {
      console.error('Error loading active subscription:', error);
      setActiveSubscription(null);
      setUserHasPackage(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh subscription status
   */
  const refreshSubscription = useCallback(async () => {
    await loadActiveSubscription();
  }, [loadActiveSubscription]);

  /**
   * Clear subscription data
   */
  const clearSubscription = useCallback(() => {
    setUserHasPackage(false);
    setActiveSubscription(null);
    setSelectedProperty(null);
  }, []);

  /**
   * Set property that triggered subscription flow
   */
  const setPropertyForSubscription = useCallback((property) => {
    setSelectedProperty(property);
  }, []);

  /**
   * Check if user can post a property
   */
  const canPostProperty = useCallback(() => {
    return userHasPackage && isSubscriptionValid(activeSubscription);
  }, [userHasPackage, activeSubscription]);

  /**
   * Get days remaining until subscription expires
   */
  const getDaysUntilExpiry = useCallback(() => {
    return getDaysRemaining(activeSubscription);
  }, [activeSubscription]);

  /**
   * Get formatted expiry date
   */
  const getFormattedExpiryDate = useCallback(() => {
    return getExpiryDateFormatted(activeSubscription);
  }, [activeSubscription]);

  const value = {
    userHasPackage,
    activeSubscription,
    loading,
    selectedProperty,
    loadActiveSubscription,
    refreshSubscription,
    clearSubscription,
    setPropertyForSubscription,
    canPostProperty,
    getDaysUntilExpiry,
    getFormattedExpiryDate,
    isSubscriptionValid,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
