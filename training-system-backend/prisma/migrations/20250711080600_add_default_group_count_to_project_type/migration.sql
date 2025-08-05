/*
  Warnings:

  - Added the required column `type` to the `training_projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `training_projects` ADD COLUMN `type` VARCHAR(36) NOT NULL;

-- CreateTable
CREATE TABLE `project_types` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `remind_days` INTEGER NOT NULL DEFAULT 7,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `icon` VARCHAR(100) NULL,
    `color` VARCHAR(20) NULL,
    `default_group_count` INTEGER NOT NULL DEFAULT 3,
    `config` JSON NOT NULL,
    `stage_template_ids` JSON NOT NULL,
    `task_template_ids` JSON NOT NULL,
    `filter_rules` JSON NOT NULL,
    `allow_manual_add` BOOLEAN NOT NULL DEFAULT true,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_types_code_key`(`code`),
    INDEX `project_types_code_idx`(`code`),
    INDEX `project_types_enabled_idx`(`enabled`),
    INDEX `project_types_order_index_idx`(`order_index`),
    INDEX `project_types_is_system_idx`(`is_system`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_type_filter_rules` (
    `id` VARCHAR(36) NOT NULL,
    `project_type_id` VARCHAR(36) NOT NULL,
    `rule_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `conditions` JSON NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `project_type_filter_rules_project_type_id_idx`(`project_type_id`),
    INDEX `project_type_filter_rules_enabled_idx`(`enabled`),
    INDEX `project_type_filter_rules_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_groups` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `training_groups_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_members` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `group_id` VARCHAR(36) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `group_members_user_id_idx`(`user_id`),
    INDEX `group_members_group_id_idx`(`group_id`),
    UNIQUE INDEX `group_members_user_id_group_id_key`(`user_id`, `group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `training_projects_type_idx` ON `training_projects`(`type`);

-- AddForeignKey
ALTER TABLE `project_types` ADD CONSTRAINT `project_types_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_type_filter_rules` ADD CONSTRAINT `project_type_filter_rules_project_type_id_fkey` FOREIGN KEY (`project_type_id`) REFERENCES `project_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_projects` ADD CONSTRAINT `training_projects_type_fkey` FOREIGN KEY (`type`) REFERENCES `project_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_groups` ADD CONSTRAINT `training_groups_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `training_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
