-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `department` VARCHAR(100) NULL,
    `position` VARCHAR(100) NULL,
    `level` VARCHAR(20) NULL,
    `hire_date` DATE NULL,
    `last_login_at` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_department_idx`(`department`),
    INDEX `users_level_idx`(`level`),
    INDEX `users_hire_date_idx`(`hire_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role_name` ENUM('admin', 'teacher', 'counselor', 'student', 'observer') NOT NULL,
    `project_id` VARCHAR(36) NULL,
    `granted_by` VARCHAR(36) NOT NULL,
    `granted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',

    INDEX `user_roles_user_id_role_name_idx`(`user_id`, `role_name`),
    INDEX `user_roles_project_id_idx`(`project_id`),
    UNIQUE INDEX `user_roles_user_id_role_name_project_id_key`(`user_id`, `role_name`, `project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_projects` (
    `id` VARCHAR(36) NOT NULL,
    `project_no` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'PLANNING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `current_stage` ENUM('BEFORE', 'DURING', 'AFTER') NOT NULL DEFAULT 'BEFORE',
    `owner_id` VARCHAR(36) NOT NULL,
    `config` JSON NOT NULL,
    `estimated_duration` INTEGER NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `training_projects_project_no_key`(`project_no`),
    INDEX `training_projects_status_idx`(`status`),
    INDEX `training_projects_owner_id_idx`(`owner_id`),
    INDEX `training_projects_current_stage_idx`(`current_stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_stages` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('BEFORE', 'DURING', 'AFTER') NOT NULL,
    `description` TEXT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `estimated_duration` INTEGER NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `config` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `training_stages_project_id_type_idx`(`project_id`, `type`),
    INDEX `training_stages_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_tasks` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `stage_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(50) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `required` BOOLEAN NOT NULL DEFAULT false,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `config` JSON NOT NULL,
    `assigned_to` VARCHAR(36) NULL,
    `reviewer_role` ENUM('COUNSELOR', 'TEACHER', 'ADMIN') NULL,
    `due_date` DATETIME(3) NULL,
    `estimated_hours` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `training_tasks_project_id_stage_id_idx`(`project_id`, `stage_id`),
    INDEX `training_tasks_type_status_idx`(`type`, `status`),
    INDEX `training_tasks_assigned_to_idx`(`assigned_to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_submissions` (
    `id` VARCHAR(36) NOT NULL,
    `task_id` VARCHAR(36) NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `content` TEXT NULL,
    `file_paths` JSON NOT NULL,
    `score` INTEGER NULL,
    `feedback` TEXT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `submitted_at` DATETIME(3) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `reviewer_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `task_submissions_status_idx`(`status`),
    INDEX `task_submissions_student_id_idx`(`student_id`),
    UNIQUE INDEX `task_submissions_task_id_student_id_key`(`task_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_resources` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `type` ENUM('DIGITAL', 'SERVICE', 'SUPPLY') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `spec` VARCHAR(500) NULL,
    `quantity` VARCHAR(50) NULL,
    `unit` VARCHAR(20) NULL,
    `agenda_item` VARCHAR(255) NULL,
    `budget_amount` BIGINT NULL,
    `actual_amount` BIGINT NULL,
    `status` ENUM('PENDING', 'UPLOADED', 'REQUESTED', 'CONFIRMED', 'ORDERED', 'STOCKED', 'DISTRIBUTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `work_order_id` VARCHAR(100) NULL,
    `responsible` VARCHAR(100) NOT NULL,
    `supplier` VARCHAR(255) NULL,
    `upload_time` DATETIME(3) NULL,
    `url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `project_resources_project_id_type_idx`(`project_id`, `type`),
    INDEX `project_resources_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_lines` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `item` VARCHAR(255) NOT NULL,
    `resource_id` VARCHAR(36) NULL,
    `budget_amount` BIGINT NOT NULL,
    `actual_amount` BIGINT NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `budget_lines_project_id_idx`(`project_id`),
    INDEX `budget_lines_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meetings` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `stage_id` VARCHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `meeting_type` VARCHAR(50) NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `location` VARCHAR(255) NULL,
    `online_link` VARCHAR(500) NULL,
    `external_id` VARCHAR(100) NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `meetings_project_id_idx`(`project_id`),
    INDEX `meetings_start_time_end_time_idx`(`start_time`, `end_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agenda_items` (
    `id` VARCHAR(36) NOT NULL,
    `meeting_id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `duration` INTEGER NOT NULL,
    `speaker` VARCHAR(100) NULL,
    `location` VARCHAR(255) NULL,
    `start_time` VARCHAR(10) NULL,
    `end_time` VARCHAR(10) NULL,
    `fixed` BOOLEAN NOT NULL DEFAULT false,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agenda_items_meeting_id_idx`(`meeting_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_participants` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role` ENUM('OWNER', 'TEACHER', 'COUNSELOR', 'STUDENT', 'OBSERVER') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'COMPLETED', 'DROPPED') NOT NULL DEFAULT 'ACTIVE',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,

    INDEX `project_participants_project_id_role_idx`(`project_id`, `role`),
    INDEX `project_participants_user_id_idx`(`user_id`),
    UNIQUE INDEX `project_participants_project_id_user_id_key`(`project_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` VARCHAR(36) NOT NULL,
    `task_id` VARCHAR(36) NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `type` ENUM('CHECK_IN', 'CHECK_OUT') NOT NULL,
    `method` ENUM('QR_CODE', 'LOCATION', 'FACE', 'MANUAL') NOT NULL,
    `location` JSON NULL,
    `device_info` JSON NULL,
    `check_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'LEAVE') NOT NULL DEFAULT 'PRESENT',
    `notes` TEXT NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendance_records_task_id_student_id_idx`(`task_id`, `student_id`),
    INDEX `attendance_records_check_time_idx`(`check_time`),
    INDEX `attendance_records_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `observation_records` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `observer_id` VARCHAR(36) NOT NULL,
    `type` ENUM('DAILY', 'WEEKLY', 'MILESTONE', 'SPECIAL') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `attachments` JSON NOT NULL,
    `tags` JSON NOT NULL,
    `score` INTEGER NULL,
    `visibility` ENUM('PRIVATE', 'TEACHER', 'PUBLIC') NOT NULL DEFAULT 'TEACHER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `observation_records_project_id_student_id_idx`(`project_id`, `student_id`),
    INDEX `observation_records_observer_id_idx`(`observer_id`),
    INDEX `observation_records_type_idx`(`type`),
    INDEX `observation_records_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stage_templates` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('BEFORE', 'DURING', 'AFTER') NOT NULL,
    `description` TEXT NULL,
    `config` JSON NOT NULL,
    `task_templates` JSON NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stage_templates_type_idx`(`type`),
    INDEX `stage_templates_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_templates` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `config` JSON NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `estimated_hours` INTEGER NULL,
    `category` VARCHAR(100) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `task_templates_type_idx`(`type`),
    INDEX `task_templates_category_idx`(`category`),
    INDEX `task_templates_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `type` ENUM('SYSTEM', 'PROJECT', 'TASK', 'OBSERVATION', 'MEETING') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `data` JSON NULL,
    `channels` JSON NOT NULL,
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `read_at` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_read_at_idx`(`user_id`, `read_at`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `growth_profiles` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `skills` JSON NOT NULL,
    `achievements` JSON NOT NULL,
    `learning_goals` JSON NOT NULL,
    `progress` JSON NOT NULL,
    `feedback` JSON NOT NULL,
    `certifications` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `growth_profiles_user_id_idx`(`user_id`),
    INDEX `growth_profiles_project_id_idx`(`project_id`),
    UNIQUE INDEX `growth_profiles_user_id_project_id_key`(`user_id`, `project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_integrations` (
    `id` VARCHAR(36) NOT NULL,
    `type` ENUM('HR', 'WECHAT', 'CALENDAR', 'EMAIL', 'SMS') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `config` JSON NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ERROR') NOT NULL DEFAULT 'ACTIVE',
    `last_sync` DATETIME(3) NULL,
    `sync_status` ENUM('SUCCESS', 'FAILED', 'PARTIAL') NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `system_integrations_type_idx`(`type`),
    INDEX `system_integrations_status_idx`(`status`),
    INDEX `system_integrations_last_sync_idx`(`last_sync`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_granted_by_fkey` FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_projects` ADD CONSTRAINT `training_projects_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_stages` ADD CONSTRAINT `training_stages_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_tasks` ADD CONSTRAINT `training_tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_tasks` ADD CONSTRAINT `training_tasks_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `training_stages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_tasks` ADD CONSTRAINT `training_tasks_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submissions` ADD CONSTRAINT `task_submissions_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `training_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submissions` ADD CONSTRAINT `task_submissions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submissions` ADD CONSTRAINT `task_submissions_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_resources` ADD CONSTRAINT `project_resources_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_lines` ADD CONSTRAINT `budget_lines_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_lines` ADD CONSTRAINT `budget_lines_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `project_resources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `training_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_items` ADD CONSTRAINT `agenda_items_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_participants` ADD CONSTRAINT `project_participants_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_participants` ADD CONSTRAINT `project_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `training_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observation_records` ADD CONSTRAINT `observation_records_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observation_records` ADD CONSTRAINT `observation_records_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observation_records` ADD CONSTRAINT `observation_records_observer_id_fkey` FOREIGN KEY (`observer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stage_templates` ADD CONSTRAINT `stage_templates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_templates` ADD CONSTRAINT `task_templates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `growth_profiles` ADD CONSTRAINT `growth_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `growth_profiles` ADD CONSTRAINT `growth_profiles_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
