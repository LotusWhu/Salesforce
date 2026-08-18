import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google } from "googleapis";

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  location?: string;
  attendeeEmails?: string[];
}

/**
 * 封装 Google Calendar OAuth 授权与日程事件的创建/更新/删除，
 * 用于「上门服务预约」模块把预约时段同步进服务提供者的 Google 日历。
 */
@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly config: ConfigService) {}

  private getOAuthClient() {
    return new google.auth.OAuth2(
      this.config.get<string>("GOOGLE_CLIENT_ID"),
      this.config.get<string>("GOOGLE_CLIENT_SECRET"),
      this.config.get<string>("GOOGLE_OAUTH_REDIRECT_URL"),
    );
  }

  getAuthUrl(state: string): string {
    const client = this.getOAuthClient();
    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state,
    });
  }

  async exchangeCodeForRefreshToken(code: string): Promise<string | null> {
    const client = this.getOAuthClient();
    const { tokens } = await client.getToken(code);
    return tokens.refresh_token ?? null;
  }

  private async getCalendarClient(refreshToken: string) {
    const client = this.getOAuthClient();
    client.setCredentials({ refresh_token: refreshToken });
    return google.calendar({ version: "v3", auth: client });
  }

  async createEvent(refreshToken: string, input: CalendarEventInput): Promise<string | null> {
    if (!refreshToken) {
      this.logger.warn("未连接 Google Calendar，跳过日程创建");
      return null;
    }
    try {
      const calendar = await this.getCalendarClient(refreshToken);
      const { data } = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: input.summary,
          description: input.description,
          location: input.location,
          start: { dateTime: input.startIso },
          end: { dateTime: input.endIso },
          attendees: input.attendeeEmails?.map((email) => ({ email })),
          reminders: {
            useDefault: false,
            overrides: [{ method: "popup", minutes: 60 }],
          },
        },
      });
      return data.id ?? null;
    } catch (err) {
      this.logger.error(`创建 Google Calendar 事件失败: ${(err as Error).message}`);
      return null;
    }
  }

  async deleteEvent(refreshToken: string, eventId: string): Promise<void> {
    try {
      const calendar = await this.getCalendarClient(refreshToken);
      await calendar.events.delete({ calendarId: "primary", eventId });
    } catch (err) {
      this.logger.error(`删除 Google Calendar 事件失败: ${(err as Error).message}`);
    }
  }
}
