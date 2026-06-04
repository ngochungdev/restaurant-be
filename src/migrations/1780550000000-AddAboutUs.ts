import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAboutUs1780550000000 implements MigrationInterface {
  name = 'AddAboutUs1780550000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "about_us" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "image" character varying,
        CONSTRAINT "PK_about_us_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "about_us"
      ALTER COLUMN "image" DROP NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "about_us"');
  }
}
