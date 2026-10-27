using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserCategoryPreference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserCategoryPreferences",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCategoryPreferences", x => new { x.UserId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_UserCategoryPreferences_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCategoryPreferences_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryPreferences_CategoryId",
                table: "UserCategoryPreferences",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryPreferences_UserId",
                table: "UserCategoryPreferences",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserCategoryPreferences");
        }
    }
}
