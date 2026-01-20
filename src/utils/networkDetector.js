/**
 * Network Detector
 * Monitors online/offline status
 * Production-ready with NetInfo
 */

import NetInfo from '@react-native-community/netinfo';

class NetworkDetector {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.init();
  }

  /**
   * Initialize network listener
   */
  init() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable !== false;

      // Notify listeners if status changed
      if (wasOnline !== this.isOnline) {
        console.log(`📶 Network status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        this.notifyListeners();
      }
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected && state.isInternetReachable !== false;
      console.log(`📶 Initial network status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    });
  }

  /**
   * Add listener for network changes
   * @param {Function} callback - Called with (isOnline) when status changes
   * @returns {Function} Unsubscribe function
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Immediately call with current status
    callback(this.isOnline);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.isOnline);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  /**
   * Check if online
   */
  getIsOnline() {
    return this.isOnline;
  }
}

// Export singleton instance
export default new NetworkDetector();
