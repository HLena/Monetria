using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monetria.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexRecurringOccurrenceScheduledDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RecurringOccurrences_RecurringId",
                table: "RecurringOccurrences");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringOccurrences_RecurringId_ScheduledDate",
                table: "RecurringOccurrences",
                columns: new[] { "RecurringId", "ScheduledDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RecurringOccurrences_RecurringId_ScheduledDate",
                table: "RecurringOccurrences");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringOccurrences_RecurringId",
                table: "RecurringOccurrences",
                column: "RecurringId");
        }
    }
}
