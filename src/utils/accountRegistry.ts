import { CustomerUser, BusinessUser, Role } from '../types';
import { INITIAL_CUSTOMER, INITIAL_BUSINESS_USER } from '../data/mockData';
import { sanitizeEmail } from './authErrorHandling';

export interface RegisteredAccount {
  id: string;
  email: string; // Unique primary key (case-insensitive)
  role: Role; // 'customer' | 'business' (fixed at signup)
  name: string;
  appCode: string;
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
export const ACCOUNTS_PURGE_VERSION_KEY = 'algosalon_clean_slate_v5';

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
      console.log(`[AccountRegistry] Cleaned up duplicate accounts. Enforced 1-email-1-account for ${cleanList.length} unique accounts.`);
    }

    // Also check if customer and business localStorage user profiles share the same email
    const custRaw = localStorage.getItem('algosalon_customer');
    const bizRaw = localStorage.getItem('algosalon_business_user');
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
      } catch {
        // ignore
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
        uniqueMap.set(normEmail, {
          ...account,
          email: normEmail,
        });
      } else {
        // If an entry already exists, merge attributes without mutating the fixed role
        // Keep the latest details while maintaining role consistency
        uniqueMap.set(normEmail, {
          ...existing,
          ...account,
          id: existing.id || account.id,
          role: existing.role, // role remains strictly fixed
          email: normEmail,
          appCode: account.appCode || existing.appCode || '1234',
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
  const newAccount: RegisteredAccount = {
    ...accountData,
    id: accountData.id || `${accountData.role === 'customer' ? 'cust' : 'biz'}-${Date.now()}`,
    email: normEmail,
    appCode: accountData.appCode || '1234',
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

  accounts[index] = {
    ...accounts[index],
    ...safeUpdates,
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
    avatar:
      account.avatar ||
      (account.gender === 'Female'
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
    gender: account.gender || 'Male',
    dateOfBirth: account.dateOfBirth || '',
    nationality: account.nationality || '',
    appCode: account.appCode || '1234',
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
    appCode: account.appCode || '1234',
    signUpGmail: account.signUpGmail || account.email,
    isGmailLinked: true,
  };
};
