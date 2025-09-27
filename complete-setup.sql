-- ===========================================
-- TSF POLICE LMS - COMPLETE DATABASE SETUP
-- ===========================================

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'COMMANDER', 'TRAINEE');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "CourseModality" AS ENUM ('E_LEARNING', 'CLASSROOM', 'BLENDED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'MSQ', 'TRUEFALSE', 'NUMERIC', 'SHORT');
CREATE TYPE "ModuleKind" AS ENUM ('VIDEO', 'PDF', 'H5P', 'SCORM', 'QUIZ');
CREATE TYPE "SessionMode" AS ENUM ('CLASSROOM', 'FIELD');
CREATE TYPE "AttendancePolicy" AS ENUM ('MANUAL', 'QR_CODE');

-- Create tables
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "qid" TEXT,
    "badgeNo" TEXT,
    "rank" TEXT,
    "unit" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TRAINEE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "summaryAr" TEXT,
    "summaryEn" TEXT,
    "modality" "CourseModality" NOT NULL,
    "durationMins" INTEGER NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- Insert Super Admin User
INSERT INTO "User" (id, "firstName", "lastName", email, password, role, status, "createdAt", "updatedAt") VALUES
('super-admin-1', 'Super', 'Admin', 'super@kbn.local', '$2a$10$P8nK1rWDNPYuJcLnVXywXOoORv/9FvkSD9Q/XwT3NHgXxo7sktRBa', 'SUPER_ADMIN', 'ACTIVE', NOW(), NOW());

-- Insert sample data
INSERT INTO "Course" (id, code, "titleAr", "titleEn", "summaryAr", "summaryEn", modality, "durationMins", status, version, "createdBy", "createdAt", "updatedAt") VALUES
('course-1', 'POL101', 'مقدمة في العمل الشرطي', 'Introduction to Police Work', 'مقدمة شاملة في العمل الشرطي', 'Comprehensive introduction to police work', 'E_LEARNING', 180, 'PUBLISHED', '1.0', 'super-admin-1', NOW(), NOW()),
('course-2', 'SEC201', 'مفاهيم الأمن العام', 'Public Security Concepts', 'مفاهيم أساسية في الأمن العام', 'Basic concepts in public security', 'CLASSROOM', 240, 'PUBLISHED', '1.0', 'super-admin-1', NOW(), NOW());

COMMIT;
