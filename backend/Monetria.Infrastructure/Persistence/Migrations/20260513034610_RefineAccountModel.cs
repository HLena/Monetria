using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefineAccountModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "Accounts");

            migrationBuilder.RenameColumn(
                name: "Currency",
                table: "Accounts",
                newName: "CurrencyCode");

            migrationBuilder.RenameColumn(
                name: "Bank",
                table: "Accounts",
                newName: "InstitutionName");

            migrationBuilder.AddColumn<int>(
                name: "ClosingDay",
                table: "Accounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ColorCode",
                table: "Accounts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "#000000");

            migrationBuilder.AddColumn<int>(
                name: "DueDay",
                table: "Accounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "Accounts",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Accounts",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Accounts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.Sql(
                """
                UPDATE "Accounts" SET "UpdatedAt" = "CreatedAt";
                UPDATE "Accounts" SET "Type" = 'BankAccount' WHERE "Type" = 'Debit';
                UPDATE "Accounts" SET "Type" = 'CreditCard' WHERE "Type" = 'Credit';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "Accounts" SET "Type" = 'Debit' WHERE "Type" = 'BankAccount';
                UPDATE "Accounts" SET "Type" = 'Credit' WHERE "Type" = 'CreditCard';
                """);

            migrationBuilder.DropColumn(
                name: "ClosingDay",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "ColorCode",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "DueDay",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Accounts");

            migrationBuilder.RenameColumn(
                name: "InstitutionName",
                table: "Accounts",
                newName: "Bank");

            migrationBuilder.RenameColumn(
                name: "CurrencyCode",
                table: "Accounts",
                newName: "Currency");

            migrationBuilder.AddColumn<string>(
                name: "ExpiryDate",
                table: "Accounts",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);
        }
    }
}
