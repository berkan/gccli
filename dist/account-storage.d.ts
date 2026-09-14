import type { CalendarAccount } from "./types.js";
export declare class AccountStorage {
    private accounts;
    constructor();
    private ensureConfigDir;
    private loadAccounts;
    private saveAccounts;
    addAccount(account: CalendarAccount): void;
    getAccount(email: string): CalendarAccount | undefined;
    getAllAccounts(): CalendarAccount[];
    deleteAccount(email: string): boolean;
    hasAccount(email: string): boolean;
    setCredentials(clientId: string, clientSecret: string): void;
    getCredentials(): {
        clientId: string;
        clientSecret: string;
    } | null;
}
//# sourceMappingURL=account-storage.d.ts.map