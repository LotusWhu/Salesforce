import { Global, Module } from "@nestjs/common";
import { OtpService } from "./services/otp.service";
import { GoogleCalendarService } from "./services/google-calendar.service";
import { StripeService } from "./services/stripe.service";
import { NotificationsService } from "./services/notifications.service";

@Global()
@Module({
  providers: [OtpService, GoogleCalendarService, StripeService, NotificationsService],
  exports: [OtpService, GoogleCalendarService, StripeService, NotificationsService],
})
export class CommonModule {}
