import { type calendar_v3 } from "googleapis";
import type { CalendarAccount } from "./types.js";
type CalendarEvent = calendar_v3.Schema$Event;
type Calendar = calendar_v3.Schema$CalendarListEntry;
export interface EventSearchResult {
    events: CalendarEvent[];
    nextPageToken?: string;
}
export declare class CalendarService {
    private accountStorage;
    private calendarClients;
    /** Re-run the OAuth flow for an existing account and replace its refresh token. */
    reauthAccount(email: string, manual?: boolean): Promise<void>;
    addAccount(email: string, clientId: string, clientSecret: string, manual?: boolean): Promise<void>;
    deleteAccount(email: string): boolean;
    listAccounts(): CalendarAccount[];
    setCredentials(clientId: string, clientSecret: string): void;
    getCredentials(): {
        clientId: string;
        clientSecret: string;
    } | null;
    /** Ensure the Google account that granted the token is the one we are about to store it under. */
    private verifyIdentity;
    private getCalendarClient;
    listCalendars(email: string): Promise<Calendar[]>;
    getCalendarAcl(email: string, calendarId: string): Promise<calendar_v3.Schema$AclRule[]>;
    listEvents(email: string, calendarId: string, options?: {
        timeMin?: string;
        timeMax?: string;
        maxResults?: number;
        pageToken?: string;
        query?: string;
    }): Promise<EventSearchResult>;
    getEvent(email: string, calendarId: string, eventId: string): Promise<CalendarEvent>;
    createEvent(email: string, calendarId: string, event: {
        summary: string;
        description?: string;
        location?: string;
        start: string;
        end: string;
        attendees?: string[];
        allDay?: boolean;
    }): Promise<CalendarEvent>;
    updateEvent(email: string, calendarId: string, eventId: string, updates: {
        summary?: string;
        description?: string;
        location?: string;
        start?: string;
        end?: string;
        attendees?: string[];
        allDay?: boolean;
    }): Promise<CalendarEvent>;
    deleteEvent(email: string, calendarId: string, eventId: string): Promise<void>;
    getFreeBusy(email: string, calendarIds: string[], timeMin: string, timeMax: string): Promise<Map<string, Array<{
        start: string;
        end: string;
    }>>>;
}
export {};
//# sourceMappingURL=calendar-service.d.ts.map