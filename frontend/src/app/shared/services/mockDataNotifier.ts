/**
 * Mock Data Notification Service
 *
 * Provides a global event system to notify the UI when mock AI data is used.
 * Components can subscribe to these events and show appropriate warnings.
 */

type MockDataListener = (message: string) => void;

class MockDataNotifier {
  private listeners: Set<MockDataListener> = new Set();

  /**
   * Subscribe to mock data notifications
   */
  subscribe(listener: MockDataListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners that mock data was used
   */
  notify(context: string = "AI generation"): void {
    const message = `⚠️ Mock data used for ${context} - AI service unavailable`;
    this.listeners.forEach((listener) => listener(message));
  }

  /**
   * Check if response contains mock data metadata
   */
  checkResponse(response: any): boolean {
    return (
      response?.metadata?.isMockData === true ||
      response?.meta?.isMockData === true
    );
  }
}

export const mockDataNotifier = new MockDataNotifier();
