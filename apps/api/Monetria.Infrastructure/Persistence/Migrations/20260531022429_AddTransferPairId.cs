using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTransferPairId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TransferPairId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            // Backfill: convert existing single-row transfers into 2-row pairs.
            // For each outflow row (Type='Transfer', ToAccountId IS NOT NULL, TransferPairId IS NULL):
            //   1. Assigns a new shared pairId to the outflow row.
            //   2. Inserts the missing inflow row with the same pairId.
            migrationBuilder.Sql("""
                WITH pair_ids AS (
                    SELECT "Id", gen_random_uuid() AS "PairId"
                    FROM "Transactions"
                    WHERE "Type" = 'Transfer' AND "ToAccountId" IS NOT NULL AND "TransferPairId" IS NULL
                ),
                update_outflow AS (
                    UPDATE "Transactions" t
                    SET "TransferPairId" = p."PairId"
                    FROM pair_ids p
                    WHERE t."Id" = p."Id"
                    RETURNING t."ToAccountId", t."Amount", t."Description", t."IsActive", t."Date", t."CreatedAt", p."PairId"
                )
                INSERT INTO "Transactions" ("Id", "FromAccountId", "Type", "Amount", "Description", "IsActive", "Date", "CreatedAt", "TransferPairId")
                SELECT gen_random_uuid(), "ToAccountId", 'Transfer', "Amount", "Description", "IsActive", "Date", "CreatedAt", "PairId"
                FROM update_outflow;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove inflow rows created by this migration (no ToAccountId, pairId set).
            migrationBuilder.Sql("""
                DELETE FROM "Transactions"
                WHERE "Type" = 'Transfer' AND "ToAccountId" IS NULL AND "TransferPairId" IS NOT NULL;

                UPDATE "Transactions"
                SET "TransferPairId" = NULL
                WHERE "Type" = 'Transfer';
                """);

            migrationBuilder.DropColumn(
                name: "TransferPairId",
                table: "Transactions");
        }
    }
}
