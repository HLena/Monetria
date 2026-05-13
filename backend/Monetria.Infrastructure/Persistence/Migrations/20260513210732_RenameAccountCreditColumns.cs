using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameAccountCreditColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ClosingDay",
                table: "Accounts",
                newName: "StatementClosingDay");

            migrationBuilder.RenameColumn(
                name: "DueDay",
                table: "Accounts",
                newName: "PaymentDueDay");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StatementClosingDay",
                table: "Accounts",
                newName: "ClosingDay");

            migrationBuilder.RenameColumn(
                name: "PaymentDueDay",
                table: "Accounts",
                newName: "DueDay");
        }
    }
}
