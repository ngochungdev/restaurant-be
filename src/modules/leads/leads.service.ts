import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrevoMailService } from '../../common/mail/brevo-mail.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    private readonly brevoMailService: BrevoMailService,
    private readonly configService: ConfigService,
  ) {}

  async create(createLeadDto: CreateLeadDto) {
    const lead = this.leadsRepository.create(createLeadDto);
    const savedLead = await this.leadsRepository.save(lead);

    await this.sendLeadNotification(savedLead);

    return savedLead;
  }

  findAll() {
    return this.leadsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const lead = await this.leadsRepository.findOne({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException(`Lead #${id} not found`);
    }

    return lead;
  }

  async update(id: number, updateLeadDto: UpdateLeadDto) {
    await this.leadsRepository.update(id, updateLeadDto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.leadsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Lead #${id} not found`);
    }

    return { deleted: true };
  }

  private sendLeadNotification(lead: Lead) {
    const adminEmail =
      this.configService.get<string>('LEAD_ADMIN_EMAIL') ||
      this.configService.get<string>('RESERVATION_ADMIN_EMAIL');

    if (!adminEmail) return Promise.resolve(false);

    return this.brevoMailService.sendMail({
      to: adminEmail,
      subject: `New demo request from ${lead.restaurantName}`,
      htmlContent: this.buildLeadEmailHtml(lead),
      textContent: this.buildLeadEmailText(lead),
    });
  }

  private buildLeadEmailHtml(lead: Lead) {
    const rows = [
      ['Restaurant', lead.restaurantName],
      ['Contact', lead.contactName],
      ['Phone', lead.phone],
      ['Email', lead.email],
      ['Website', lead.website],
      ['Source', lead.source],
      ['Message', lead.message],
    ];

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1c1917;">
        <h2 style="margin-bottom: 12px;">New restaurant website demo request</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
          <tbody>
            ${rows
              .filter((row): row is [string, string] => Boolean(row[1]))
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="border: 1px solid #e7e5e4; padding: 8px; font-weight: 700;">${label}</td>
                    <td style="border: 1px solid #e7e5e4; padding: 8px;">${this.escapeHtml(value)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private buildLeadEmailText(lead: Lead) {
    return [
      'New restaurant website demo request',
      `Restaurant: ${lead.restaurantName}`,
      `Contact: ${lead.contactName}`,
      `Phone: ${lead.phone}`,
      lead.email ? `Email: ${lead.email}` : undefined,
      lead.website ? `Website: ${lead.website}` : undefined,
      lead.source ? `Source: ${lead.source}` : undefined,
      lead.message ? `Message: ${lead.message}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
