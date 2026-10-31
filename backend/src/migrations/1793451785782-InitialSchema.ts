import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793451785782 implements MigrationInterface {
    name = 'InitialSchema1793451785782'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8b0be371d28245da6e4f4b6187\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`products\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(150) NOT NULL, \`price\` decimal(10,2) NOT NULL, \`quantity\` int NOT NULL DEFAULT '0', \`alertThreshold\` int NOT NULL DEFAULT '5', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`categoryId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sales\` (\`id\` int NOT NULL AUTO_INCREMENT, \`total\` decimal(12,2) NOT NULL DEFAULT '0.00', \`status\` enum ('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED', \`cancelledAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sale_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` int NOT NULL, \`unitPrice\` decimal(10,2) NOT NULL, \`saleId\` int NOT NULL, \`productId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_movements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('IN', 'OUT', 'ADJUSTMENT') NOT NULL, \`quantity\` int NOT NULL, \`reason\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`productId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('MANAGER', 'SELLER') NOT NULL DEFAULT 'SELLER', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_ff56834e735fa78a15d0cf21926\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sale_items\` ADD CONSTRAINT \`FK_c642be08de5235317d4cf3deb40\` FOREIGN KEY (\`saleId\`) REFERENCES \`sales\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sale_items\` ADD CONSTRAINT \`FK_d675aea38a16313e844662c48f8\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_a3acb59db67e977be45e382fc56\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_a3acb59db67e977be45e382fc56\``);
        await queryRunner.query(`ALTER TABLE \`sale_items\` DROP FOREIGN KEY \`FK_d675aea38a16313e844662c48f8\``);
        await queryRunner.query(`ALTER TABLE \`sale_items\` DROP FOREIGN KEY \`FK_c642be08de5235317d4cf3deb40\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_ff56834e735fa78a15d0cf21926\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`stock_movements\``);
        await queryRunner.query(`DROP TABLE \`sale_items\``);
        await queryRunner.query(`DROP TABLE \`sales\``);
        await queryRunner.query(`DROP TABLE \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_8b0be371d28245da6e4f4b6187\` ON \`categories\``);
        await queryRunner.query(`DROP TABLE \`categories\``);
    }

}
