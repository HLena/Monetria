using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Monetria.Application.Auth;
using Monetria.API.Responses;
using Monetria.Infrastructure.Persistence;

namespace Monetria.Tests;

public sealed class AuthTests : IDisposable
{
    private const string Password = "SecurePassword123";
    private readonly MonetriaApiFactory factory = new();

    [Fact]
    public async Task RegisterAsync_CreatesUserWithHashedPasswordAndReturnsToken()
    {
        var client = factory.CreateClient();
        var request = new RegisterRequest("Test", "User", "test@example.com", Password);

        var response = await client.PostAsJsonAsync("/auth/register", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<AuthSessionResponse>();
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload.Token));
        Assert.Equal("test@example.com", payload.User.Email);
        Assert.Equal("Test", payload.User.FirstName);
        Assert.Equal("User", payload.User.LastName);

        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<MonetriaDbContext>();
        var user = await dbContext.Users.SingleAsync(user => user.Email == "test@example.com");

        Assert.NotEqual(Password, user.PasswordHash);
        Assert.False(string.IsNullOrWhiteSpace(user.PasswordHash));
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsToken()
    {
        var client = factory.CreateClient();
        var registerRequest = new RegisterRequest("Login", "User", "login@example.com", Password);
        await client.PostAsJsonAsync("/auth/register", registerRequest);
        var loginRequest = new LoginRequest("login@example.com", Password);

        var response = await client.PostAsJsonAsync("/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<AuthSessionResponse>();
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload.Token));
        Assert.Equal("login@example.com", payload.User.Email);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();
        var registerRequest = new RegisterRequest("Invalid", "Login", "invalid-login@example.com", Password);
        await client.PostAsJsonAsync("/auth/register", registerRequest);
        var loginRequest = new LoginRequest("invalid-login@example.com", "WrongPassword123");

        var response = await client.PostAsJsonAsync("/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutBearerToken_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/accounts");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    public void Dispose()
    {
        factory.Dispose();
    }

    private sealed class MonetriaApiFactory : WebApplicationFactory<Program>
    {
        private readonly string databaseName = $"MonetriaTests-{Guid.NewGuid()}";

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((_, configuration) =>
            {
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=monetria_tests",
                    ["Jwt:Issuer"] = "Monetria.Tests",
                    ["Jwt:Audience"] = "Monetria.Tests.Client",
                    ["Jwt:SecretKey"] = "test-only-secret-key-with-enough-length",
                    ["Jwt:ExpirationMinutes"] = "60"
                });
            });

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<MonetriaDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<MonetriaDbContext>>();
                services.AddDbContext<MonetriaDbContext>(options =>
                    options.UseInMemoryDatabase(databaseName));
            });
        }
    }
}
