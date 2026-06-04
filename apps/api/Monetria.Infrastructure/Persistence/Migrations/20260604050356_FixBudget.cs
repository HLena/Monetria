using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixBudget : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Budgets_UserId",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "Period",
                table: "Budgets");

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "SavingsGoals",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "LinkedAccountId",
                table: "SavingsGoals",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AccountId",
                table: "Debts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "Debts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Debts",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "Budgets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "Month",
                table: "Budgets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RolloverUnused",
                table: "Budgets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Budgets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_SavingsGoals_LinkedAccountId",
                table: "SavingsGoals",
                column: "LinkedAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Debts_AccountId",
                table: "Debts",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Debts_CategoryId",
                table: "Debts",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_CategoryId",
                table: "Budgets",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_UserId_CategoryId_Month_Year",
                table: "Budgets",
                columns: new[] { "UserId", "CategoryId", "Month", "Year" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Budgets_Categories_CategoryId",
                table: "Budgets",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Debts_Accounts_AccountId",
                table: "Debts",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Debts_Categories_CategoryId",
                table: "Debts",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SavingsGoals_Accounts_LinkedAccountId",
                table: "SavingsGoals",
                column: "LinkedAccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Budgets_Categories_CategoryId",
                table: "Budgets");

            migrationBuilder.DropForeignKey(
                name: "FK_Debts_Accounts_AccountId",
                table: "Debts");

            migrationBuilder.DropForeignKey(
                name: "FK_Debts_Categories_CategoryId",
                table: "Debts");

            migrationBuilder.DropForeignKey(
                name: "FK_SavingsGoals_Accounts_LinkedAccountId",
                table: "SavingsGoals");

            migrationBuilder.DropIndex(
                name: "IX_SavingsGoals_LinkedAccountId",
                table: "SavingsGoals");

            migrationBuilder.DropIndex(
                name: "IX_Debts_AccountId",
                table: "Debts");

            migrationBuilder.DropIndex(
                name: "IX_Debts_CategoryId",
                table: "Debts");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_CategoryId",
                table: "Budgets");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_UserId_CategoryId_Month_Year",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "SavingsGoals");

            migrationBuilder.DropColumn(
                name: "LinkedAccountId",
                table: "SavingsGoals");

            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "Debts");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Debts");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Debts");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "Month",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "RolloverUnused",
                table: "Budgets");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "Budgets");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Budgets",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Period",
                table: "Budgets",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_UserId",
                table: "Budgets",
                column: "UserId");
        }
    }
}
