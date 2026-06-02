import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadsAndRestaurantSettings1780380000000
  implements MigrationInterface
{
  name = 'AddLeadsAndRestaurantSettings1780380000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" SERIAL NOT NULL,
        "restaurantName" character varying NOT NULL,
        "contactName" character varying NOT NULL,
        "email" character varying,
        "phone" character varying NOT NULL,
        "website" character varying,
        "message" text,
        "source" character varying,
        "status" character varying NOT NULL DEFAULT 'NEW',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leads_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "heroImage" character varying,
      ADD COLUMN IF NOT EXISTS "fullAddress" character varying,
      ADD COLUMN IF NOT EXISTS "zalo" character varying,
      ADD COLUMN IF NOT EXISTS "brandColor" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "settings"
      ALTER COLUMN "restaurantName" SET DEFAULT 'Bella Restaurant',
      ALTER COLUMN "logo" DROP NOT NULL,
      ALTER COLUMN "address" DROP NOT NULL,
      ALTER COLUMN "hotline" DROP NOT NULL,
      ALTER COLUMN "openingHours" DROP NOT NULL,
      ALTER COLUMN "facebook" DROP NOT NULL,
      ALTER COLUMN "instagram" DROP NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "settings"
      ALTER COLUMN "instagram" SET NOT NULL,
      ALTER COLUMN "facebook" SET NOT NULL,
      ALTER COLUMN "openingHours" SET NOT NULL,
      ALTER COLUMN "hotline" SET NOT NULL,
      ALTER COLUMN "address" SET NOT NULL,
      ALTER COLUMN "logo" SET NOT NULL,
      ALTER COLUMN "restaurantName" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "brandColor",
      DROP COLUMN IF EXISTS "zalo",
      DROP COLUMN IF EXISTS "fullAddress",
      DROP COLUMN IF EXISTS "heroImage"
    `);

    await queryRunner.query('DROP TABLE IF EXISTS "leads"');
  }
}
