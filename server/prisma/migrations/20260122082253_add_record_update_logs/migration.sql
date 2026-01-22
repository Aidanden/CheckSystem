-- CreateTable
CREATE TABLE "certified_check_print_update_logs" (
    "id" SERIAL NOT NULL,
    "record_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    "update_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" TEXT,

    CONSTRAINT "certified_check_print_update_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "certified_check_print_records" ADD CONSTRAINT "certified_check_print_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certified_check_print_update_logs" ADD CONSTRAINT "certified_check_print_update_logs_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "certified_check_print_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
