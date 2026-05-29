import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendMailPayload = {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

@Injectable()
export class BrevoMailService {
  private readonly logger = new Logger(BrevoMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMail(payload: SendMailPayload): Promise<boolean> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
    const senderName =
      this.configService.get<string>('BREVO_SENDER_NAME') || 'Restaurant';

    if (!apiKey || !senderEmail) {
      this.logger.warn('Brevo email is not configured; skipping email send');
      return false;
    }

    if (!payload.to) {
      this.logger.warn('Email recipient is missing; skipping email send');
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: senderEmail,
            name: senderName,
          },
          to: [
            {
              email: payload.to,
              name: payload.toName,
            },
          ],
          subject: payload.subject,
          htmlContent: payload.htmlContent,
          textContent: payload.textContent,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.warn(
          `Brevo email failed with ${response.status}: ${errorBody}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(
        `Brevo email request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
