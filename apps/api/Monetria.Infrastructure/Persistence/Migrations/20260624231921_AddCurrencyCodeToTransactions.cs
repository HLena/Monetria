using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrencyCodeToTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrencyCode",
                table: "Transactions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrencyCode",
                table: "Transactions");
        }
    }
}
