/**
 * Message Queue for Offline Support
 * Stores messages when offline and sends when online
 * Production-ready with persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@message_queue';

class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.load();
  }

  /**
   * Load queue from AsyncStorage
   */
  async load() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.queue.length} messages from queue`);
      }
    } catch (error) {
      console.error('Failed to load message queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  async save() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save message queue:', error);
    }
  }

  /**
   * Add message to queue
   * @param {Object} message - Message object with text, chatId, receiverId, tempId
   */
  async add(message) {
    const queueItem = {
      ...message,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.queue.push(queueItem);
    await this.save();
    console.log('📝 Added message to queue:', queueItem.tempId);
  }

  /**
   * Process queue - send all pending messages
   * @param {Function} sendFunction - Function to send message (chatId, text)
   */
  async process(sendFunction) {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`🔄 Processing ${this.queue.length} queued messages...`);

    const results = {
      sent: 0,
      failed: 0,
    };

    // Process messages sequentially
    while (this.queue.length > 0) {
      const message = this.queue[0];

      try {
        // Attempt to send
        const response = await sendFunction(message);

        if (response.success) {
          // Success - remove from queue
          this.queue.shift();
          results.sent++;
          console.log('✅ Queue message sent:', message.tempId);
        } else {
          // Failed - increment attempts
          message.attempts++;

          if (message.attempts >= message.maxAttempts) {
            // Max attempts reached - remove from queue
            this.queue.shift();
            results.failed++;
            console.error('❌ Queue message failed (max attempts):', message.tempId);
          } else {
            // Retry later
            this.queue.shift();
            this.queue.push(message); // Move to end
            console.warn(`⚠️ Queue message failed (attempt ${message.attempts}/${message.maxAttempts})`);
          }
        }
      } catch (error) {
        console.error('Queue processing error:', error);
        message.attempts++;

        if (message.attempts >= message.maxAttempts) {
          this.queue.shift();
          results.failed++;
        } else {
          this.queue.shift();
          this.queue.push(message);
        }
      }

      await this.save();
    }

    this.processing = false;
    console.log(`✅ Queue processed: ${results.sent} sent, ${results.failed} failed`);

    return results;
  }

  /**
   * Clear entire queue
   */
  async clear() {
    this.queue = [];
    await this.save();
    console.log('🗑️ Queue cleared');
  }

  /**
   * Get queue length
   */
  getLength() {
    return this.queue.length;
  }

  /**
   * Remove specific message from queue
   */
  async remove(tempId) {
    this.queue = this.queue.filter(msg => msg.tempId !== tempId);
    await this.save();
  }
}

// Export singleton instance
export default new MessageQueue();
