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
        setActiveSubscription(response.data);
        setUserHasPackage(true);
      } else {
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

  const value = {
    userHasPackage,
    activeSubscription,
    loading,
    selectedProperty,
    loadActiveSubscription,
    refreshSubscription,
    clearSubscription,
    setPropertyForSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
