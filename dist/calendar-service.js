import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { AccountStorage } from "./account-storage.js";
import { CalendarOAuthFlow } from "./calendar-oauth-flow.js";
export class CalendarService {
    accountStorage = new AccountStorage();
    calendarClients = new Map();
    /** Re-run the OAuth flow for an existing account and replace its refresh token. */
    async reauthAccount(email, manual = false) {
        const account = this.accountStorage.getAccount(email);
        if (!account) {
            throw new Error(`Account '${email}' not found`);
        }
        const oauthFlow = new CalendarOAuthFlow(account.oauth2.clientId, account.oauth2.clientSecret);
        const refreshToken = await oauthFlow.authorize(manual);
        await this.verifyIdentity(email, account.oauth2.clientId, account.oauth2.clientSecret, refreshToken);
        this.accountStorage.addAccount({
            email,
            oauth2: { clientId: account.oauth2.clientId, clientSecret: account.oauth2.clientSecret, refreshToken },
        });
        this.calendarClients.delete(email);
    }
    async addAccount(email, clientId, clientSecret, manual = false) {
        if (this.accountStorage.hasAccount(email)) {
            throw new Error(`Account '${email}' already exists`);
        }
        const oauthFlow = new CalendarOAuthFlow(clientId, clientSecret);
        const refreshToken = await oauthFlow.authorize(manual);
        await this.verifyIdentity(email, clientId, clientSecret, refreshToken);
        const account = {
            email,
            oauth2: { clientId, clientSecret, refreshToken },
        };
        this.accountStorage.addAccount(account);
    }
    deleteAccount(email) {
        this.calendarClients.delete(email);
        return this.accountStorage.deleteAccount(email);
    }
    listAccounts() {
        return this.accountStorage.getAllAccounts();
    }
    setCredentials(clientId, clientSecret) {
        this.accountStorage.setCredentials(clientId, clientSecret);
    }
    getCredentials() {
        return this.accountStorage.getCredentials();
    }
    /** Ensure the Google account that granted the token is the one we are about to store it under. */
    async verifyIdentity(email, clientId, clientSecret, refreshToken) {
        const oauth2Client = new OAuth2Client(clientId, clientSecret, "http://localhost");
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        // The primary calendar's id is the account's email address.
        const primary = await calendar.calendars.get({ calendarId: "primary" });
        const actual = primary.data.id || "";
        if (actual.toLowerCase() !== email.toLowerCase()) {
            throw new Error(`Authorized as '${actual}' but expected '${email}'. Token not saved.`);
        }
    }
    getCalendarClient(email) {
        if (!this.calendarClients.has(email)) {
            const account = this.accountStorage.getAccount(email);
            if (!account) {
                throw new Error(`Account '${email}' not found`);
            }
            const oauth2Client = new OAuth2Client(account.oauth2.clientId, account.oauth2.clientSecret, "http://localhost");
            oauth2Client.setCredentials({
                refresh_token: account.oauth2.refreshToken,
                access_token: account.oauth2.accessToken,
            });
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });
            this.calendarClients.set(email, calendar);
        }
        return this.calendarClients.get(email);
    }
    async listCalendars(email) {
        const calendar = this.getCalendarClient(email);
        const response = await calendar.calendarList.list();
        return response.data.items || [];
    }
    async getCalendarAcl(email, calendarId) {
        const calendar = this.getCalendarClient(email);
        const response = await calendar.acl.list({ calendarId });
        return response.data.items || [];
    }
    async listEvents(email, calendarId, options = {}) {
        const calendar = this.getCalendarClient(email);
        const response = await calendar.events.list({
            calendarId,
            timeMin: options.timeMin,
            timeMax: options.timeMax,
            maxResults: options.maxResults || 10,
            pageToken: options.pageToken,
            q: options.query,
            singleEvents: true,
            orderBy: "startTime",
        });
        return {
            events: response.data.items || [],
            nextPageToken: response.data.nextPageToken || undefined,
        };
    }
    async getEvent(email, calendarId, eventId) {
        const calendar = this.getCalendarClient(email);
        const response = await calendar.events.get({
            calendarId,
            eventId,
        });
        return response.data;
    }
    async createEvent(email, calendarId, event) {
        const calendar = this.getCalendarClient(email);
        const eventBody = {
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: event.allDay ? { date: event.start } : { dateTime: event.start },
            end: event.allDay ? { date: event.end } : { dateTime: event.end },
            attendees: event.attendees?.map((e) => ({ email: e })),
        };
        const response = await calendar.events.insert({
            calendarId,
            requestBody: eventBody,
        });
        return response.data;
    }
    async updateEvent(email, calendarId, eventId, updates) {
        const calendar = this.getCalendarClient(email);
        // Get existing event first
        const existing = await this.getEvent(email, calendarId, eventId);
        const eventBody = {
            ...existing,
            summary: updates.summary ?? existing.summary,
            description: updates.description ?? existing.description,
            location: updates.location ?? existing.location,
        };
        if (updates.start !== undefined) {
            eventBody.start = updates.allDay ? { date: updates.start } : { dateTime: updates.start };
        }
        if (updates.end !== undefined) {
            eventBody.end = updates.allDay ? { date: updates.end } : { dateTime: updates.end };
        }
        if (updates.attendees !== undefined) {
            eventBody.attendees = updates.attendees.map((e) => ({ email: e }));
        }
        const response = await calendar.events.update({
            calendarId,
            eventId,
            requestBody: eventBody,
        });
        return response.data;
    }
    async deleteEvent(email, calendarId, eventId) {
        const calendar = this.getCalendarClient(email);
        await calendar.events.delete({
            calendarId,
            eventId,
        });
    }
    async getFreeBusy(email, calendarIds, timeMin, timeMax) {
        const calendar = this.getCalendarClient(email);
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                items: calendarIds.map((id) => ({ id })),
            },
        });
        const result = new Map();
        const calendars = response.data.calendars || {};
        for (const [calId, data] of Object.entries(calendars)) {
            const busy = (data.busy || []).map((b) => ({
                start: b.start || "",
                end: b.end || "",
            }));
            result.set(calId, busy);
        }
        return result;
    }
}
//# sourceMappingURL=calendar-service.js.map