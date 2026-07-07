using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddThemeAndPhoneToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "Users",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "light");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Theme",
                table: "Users");
        }
    }
}
