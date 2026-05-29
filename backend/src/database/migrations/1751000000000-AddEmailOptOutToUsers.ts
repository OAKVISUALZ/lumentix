import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailOptOutToUsers1751000000000 implements MigrationInterface {
  name = 'AddEmailOptOutToUsers1751000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailOptOut" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailOptOut"`);
  }
}
