import { Global, Module } from "@nestjs/common";
import { OtpService } from "./services/otp.service";
import { GoogleCalendarService } from "./services/google-calendar.service";
import { StripeService } from "./services/stripe.service";
import { NotificationsService } from "./services/notifications.service";
import { ExpoPushService } from "./services/expo-push.service";

@Global()
@Module({
  providers: [OtpService, GoogleCalendarService, StripeService, NotificationsService, ExpoPushService],
  exports: [OtpService, GoogleCalendarService, StripeService, NotificationsService, ExpoPushService],
})
export class CommonModule {}
