
// src/lib/seller-utils.ts
import type { User } from './types';

/**
 * A utility function to determine if a user has permission to sell.
 * This can be used on the client-side to control UI elements.
 * @param user The authenticated user object, which should include sellerSettings.
 * @returns boolean
 */
export function canUserSell(user: User | null): boolean {
    if (!user) {
        return false;
    }

    const settings = user.sellerSettings;

    if (!settings) {
        // Default to false if settings are not loaded for some reason
        return user.role === 'admin';
    }
    
    switch (settings.mode) {
        case 'admins_only':
            return user.role === 'admin';
        case 'all_users':
            return true;
        case 'specific_users':
            return user.role === 'admin' || (settings.allowed_sellers && settings.allowed_sellers[user.id] === true);
        default:
            return false;
    }
}
