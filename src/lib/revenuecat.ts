import { Purchases, CustomerInfo, PurchasesError, ErrorCode } from '@revenuecat/purchases-js';

// Product definitions
export const PRODUCTS = {
  PRO_MONTHLY: {
    id: 'pro_monthly',
     simpleId: 'pro', 
    entitlement: 'pro_access',
    type: 'subscription'
  },
  PRO_TRIAL: {
    id: 'pro_monthly_trial',
     simpleId: 'pro', 
    entitlement: 'pro_access',
    type: 'trial'
  },
  SUPER_PRO: {
    id: 'super_pro_monthly',
     simpleId: 'super_pro', 
    entitlement: 'pro_access',
    type: 'subscription'
  }
};

export interface SubscriptionTier {
  id: string;
  name: string;
  features: {
    textPrompts: string;
    voiceCalls: string;
    videoCalls: string;
  };
  price: string;
  color: string;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Free',
    features: {
      textPrompts: '3 prompts',
      voiceCalls: '2 calls (5 min)',
      videoCalls: '1 call (5 min)'
    },
    price: '$0',
    color: 'blue'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    features: {
      textPrompts: 'Unlimited',
      voiceCalls: '10 calls (20 min)',
      videoCalls: '5 calls (20 min)'
    },
    price: '$20',
    color: 'purple'
  },
  super_pro: {
    id: 'super_pro',
    name: 'Super Pro',
    features: {
      textPrompts: 'Unlimited',
      voiceCalls: 'Unlimited',
      videoCalls: 'Unlimited'
    },
    price: '$50',
    color: 'green'
  }
};

class RevenueCatService {
  private initialized = false;
  private customerInfo: CustomerInfo | null = null;
  private isDevelopment = import.meta.env.DEV;
  private purchases: typeof Purchases | null = null;
  private appUserId: string | null = null;
  private readonly API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'rcb_MTtdeYeUytmmuXBqisqsohADsVZe';
  public readonly BASE_PURCHASE_URL = 'https://pay.rev.cat/sandbox/bfatimlinxdsihhs';

  /**
   * Initialize RevenueCat with user ID
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      this.appUserId = userId;
      
      // Store appUserId in localStorage for consistency
      localStorage.setItem('revenueCatAppUserId', userId);
      
      if (this.isDevelopment) {
        console.log('Initializing RevenueCat with API key:', this.API_KEY);
        console.log('User ID:', userId);
      }

      // Configure RevenueCat Web SDK
      this.purchases = Purchases.configure(this.API_KEY, userId);
      
      this.initialized = true;
      
      // Get initial customer info
      await this.refreshCustomerInfo();
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Error initializing RevenueCat:', error);
      }
      
      // Fallback to mock mode in development
      if (this.isDevelopment) {
        console.warn('Falling back to mock mode due to initialization error');
        this.initialized = true;
        this.customerInfo = this.getMockCustomerInfo();
        return;
      }
      
      throw error;
    }
  }

  /**
   * Get mock customer info for development
   */
  private getMockCustomerInfo(): CustomerInfo {
    return {
      entitlements: {
        active: {},
        all: {}
      },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
      nonSubscriptionTransactions: [],
      firstSeen: new Date().toISOString(),
      originalAppUserId: 'mock-user',
      requestDate: new Date().toISOString(),
      latestExpirationDate: null,
      originalApplicationVersion: null,
      originalPurchaseDate: null,
      managementURL: null
    } as CustomerInfo;
  }

  /**
   * Refresh customer info from RevenueCat
   */
  async refreshCustomerInfo(): Promise<CustomerInfo> {
    try {
      if (!this.initialized) {
        if (this.appUserId) {
          await this.initialize(this.appUserId);
        } else {
          const storedAppUserId = localStorage.getItem('revenueCatAppUserId');
          if (storedAppUserId) {
            await this.initialize(storedAppUserId);
          } else {
            throw new Error('RevenueCat not initialized and no appUserId available');
          }
        }
      }
      
      if (this.isDevelopment) {
        // Return mock data in development mode if needed
        if (!this.API_KEY) {
          this.customerInfo = this.getMockCustomerInfo();
          return this.customerInfo;
        }
      }

      // Use the correct method from the shared instance
      this.customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
      
      if (this.isDevelopment) {
        console.log('Customer info refreshed:', {
          hasActiveEntitlements: Object.keys(this.customerInfo.entitlements.active).length > 0,
          activeSubscriptions: this.customerInfo.activeSubscriptions,
          entitlements: this.customerInfo.entitlements
        });
      }
      
      return this.customerInfo;
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Error fetching customer info:', error);
      }
      
      // Fallback to mock in development
      if (this.isDevelopment) {
        this.customerInfo = this.getMockCustomerInfo();
        return this.customerInfo;
      }
      
      throw error;
    }
  }

  /**
   * Get current customer info (cached)
   */
  getCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  /**
   * Get active subscription tier
   */
getActiveSubscriptionTier(): string {
  if (!this.customerInfo) return 'free';

  
  const activeSubs = Array.from(this.customerInfo.activeSubscriptions || []);
  
  if (activeSubs.some(sub => sub.includes('super_pro'))) {
    return 'super_pro';
  }
  
  if (activeSubs.some(sub => sub.includes('pro_monthly'))) {
    return 'pro';
  }

  
  const proAccess = this.customerInfo.entitlements.active['pro_access'];
  if (proAccess) {
    return proAccess.productIdentifier?.includes('super_pro') 
      ? 'super_pro' 
      : 'pro';
  }

  return 'free';
}
  /**
   * Get offerings from RevenueCat
   */
  async getOfferings(options?: { currency?: string }): Promise<any> {
    try {
      if (!this.initialized) {
        if (this.appUserId) {
          await this.initialize(this.appUserId);
        } else {
          const storedAppUserId = localStorage.getItem('revenueCatAppUserId');
          if (storedAppUserId) {
            await this.initialize(storedAppUserId);
          } else {
            throw new Error('RevenueCat not initialized and no appUserId available');
          }
        }
      }
      
      if (this.isDevelopment) {
        // Return mock offerings
        return {
          current: {
            identifier: "default",
            serverDescription: "Default offering",
            availablePackages: [
              {
                identifier: PRODUCTS.PRO_MONTHLY.id,
                packageType: "MONTHLY",
                storeProduct: {
                  price: 19.99,
                  priceString: "$19.99",
                  currencyCode: "USD",
                  identifier: PRODUCTS.PRO_MONTHLY.id,
                  title: "Pro Monthly",
                  description: "Pro subscription with monthly billing"
                },
                offering: "default"
              },
              {
                identifier: PRODUCTS.SUPER_PRO.id,
                packageType: "MONTHLY",
                storeProduct: {
                  price: 49.99,
                  priceString: "$49.99",
                  currencyCode: "USD",
                  identifier: PRODUCTS.SUPER_PRO.id,
                  title: "Super Pro Monthly",
                  description: "Super Pro subscription with monthly billing"
                },
                offering: "default"
              }
            ],
            monthly: {
              identifier: PRODUCTS.PRO_MONTHLY.id,
              packageType: "MONTHLY",
              storeProduct: {
                price: 19.99,
                priceString: "$19.99",
                currencyCode: "USD",
                identifier: PRODUCTS.PRO_MONTHLY.id,
                title: "Pro Monthly",
                description: "Pro subscription with monthly billing"
              },
              offering: "default"
            },
            annual: {
              identifier: PRODUCTS.SUPER_PRO.id,
              packageType: "MONTHLY",
              storeProduct: {
                price: 49.99,
                priceString: "$49.99",
                currencyCode: "USD",
                identifier: PRODUCTS.SUPER_PRO.id,
                title: "Super Pro Monthly",
                description: "Super Pro subscription with monthly billing"
              },
              offering: "default"
            }
          }
        };
      }

      return await Purchases.getSharedInstance().getOfferings(options);
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Error fetching offerings:', error);
      }
      throw error;
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(pkg: any): Promise<{ customerInfo: CustomerInfo }> {
    try {
      if (!this.initialized) {
        if (this.appUserId) {
          await this.initialize(this.appUserId);
        } else {
          const storedAppUserId = localStorage.getItem('revenueCatAppUserId');
          if (storedAppUserId) {
            await this.initialize(storedAppUserId);
          } else {
            throw new Error('RevenueCat not initialized and no appUserId available');
          }
        }
      }
      
      if (this.isDevelopment) {
        // Mock purchase success
        if (this.isDevelopment) {
          console.log('Mock purchase initiated for package:', pkg.identifier);
        }
        
        // Check if user already has this product
        const customerInfo = await this.refreshCustomerInfo();
        const entitlementId = 'pro_access';
        const hasEntitlement = customerInfo.entitlements.active[entitlementId];
        
        if (hasEntitlement) {
          throw new Error('You already have an active subscription to this product');
        }
        
        // Simulate purchase success
        this.customerInfo = {
          ...this.getMockCustomerInfo(),
          entitlements: {
            active: {
              'pro_access': {
                productIdentifier: pkg.identifier,
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                purchaseDate: new Date().toISOString(),
                isSandbox: true
              }
            },
            all: {}
          },
          activeSubscriptions: [pkg.identifier]
        };
        
        return { customerInfo: this.customerInfo };
      }

      // For web, we need to redirect to the purchase URL
      const appUserId = this.appUserId || localStorage.getItem('revenueCatAppUserId');
      if (!appUserId) {
        throw new Error('No appUserId available for purchase');
      }
      
      const purchaseUrl = `${this.BASE_PURCHASE_URL}/${appUserId}`;
      window.open(purchaseUrl, '_blank');
      
      // Since we're redirecting, we can't return a result immediately
      // The user will need to refresh the page after purchase
      return { customerInfo: await this.refreshCustomerInfo() };
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Error purchasing package:', error);
      }
      
      if (error instanceof Error && error.message.includes('already have an active subscription')) {
        throw new Error('You already have an active subscription to this product');
      }
      
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      if (!this.initialized) {
        if (this.appUserId) {
          await this.initialize(this.appUserId);
        } else {
          const storedAppUserId = localStorage.getItem('revenueCatAppUserId');
          if (storedAppUserId) {
            await this.initialize(storedAppUserId);
          } else {
            throw new Error('RevenueCat not initialized and no appUserId available');
          }
        }
      }
      
      if (this.isDevelopment) {
        // Mock restore
        if (this.isDevelopment) {
          console.log('Mock restore purchases');
        }
        return this.customerInfo || this.getMockCustomerInfo();
      }

      // For Web SDK, restoring purchases is typically handled by getCustomerInfo
      // as the purchases are tied to the user account
      const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
      this.customerInfo = customerInfo;
      return customerInfo;
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Error restoring purchases:', error);
      }
      throw error;
    }
  }

  /**
   * Get customer portal URL
   */
  async getCustomerPortalURL(): Promise<string> {
    try {
      if (!this.initialized) {
        if (this.appUserId) {
          await this.initialize(this.appUserId);
        } else {
          const storedAppUserId = localStorage.getItem('revenueCatAppUserId');
          if (storedAppUserId) {
            await this.initialize(storedAppUserId);
          } else {
            throw new Error('RevenueCat not initialized and no appUserId available');
          }
        }
      }
      
      if (this.isDevelopment) {
        // Return mock portal URL
        return 'https://mock-customer-portal.com';
      }

      // The Web SDK might not have this method, check if it exists
      if (typeof Purchases.getSharedInstance().getCustomerPortalURL === 'function') {
        return await Purchases.getSharedInstance().getCustomerPortalURL();
      } else {
        // For RevenueCat Web, we can use the management URL from customer info
        const customerInfo = await this.refreshCustomerInfo();
        if (customerInfo.managementURL) {
          return customerInfo.managementURL;
        }
        
        throw new Error('Customer portal URL not available');
      }
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Error getting customer portal URL:', error);
      }
      throw error;
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  hasAccess(feature: 'text' | 'voice' | 'video'): boolean {
    const tier = this.getActiveSubscriptionTier();
    
    // Free tier limitations
    if (tier === 'free') {
      // Check usage limits from database here
      // For now, return true as we're not implementing usage tracking yet
      return true;
    }
    
    // Pro tier limitations for voice and video
    if (tier === 'pro') {
      if (feature === 'text') return true;
      // Check usage limits from database for voice and video
      return true;
    }
    
    // Super Pro has unlimited access
    return true;
  }

  /**
   * Get remaining usage for a feature
   */
  getRemainingUsage(feature: 'text' | 'voice' | 'video'): number {
    const tier = this.getActiveSubscriptionTier();
    
    // Default limits based on tier
    if (tier === 'free') {
      if (feature === 'text') return 3; // 3 prompts
      if (feature === 'voice') return 2; // 2 calls
      if (feature === 'video') return 1; // 1 call
    }
    
    if (tier === 'pro') {
      if (feature === 'text') return Infinity; // Unlimited
      if (feature === 'voice') return 10; // 10 calls
      if (feature === 'video') return 5; // 5 calls
    }
    
    // Super Pro has unlimited usage
    return Infinity;
  }

  /**
   * Get purchase URL for web purchases
   */
  getPurchaseUrl(): string {
    const appUserId = this.appUserId || localStorage.getItem('revenueCatAppUserId');
    return this.BASE_PURCHASE_URL;
  }

  /**
   * Check if user has a specific product
   */
  async hasProduct(productId: string): Promise<boolean> {
    try {
      const customerInfo = await this.refreshCustomerInfo();
      return customerInfo.activeSubscriptions.includes(productId);
    } catch (error) {
      if (this.isDevelopment) {
        console.error('Error checking product ownership:', error);
      }
      return false;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();