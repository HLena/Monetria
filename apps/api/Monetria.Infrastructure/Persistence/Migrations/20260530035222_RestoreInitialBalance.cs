using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RestoreInitialBalance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "InitialBalance",
                table: "Accounts",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InitialBalance",
                table: "Accounts");
        }
    }
}
