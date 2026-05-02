using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(MonetriaDbContext))]
    [Migration("20260502030000_RemoveTransferCategory")]
    public partial class RemoveTransferCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111121"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns:
                [
                    "Id",
                    "Color",
                    "CreatedAt",
                    "IsActive",
                    "IsDefault",
                    "Name",
                    "Type",
                    "UpdatedAt",
                    "UserId"
                ],
                values:
                [
                    new Guid("11111111-1111-1111-1111-111111111121"),
                    "#0EA5E9",
                    new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    true,
                    true,
                    "Transferencias",
                    "Transfer",
                    new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    null
                ]);
        }
    }
}
