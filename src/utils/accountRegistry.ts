import { CustomerUser, BusinessUser, Role } from '../types';
import { INITIAL_CUSTOMER, INITIAL_BUSINESS_USER } from '../data/mockData';
import { sanitizeEmail } from './authErrorHandling';

export interface RegisteredAccount {
  id: string;
  email: string; // Unique primary key (case-insensitive)
  role: Role; // 'customer' | 'business' (fixed at signup)
  name: string;
  appCode: string;
  appCodeHash?: string;
  phone?: string;
  avatar?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
  nationality?: string;
  businessName?: string;
  category?: string;
  location?: string;
  salonId?: string;
  ownerRole?: string;
  signUpGmail?: string;
  createdAt?: string;
}

export const STORAGE_ACCOUNTS_KEY = 'algosalon_registered_accounts';
export const ACCOUNTS_PURGE_VERSION_KEY = 'algosalon_clean_slate_v8';
const UNWANTED_EMAILS = ['marcus@algosalon.com', 'partner@algosalon.com', 'user@example.com', 'demo@algosalon.com'];
const UNWANTED_IDS = ['biz-201', 'cust-guest'];

/**
 * Lightweight synchronous SHA-256 implementation for salted PIN storage.
 */
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= (j & 0xff) << ((3 - (i % 4)) * 8);
  }
  words[ascii.length >> 2] |= 0x80 << ((3 - (ascii.length % 4)) * 8);
  words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  for (let j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export const hashAccountPin = (pin: string, email: string): string => {
  const normEmail = normalizeEmail(email);
  return sha256Sync(`${normEmail}:${pin.trim()}`);
};

export const verifyAccountPin = (account?: RegisteredAccount | null, inputPin?: string): boolean => {
  if (!account || !inputPin) return false;
  const cleanPin = inputPin.trim();
  const expectedHash = hashAccountPin(cleanPin, account.email);

  if (account.appCodeHash && account.appCodeHash === expectedHash) {
    return true;
  }
  if (account.appCode && account.appCode === cleanPin) {
    account.appCodeHash = expectedHash;
    updateAccountAppCode(account.email, cleanPin);
    return true;
  }
  return false;
};

/**
 * Generates a random 4-digit PIN code (between 1000 and 9999).
 */
export const generateSecurePin = (): string => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

/**
 * Default seeded accounts - kept completely empty to allow fresh user account creation.
 */
export const SEED_ACCOUNTS: RegisteredAccount[] = [];

/**
 * Proactively cleans up any duplicate accounts or conflicting roles across localStorage,
 * ensuring strict One Gmail = One Account (Type: Customer OR Type: Business, never both).
 */
export const cleanupDuplicateAccounts = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) return;
    const parsedList: RegisteredAccount[] = JSON.parse(raw);
    if (!Array.isArray(parsedList) || parsedList.length === 0) return;

    // Track seen emails
    const uniqueMap = new Map<string, RegisteredAccount>();
    let hasDuplicates = false;

    for (const acc of parsedList) {
      if (!acc || !acc.email) continue;
      const norm = normalizeEmail(acc.email);
      if (!norm) continue;

      // Purge unwanted legacy mock users
      if (UNWANTED_EMAILS.includes(norm) || (acc.id && UNWANTED_IDS.includes(acc.id))) {
        hasDuplicates = true;
        continue;
      }

      if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, {
          ...acc,
          email: norm,
        });
      } else {
        hasDuplicates = true;
        // If an email appears multiple times (e.g. was mistakenly created as both customer and business),
        // enforce ONE identity. Keep the one matching the current active role or most complete profile.
        const currentRole = localStorage.getItem('algosalon_role');
        const existing = uniqueMap.get(norm)!;
        if (currentRole && acc.role === currentRole && existing.role !== currentRole) {
          uniqueMap.set(norm, { ...acc, email: norm });
        }
      }
    }

    if (hasDuplicates || uniqueMap.size !== parsedList.length) {
      const cleanList = Array.from(uniqueMap.values());
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(cleanList));
      console.log(`[AccountRegistry] Cleaned up duplicate/unwanted accounts. Enforced 1-email-1-account for ${cleanList.length} unique accounts.`);
    }

    // Check customer and business localStorage user profiles to purge unwanted mock users
    const custRaw = localStorage.getItem('algosalon_customer');
    if (custRaw) {
      try {
        const parsed = JSON.parse(custRaw);
        if (
          (parsed.email && UNWANTED_EMAILS.includes(normalizeEmail(parsed.email))) ||
          (parsed.id && UNWANTED_IDS.includes(parsed.id))
        ) {
          localStorage.removeItem('algosalon_customer');
        }
      } catch (err) {
        console.warn('[AccountRegistry] Failed to parse customer profile during cleanup:', err);
      }
    }

    const bizRaw = localStorage.getItem('algosalon_business_user');
    if (bizRaw) {
      try {
        const parsed = JSON.parse(bizRaw);
        if (
          (parsed.email && UNWANTED_EMAILS.includes(normalizeEmail(parsed.email))) ||
          (parsed.id && UNWANTED_IDS.includes(parsed.id))
        ) {
          localStorage.removeItem('algosalon_business_user');
        }
      } catch (err) {
        console.warn('[AccountRegistry] Failed to parse business profile during cleanup:', err);
      }
    }

    // Also check if customer and business localStorage user profiles share the same email
    if (custRaw && bizRaw) {
      try {
        const cust = JSON.parse(custRaw);
        const biz = JSON.parse(bizRaw);
        if (cust?.email && biz?.email && normalizeEmail(cust.email) === normalizeEmail(biz.email)) {
          const activeRole = localStorage.getItem('algosalon_role') || 'customer';
          const matchedAcc = uniqueMap.get(normalizeEmail(cust.email));
          const trueRole = matchedAcc?.role || (activeRole === 'business' ? 'business' : 'customer');

          if (trueRole === 'customer') {
            // Reset conflicting business profile
            localStorage.setItem('algosalon_business_user', JSON.stringify(INITIAL_BUSINESS_USER));
          } else {
            // Reset conflicting customer profile
            localStorage.setItem('algosalon_customer', JSON.stringify(INITIAL_CUSTOMER));
          }
        }
      } catch (err) {
        console.warn('[AccountRegistry] Failed to compare customer and business profiles:', err);
      }
    }

    // Ensure active role in localStorage corresponds to a real account on this device
    const activeRole = localStorage.getItem('algosalon_role');
    if (activeRole === 'business') {
      const hasRealBiz = Array.from(uniqueMap.values()).some(
        a => a.role === 'business' && a.email && !UNWANTED_EMAILS.includes(normalizeEmail(a.email))
      );
      if (!hasRealBiz) {
        localStorage.setItem('algosalon_role', 'customer');
      }
    }
  } catch (err) {
    console.warn('Error during account cleanup:', err);
  }
};

// Automatic clean-slate purge and deduplication on startup
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(ACCOUNTS_PURGE_VERSION_KEY)) {
      localStorage.removeItem(STORAGE_ACCOUNTS_KEY);
      localStorage.removeItem('algosalon_auth_token');
      localStorage.removeItem('algosalon_customer');
      localStorage.removeItem('algosalon_business_user');
      localStorage.removeItem('algosalon_appointments');
      localStorage.removeItem('algosalon_reviews');
      localStorage.removeItem('algosalon_notifications');
      localStorage.setItem('algosalon_role', 'customer');
      cleanupDuplicateAccounts();
      localStorage.setItem(ACCOUNTS_PURGE_VERSION_KEY, 'true');
    }
    // Always run deduplication on startup
    cleanupDuplicateAccounts();
  } catch (err) {
    console.warn('Storage startup error:', err);
  }
}

/**
 * Completely clears all accounts from database/storage.
 */
export const clearAllRegisteredAccounts = (): void => {
  try {
    localStorage.removeItem(STORAGE_ACCOUNTS_KEY);
    localStorage.removeItem('algosalon_auth_token');
    localStorage.removeItem('algosalon_customer');
    localStorage.removeItem('algosalon_business_user');
  } catch (err) {
    console.error('Failed to clear accounts:', err);
  }
};

/**
 * Explicitly removes an account by email.
 */
export const deleteAccountByEmail = (email: string): boolean => {
  const normEmail = normalizeEmail(email);
  if (!normEmail) return false;
  try {
    const accounts = getRegisteredAccounts();
    const filtered = accounts.filter(a => normalizeEmail(a.email) !== normEmail);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete account:', err);
    return false;
  }
};

/**
 * Normalizes email address for consistent comparison, stripping invisible
 * mobile unicode spaces and normalizing to lowercase.
 */
export const normalizeEmail = (email: string): string => {
  return sanitizeEmail(email);
};

/**
 * Retrieves all registered accounts with automated deduplication & migration.
 * Enforces rule: EXACTLY ONE ACCOUNT PER EMAIL.
 */
export const getRegisteredAccounts = (): RegisteredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    const parsedList: RegisteredAccount[] = raw ? JSON.parse(raw) : [];

    // Combine seed accounts and parsed accounts
    const allCandidates = [...SEED_ACCOUNTS, ...(Array.isArray(parsedList) ? parsedList : [])];

    // Deduplicate strictly by normalized email address
    const uniqueMap = new Map<string, RegisteredAccount>();

    allCandidates.forEach(account => {
      if (!account || !account.email) return;
      const normEmail = normalizeEmail(account.email);
      if (!normEmail) return;

      const existing = uniqueMap.get(normEmail);
      if (!existing) {
        const pin = account.appCode || '';
        uniqueMap.set(normEmail, {
          ...account,
          email: normEmail,
          appCodeHash: account.appCodeHash || (pin ? hashAccountPin(pin, normEmail) : undefined),
        });
      } else {
        // If an entry already exists, merge attributes without mutating the fixed role
        // Keep the latest details while maintaining role consistency
        const pin = account.appCode || existing.appCode || generateSecurePin();
        uniqueMap.set(normEmail, {
          ...existing,
          ...account,
          id: existing.id || account.id,
          role: existing.role, // role remains strictly fixed
          email: normEmail,
          appCode: pin,
          appCodeHash: account.appCodeHash || existing.appCodeHash || hashAccountPin(pin, normEmail),
        });
      }
    });

    const deduplicated = Array.from(uniqueMap.values());

    // If migration cleaned up any duplicates or seeded missing data, persist back
    if (deduplicated.length !== parsedList.length) {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(deduplicated));
    }

    return deduplicated;
  } catch (err) {
    console.warn('Error reading registered accounts, resetting to seeds:', err);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
    return SEED_ACCOUNTS;
  }
};

/**
 * Looks up an account by email (case-insensitive).
 * Returns undefined if no account exists with this email.
 */
export const findAccountByEmail = (email: string): RegisteredAccount | undefined => {
  const normEmail = normalizeEmail(email);
  if (!normEmail) return undefined;
  const accounts = getRegisteredAccounts();
  return accounts.find(a => normalizeEmail(a.email) === normEmail);
};

/**
 * Checks if ANY account (customer or business) exists with this email.
 */
export const isEmailRegistered = (email: string): boolean => {
  return !!findAccountByEmail(email);
};

export interface AccountStatusResult {
  exists: boolean;
  type?: 'Customer' | 'Business';
  role?: Role;
  account?: RegisteredAccount;
  email: string;
}

/**
 * Checks account status and returns exact identity type (Customer or Business).
 * Enforces: One Gmail = One Account Concept.
 */
export const checkAccountStatus = (email: string): AccountStatusResult => {
  const normEmail = normalizeEmail(email);
  if (!normEmail) {
    return { exists: false, email: '' };
  }
  const account = findAccountByEmail(normEmail);
  if (!account) {
    return { exists: false, email: normEmail };
  }
  const type: 'Customer' | 'Business' = account.role === 'business' ? 'Business' : 'Customer';
  return {
    exists: true,
    type,
    role: account.role,
    account,
    email: normEmail,
  };
};

export interface RegisterAccountResult {
  success: boolean;
  account?: RegisteredAccount;
  error?: string;
  existingAccount?: RegisteredAccount;
}

/**
 * Registers a new account enforcing:
 * 1. One email = one account only (Type: Customer OR Type: Business)
 * 2. If email exists in database -> reject creation with exact message
 * 3. Role is fixed at signup
 */
export const registerNewAccount = (
  accountData: Omit<RegisteredAccount, 'id'> & { id?: string }
): RegisterAccountResult => {
  const normEmail = normalizeEmail(accountData.email);
  if (!normEmail) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
    };
  }

  const existing = findAccountByEmail(normEmail);
  if (existing) {
    const existingType = existing.role === 'business' ? 'Business' : 'Customer';
    return {
      success: false,
      error: `This email is already registered as Type: ${existingType}. Each email can only have one account. Please log in as ${existingType}.`,
      existingAccount: existing,
    };
  }

  const accounts = getRegisteredAccounts();
  const rawPin = accountData.appCode || generateSecurePin();
  const newAccount: RegisteredAccount = {
    ...accountData,
    id: accountData.id || `${accountData.role === 'customer' ? 'cust' : 'biz'}-${Date.now()}`,
    email: normEmail,
    appCode: rawPin,
    appCodeHash: hashAccountPin(rawPin, normEmail),
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save registered account:', err);
  }

  return {
    success: true,
    account: newAccount,
  };
};

/**
 * Updates an existing account's app code (PIN).
 */
export const updateAccountAppCode = (email: string, newAppCode: string): boolean => {
  const normEmail = normalizeEmail(email);
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex(a => normalizeEmail(a.email) === normEmail);
  if (index === -1) return false;

  accounts[index].appCode = newAppCode;
  accounts[index].appCodeHash = hashAccountPin(newAppCode, normEmail);
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch {
    return false;
  }
};

/**
 * Updates an existing account's profile details.
 */
export const updateRegisteredAccount = (
  email: string,
  updates: Partial<RegisteredAccount>
): boolean => {
  const normEmail = normalizeEmail(email);
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex(a => normalizeEmail(a.email) === normEmail);
  if (index === -1) return false;

  // Don't allow changing email or role through standard profile update
  const { email: _ignoredEmail, role: _ignoredRole, ...safeUpdates } = updates;

  const newAppCode = safeUpdates.appCode || accounts[index].appCode;
  accounts[index] = {
    ...accounts[index],
    ...safeUpdates,
    appCode: newAppCode,
    appCodeHash: newAppCode ? hashAccountPin(newAppCode, normEmail) : accounts[index].appCodeHash,
  };

  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch {
    return false;
  }
};

/**
 * Converts a RegisteredAccount to a CustomerUser.
 */
export const accountToCustomerUser = (account: RegisteredAccount): CustomerUser => {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone || '',
    avatar: account.avatar || '',
    gender: account.gender || 'Male',
    dateOfBirth: account.dateOfBirth || '',
    nationality: account.nationality || '',
    appCode: account.appCode || '',
    savedSalonIds: [],
    loyaltyPoints: 0,
  };
};

/**
 * Converts a RegisteredAccount to a BusinessUser.
 */
export const accountToBusinessUser = (account: RegisteredAccount): BusinessUser => {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone || '+971 50 123 4567',
    salonId: account.salonId || 'salon-1',
    ownerRole: account.ownerRole || 'Owner & Salon Director',
    businessName: account.businessName || 'My Salon Studio',
    category: account.category || 'Hair & Styling',
    location: account.location || 'Downtown Metro',
    appCode: account.appCode || '',
    signUpGmail: account.signUpGmail || account.email,
    isGmailLinked: true,
  };
};
