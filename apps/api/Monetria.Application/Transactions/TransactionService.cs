using Monetria.Application.Accounts;
using Monetria.Application.Categories;
using Monetria.Application.Common;
using Monetria.Domain.Entities;
using Monetria.Domain.Enums;
using System.Collections.Generic;

namespace Monetria.Application.Transactions;

public sealed class TransactionService(
    ITransactionRepository transactionRepository,
    IAccountRepository accountRepository,
    ICategoryRepository categoryRepository,
    IUnitOfWork unitOfWork) : ITransactionService
{
    public async Task<TransactionResponse> CreateAsync(
        Guid userId,
        CreateTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateCreateRequest(request);

        var account = await accountRepository.GetByIdAsync(request.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{request.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Account does not belong to the user.");
        }

        Category? category = null;

        if (request.Type != TransactionType.Transfer)
        {
            category = await categoryRepository.GetByIdAsync(request.CategoryId!.Value, cancellationToken)
                ?? throw new NotFoundException($"Category '{request.CategoryId}' was not found.");

            ValidateCategory(userId, request, category);
        }

        if (request.Type == TransactionType.Transfer)
        {
            var transferAccount = await accountRepository.GetByIdAsync(request.ToAccountId!.Value, cancellationToken)
                ?? throw new NotFoundException($"Transfer account '{request.ToAccountId}' was not found.");

            if (transferAccount.UserId != userId)
            {
                throw new UnauthorizedAccessException("Transfer account does not belong to the user.");
            }
        }

        await ValidateCreditLimitAsync(account, request, cancellationToken);

        if (request.Type == TransactionType.Transfer)
        {
            var pairId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var outflow = new Transaction
            {
                Id = Guid.NewGuid(),
                FromAccountId = request.FromAccountId,
                Type = TransactionType.Transfer,
                Amount = request.Amount,
                Description = request.Description?.Trim(),
                ToAccountId = request.ToAccountId,
                TransferPairId = pairId,
                IsActive = true,
                CurrencyCode = request.CurrencyCode,
                Date = request.Date,
                CreatedAt = now
            };

            var inflow = new Transaction
            {
                Id = Guid.NewGuid(),
                FromAccountId = request.ToAccountId!.Value,
                Type = TransactionType.Transfer,
                Amount = request.Amount,
                Description = request.Description?.Trim(),
                ToAccountId = null,
                TransferPairId = pairId,
                IsActive = true,
                CurrencyCode = request.CurrencyCode,
                Date = request.Date,
                CreatedAt = now
            };

            await transactionRepository.AddAsync(outflow, cancellationToken);
            await transactionRepository.AddAsync(inflow, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return MapToResponse(outflow);
        }

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            FromAccountId = request.FromAccountId,
            Type = request.Type,
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Description = request.Description?.Trim(),
            IsActive = true,
            CurrencyCode = request.CurrencyCode,
            Date = request.Date,
            CreatedAt = DateTime.UtcNow,
            Category = category
        };

        await transactionRepository.AddAsync(transaction, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(transaction);
    }

    public async Task<TransactionResponse> GetByIdAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var transaction = await transactionRepository.GetByIdAsync(transactionId, cancellationToken)
            ?? throw new NotFoundException($"Transaction '{transactionId}' was not found.");

        var account = await accountRepository.GetByIdAsync(transaction.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{transaction.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Transaction does not belong to the user.");
        }

        return MapToResponse(transaction);
    }

    public async Task<TransactionResponse> UpdateAsync(
        Guid userId,
        Guid transactionId,
        UpdateTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        ValidateUpdateRequest(request);

        var transaction = await transactionRepository.GetByIdAsync(transactionId, cancellationToken)
            ?? throw new NotFoundException($"Transaction '{transactionId}' was not found.");

        if (!transaction.IsActive)
        {
            throw new InvalidOperationException("Transaction has been deleted.");
        }

        var account = await accountRepository.GetByIdAsync(transaction.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{transaction.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Transaction does not belong to the user.");
        }

        if (request.CategoryId.HasValue)
        {
            var category = await categoryRepository.GetByIdAsync(request.CategoryId.Value, cancellationToken)
                ?? throw new NotFoundException($"Category '{request.CategoryId}' was not found.");

            if (category.UserId.HasValue && category.UserId.Value != userId)
            {
                throw new UnauthorizedAccessException("Category does not belong to the user.");
            }

            if (category.Type != transaction.Type)
            {
                throw new InvalidOperationException("Transaction type must match the category type.");
            }

            transaction.Category = category;
            transaction.CategoryId = request.CategoryId;
        }

        if (request.FromAccountId != Guid.Empty && request.FromAccountId != transaction.FromAccountId)
        {
            var newAccount = await accountRepository.GetByIdAsync(request.FromAccountId, cancellationToken)
                ?? throw new NotFoundException($"Account '{request.FromAccountId}' was not found.");

            if (newAccount.UserId != userId)
            {
                throw new UnauthorizedAccessException("Account does not belong to the user.");
            }

            transaction.FromAccountId = request.FromAccountId;
        }

        transaction.Amount = request.Amount;
        transaction.Description = request.Description?.Trim();
        transaction.CurrencyCode = request.CurrencyCode;
        transaction.Date = request.TransactionDate;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(transaction);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var transaction = await transactionRepository.GetByIdAsync(transactionId, cancellationToken)
            ?? throw new NotFoundException($"Transaction '{transactionId}' was not found.");

        if (!transaction.IsActive)
        {
            throw new InvalidOperationException("Transaction has already been deleted.");
        }

        var account = await accountRepository.GetByIdAsync(transaction.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{transaction.FromAccountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Transaction does not belong to the user.");
        }

        transaction.IsActive = false;

        if (transaction.Type == TransactionType.Transfer && transaction.TransferPairId.HasValue)
        {
            var pair = await transactionRepository.GetTransferPairAsync(transaction.Id, transaction.TransferPairId.Value, cancellationToken);
            if (pair != null)
            {
                pair.IsActive = false;
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResponse<TransactionResponse>> ListByUserIdAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        var page = Math.Max(1, filter.Page ?? 1);
        var pageSize = Math.Clamp(filter.PageSize ?? 20, 1, 100);
        var pagedFilter = filter with { Page = page, PageSize = pageSize, Limit = null };

        ValidateFilter(pagedFilter);

        var totalCount = await transactionRepository.CountByUserIdAsync(userId, pagedFilter, cancellationToken);
        var transactions = await transactionRepository.ListByUserIdAsync(userId, pagedFilter, cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResponse<TransactionResponse>(
            transactions.Select(MapToResponse).ToList(),
            totalCount,
            page,
            pageSize,
            totalPages);
    }

    public async Task<IReadOnlyList<TransactionResponse>> ListByAccountIdAsync(
        Guid userId,
        Guid accountId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        if (accountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(accountId));
        }

        ValidateFilter(filter);
        var account = await accountRepository.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account '{accountId}' was not found.");

        if (account.UserId != userId)
        {
            throw new UnauthorizedAccessException("Account does not belong to the user.");
        }

        var accountFilter = filter with { FromAccountId = accountId };
        var transactions = await transactionRepository.ListByAccountIdAsync(accountId, accountFilter, cancellationToken);

        return transactions
            .Select(MapToResponse)
            .ToList();
    }

    private static void ValidateCreateRequest(CreateTransactionRequest request)
    {
        if (request.FromAccountId == Guid.Empty)
        {
            throw new ArgumentException("Account id is required.", nameof(request));
        }

        if (request.Amount <= 0)
        {
            throw new ArgumentException("Transaction amount must be greater than 0.", nameof(request));
        }

        if (request.Description != null && request.Description.Length > 500)
        {
            throw new ArgumentException("Transaction description must not exceed 500 characters.", nameof(request));
        }

        if (request.Type == TransactionType.Transfer)
        {
            if (!request.ToAccountId.HasValue || request.ToAccountId == Guid.Empty)
            {
                throw new ArgumentException("Transfer account is required for transfer transactions.", nameof(request));
            }

            if (request.ToAccountId == request.FromAccountId)
            {
                throw new ArgumentException("Transfer account must be different from the source account.", nameof(request));
            }

            return;
        }

        if (request.Type is not (TransactionType.Income or TransactionType.Expense))
        {
            throw new ArgumentException("Transaction type must be Income, Expense, or Transfer.", nameof(request));
        }

        if (request.Type == TransactionType.Expense && (!request.CategoryId.HasValue || request.CategoryId == Guid.Empty))
        {
            throw new ArgumentException("Category is required for expense transactions.", nameof(request));
        }
    }

    private static void ValidateUpdateRequest(UpdateTransactionRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("Transaction amount must be greater than 0.", nameof(request));
        }

        if (request.Description != null && request.Description.Length > 500)
        {
            throw new ArgumentException("Transaction description must not exceed 500 characters.", nameof(request));
        }
    }

    private static void ValidateCategory(Guid userId, CreateTransactionRequest request, Category category)
    {
        if (category.UserId.HasValue && category.UserId.Value != userId)
        {
            throw new UnauthorizedAccessException("Category does not belong to the user.");
        }

        if (category.Type != request.Type)
        {
            throw new InvalidOperationException("Transaction type must match the category type.");
        }
    }

    private async Task ValidateCreditLimitAsync(
        Account account,
        CreateTransactionRequest request,
        CancellationToken cancellationToken)
    {
        if (account.Type != AccountType.CreditCard || request.Type != TransactionType.Expense)
        {
            return;
        }

        var currentBalance = await transactionRepository.GetAccountBalanceDeltaAsync(account.Id, cancellationToken);
        var projectedBalance = currentBalance - request.Amount;
        var projectedDebt = Math.Max(0, -projectedBalance);

        if (projectedDebt > account.CreditLimit)
        {
            throw new InvalidOperationException("Transaction exceeds the account credit limit.");
        }
    }

    public async Task<TransactionSummaryResponse> GetSummaryAsync(
        Guid userId,
        TransactionFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        ValidateFilter(filter);
        return await transactionRepository.GetSummaryByUserIdAsync(userId, filter, cancellationToken);
    }

    private static readonly string[] MonthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    private static readonly int[] ValidMonths = [1, 3, 6, 12];

    public async Task<MonthlyFlowResponse> GetMonthlyFlowAsync(
        Guid userId, int months, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        if (!ValidMonths.Contains(months))
            throw new ArgumentException("months must be 1, 3, 6, or 12.", nameof(months));

        var now = DateTime.UtcNow;
        var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));
        var periodEnd   = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);

        var points = await transactionRepository.GetMonthlyFlowAsync(userId, periodStart, periodEnd, cancellationToken);
        var lookup = points.ToDictionary(p => (p.Month, p.Year));

        var entries = new List<FlowEntry>(months);
        for (var i = 0; i < months; i++)
        {
            var date  = periodStart.AddMonths(i);
            var key   = (date.Month, date.Year);
            var label = months == 1
                ? MonthLabels[date.Month - 1]
                : $"{MonthLabels[date.Month - 1]} {date.Year}";
            var (income, expenses) = lookup.TryGetValue(key, out var p) ? (p.Income, p.Expenses) : (0m, 0m);
            entries.Add(new FlowEntry(label, income, expenses));
        }

        return new MonthlyFlowResponse(months, "month", entries);
    }

    public async Task<MonthlyFlowResponse> GetWeeklyFlowAsync(
        Guid userId, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var now   = DateTime.UtcNow;
        var weeks = (DateTime.DaysInMonth(now.Year, now.Month) - 1) / 7 + 1;

        var points = await transactionRepository.GetWeeklyFlowAsync(userId, now.Month, now.Year, cancellationToken);
        var lookup = points.ToDictionary(p => p.WeekOfMonth);

        var entries = new List<FlowEntry>(weeks);
        for (var w = 1; w <= weeks; w++)
        {
            var (income, expenses) = lookup.TryGetValue(w, out var p) ? (p.Income, p.Expenses) : (0m, 0m);
            entries.Add(new FlowEntry($"Sem {w}", income, expenses));
        }

        return new MonthlyFlowResponse(1, "week", entries);
    }

    public async Task<SpendingByCategoryResponse> GetSpendingByCategoryAsync(
        Guid userId, int months, CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);
        if (!ValidMonths.Contains(months))
            throw new ArgumentException("months must be 1, 3, 6, or 12.", nameof(months));

        var now         = DateTime.UtcNow;
        var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));
        var periodEnd   = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);

        var points        = await transactionRepository.GetSpendingByCategoryAsync(userId, periodStart, periodEnd, cancellationToken);
        var totalExpenses = points.Sum(p => p.Amount);

        var data = points.Select(p => new CategorySpendingEntry(
            p.CategoryId,
            p.CategoryName ?? "Sin categoría",
            p.Color,
            p.KeyIcon,
            p.Amount,
            totalExpenses > 0 ? Math.Round(p.Amount / totalExpenses * 100, 1) : 0m)).ToList();

        return new SpendingByCategoryResponse(
            months,
            periodStart.ToString("yyyy-MM-dd"),
            periodEnd.AddDays(-1).ToString("yyyy-MM-dd"),
            totalExpenses,
            data);
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }
    }

    private static void ValidateFilter(TransactionFilterRequest filter)
    {
        if (filter.FromAccountId == Guid.Empty)
        {
            throw new ArgumentException("Account id filter cannot be empty.", nameof(filter));
        }

        if (filter.CategoryId == Guid.Empty)
        {
            throw new ArgumentException("Category id filter cannot be empty.", nameof(filter));
        }

        if (filter.Month.HasValue && (filter.Month < 1 || filter.Month > 12))
        {
            throw new ArgumentException("Month filter must be between 1 and 12.", nameof(filter));
        }

        if (filter.Month.HasValue && !filter.Year.HasValue)
        {
            throw new ArgumentException("Year filter is required when month is provided.", nameof(filter));
        }

        if (filter.Year.HasValue && filter.Year < 1)
        {
            throw new ArgumentException("Year filter must be greater than 0.", nameof(filter));
        }
    }

    private static TransactionResponse MapToResponse(Transaction transaction)
    {
        return new TransactionResponse(
            transaction.Id,
            transaction.FromAccountId,
            transaction.Type,
            transaction.CategoryId,
            transaction.Category?.Name ?? string.Empty,
            transaction.Category?.Color,
            transaction.Category?.KeyIcon,
            transaction.Amount,
            transaction.Description,
            transaction.ToAccountId,
            transaction.TransferPairId,
            transaction.IsActive,
            transaction.CurrencyCode,
            transaction.Date,
            transaction.CreatedAt);
    }
}
