using AuthService.Application.Services;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class RoleRepository(ApplicationDbContext context) : IRoleRepository
{
    public async Task<Role?> GetByNameAsync(string roleName)
    {
        return await (context.Roles ?? throw new InvalidOperationException("Roles DbSet is null."))
            .FirstOrDefaultAsync(r => r.Name == roleName);
    }

    public async Task<Role> CreateAsync(string roleName)
    {
        var role = new Role
        {
            Id = UuidGenerator.GenerateRoleId(),
            Name = roleName
        };
        (context.Roles ?? throw new InvalidOperationException("Roles DbSet is null.")).Add(role);
        await context.SaveChangesAsync();
        return role;
    }

    public async Task<int> CountUsersInRoleAsync(string roleName)
    {
        return await (context.UserRoles ?? throw new InvalidOperationException("UserRoles DbSet is null."))
            .Include(ur => ur.Role)
            .Where(ur => ur.Role.Name == roleName)
            .Select(ur => ur.UserId)
            .Distinct()
            .CountAsync();
    }

    public async Task<IReadOnlyList<User>> GetUsersByRoleAsync(string roleName)
    {
        var users = await (context.Users ?? throw new InvalidOperationException("Users DbSet is null."))
            .Include(u => u.UserProfile)
            .Include(u => u.UserEmail)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == roleName))
            .ToListAsync();
        return users;
    }

    public async Task<IReadOnlyList<string>> GetUserRoleNamesAsync(string userId)
    {
        var roles = await (context.UserRoles ?? throw new InvalidOperationException("UserRoles DbSet is null."))
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role.Name)
            .ToListAsync();
        return roles;
    }
}
