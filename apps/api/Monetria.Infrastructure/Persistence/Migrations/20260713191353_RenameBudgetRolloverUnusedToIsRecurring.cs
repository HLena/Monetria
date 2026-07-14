using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameBudgetRolloverUnusedToIsRecurring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RolloverUnused",
                table: "Budgets",
                newName: "IsRecurring");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsRecurring",
                table: "Budgets",
                newName: "RolloverUnused");
        }
    }
}
