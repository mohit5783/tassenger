import { USE_STUB_CONTACTS } from "../config/featureFlags";

// Type definitions to match the real API
export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  hasApp: boolean;
  userId?: string;
}

// ========== STUB IMPLEMENTATION ==========
const stubContacts = {
  async requestContactsPermission(): Promise<boolean> {
    console.log("[STUB] Would request contacts permission");
    return true;
  },

  async getContacts(): Promise<Contact[]> {
    console.log("[STUB] Would get contacts");
    // Return some stub contacts
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return [
      {
        id: "contact-1",
        name: "John Doe",
        phoneNumber: "+1234567890",
        hasApp: true,
        userId: "user-1",
      },
      {
        id: "contact-2",
        name: "Jane Smith",
        phoneNumber: "+1987654321",
        hasApp: true,
        userId: "user-2",
      },
      {
        id: "contact-3",
        name: "Alice Johnson",
        phoneNumber: "+1122334455",
        hasApp: false,
      },
      {
        id: "contact-4",
        name: "Bob Brown",
        phoneNumber: "+1555666777",
        hasApp: false,
      },
      {
        id: "contact-5",
        name: "Charlie Davis",
        phoneNumber: "+1999888777",
        hasApp: true,
        userId: "user-3",
      },
    ];
  },

  async sendInviteSMS(
    phoneNumber: string,
    contactName: string
  ): Promise<boolean> {
    console.log(
      `[STUB] Would send SMS invitation to ${contactName} at ${phoneNumber}`
    );
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  },
};

// ========== REAL IMPLEMENTATION ==========
// This would be the actual implementation using Expo Contacts and SMS
// TODO: Implement real contacts service when ready to integrate native modules
const realContacts = {
  // We'll implement these when we're ready to use real contacts
  // For now, they just call the stub methods to avoid errors
  async requestContactsPermission(): Promise<boolean> {
    return stubContacts.requestContactsPermission();
  },

  async getContacts(): Promise<Contact[]> {
    return stubContacts.getContacts();
  },

  async sendInviteSMS(
    phoneNumber: string,
    contactName: string
  ): Promise<boolean> {
    return stubContacts.sendInviteSMS(phoneNumber, contactName);
  },
};

// Export the appropriate implementation based on the feature flag
export const ContactsService = USE_STUB_CONTACTS ? stubContacts : realContacts;

// Convenience exports for commonly used functions
export const { requestContactsPermission, getContacts, sendInviteSMS } =
  ContactsService;
