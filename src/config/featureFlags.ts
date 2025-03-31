// Feature flags to toggle between real and stubbed implementations
// Set to true to use stub implementations (works in Expo Go)
// Set to false to use real native implementations (requires native builds)

export const USE_STUB_SERVICES = true;

// Individual feature flags (all controlled by master flag for now)
export const USE_STUB_NOTIFICATIONS = USE_STUB_SERVICES;
export const USE_STUB_AUTH = USE_STUB_SERVICES;
export const USE_STUB_CONTACTS = USE_STUB_SERVICES;

// You can override individual flags here if needed
// export const USE_STUB_NOTIFICATIONS = false; // Force real notifications even if other services are stubbed
