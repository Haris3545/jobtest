-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "source" TEXT,
    "description" TEXT,
    "salary" TEXT,
    "openDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "atsScore" INTEGER,
    "atsDetail" TEXT,
    "nextSteps" TEXT,
    "companyBrief" TEXT,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvMaster" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT 'haris_khan_cv.pdf',
    "fileData" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "extractedText" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvVersion" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileData" BYTEA NOT NULL,
    "extractedText" TEXT,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "fileData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchTarget" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "roleQuery" TEXT NOT NULL,
    "targetStartYear" INTEGER,
    "region" TEXT,
    "notes" TEXT,
    "cadenceDays" INTEGER NOT NULL DEFAULT 7,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchFinding" (
    "id" TEXT NOT NULL,
    "watchTargetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "snippet" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "importedJobId" TEXT,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchFinding_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CvVersion" ADD CONSTRAINT "CvVersion_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchFinding" ADD CONSTRAINT "WatchFinding_watchTargetId_fkey" FOREIGN KEY ("watchTargetId") REFERENCES "WatchTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
