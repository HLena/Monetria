using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIdToUserCategoryPreference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserCategoryPreferences",
                table: "UserCategoryPreferences");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "UserCategoryPreferences",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.Sql(
                "UPDATE \"UserCategoryPreferences\" SET \"Id\" = gen_random_uuid()");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserCategoryPreferences",
                table: "UserCategoryPreferences",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryPreferences_UserId_CategoryId",
                table: "UserCategoryPreferences",
                columns: new[] { "UserId", "CategoryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserCategoryPreferences",
                table: "UserCategoryPreferences");

            migrationBuilder.DropIndex(
                name: "IX_UserCategoryPreferences_UserId_CategoryId",
                table: "UserCategoryPreferences");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "UserCategoryPreferences");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserCategoryPreferences",
                table: "UserCategoryPreferences",
                columns: new[] { "UserId", "CategoryId" });
        }
    }
}
