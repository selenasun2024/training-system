-- CreateTable
CREATE TABLE `recommendations` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `counselor_id` VARCHAR(36) NOT NULL,
    `type` ENUM('YULIN', 'JINYI') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `leadership` INTEGER NOT NULL DEFAULT 0,
    `innovation` INTEGER NOT NULL DEFAULT 0,
    `execution` INTEGER NOT NULL DEFAULT 0,
    `teamwork` INTEGER NOT NULL DEFAULT 0,
    `reason` TEXT NULL,
    `reviewer_id` VARCHAR(36) NULL,
    `review_comment` TEXT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `recommendations_project_id_idx`(`project_id`),
    INDEX `recommendations_counselor_id_idx`(`counselor_id`),
    INDEX `recommendations_status_idx`(`status`),
    INDEX `recommendations_type_idx`(`type`),
    UNIQUE INDEX `recommendations_project_id_student_id_type_key`(`project_id`, `student_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_performances` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `rank` INTEGER NOT NULL DEFAULT 0,
    `attendance` INTEGER NOT NULL DEFAULT 0,
    `taskCompletion` INTEGER NOT NULL DEFAULT 0,
    `role` VARCHAR(100) NULL,
    `observationTags` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `student_performances_project_id_idx`(`project_id`),
    INDEX `student_performances_student_id_idx`(`student_id`),
    UNIQUE INDEX `student_performances_project_id_student_id_key`(`project_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_counselor_id_fkey` FOREIGN KEY (`counselor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_performances` ADD CONSTRAINT `student_performances_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `training_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_performances` ADD CONSTRAINT `student_performances_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
