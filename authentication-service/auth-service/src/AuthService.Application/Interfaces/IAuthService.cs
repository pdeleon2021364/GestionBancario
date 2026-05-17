using AuthService.Application.DTOs;
using AuthService.Application.DTOs.Email;

namespace AuthService.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<EmailResponseDto> VerifyEmailAsync(VerifyEmailDto verifyEmailDto);
    Task<EmailResponseDto> ResendVerificationEmailAsync(ResendVerificationDto resendDto);
    Task<EmailResponseDto> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);
    Task<EmailResponseDto> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
    Task<UserResponseDto?> GetUserByIdAsync(string userId);
    Task<IEnumerable<UserResponseDto>> GetAllUsersAsync();
    Task<UserResponseDto> UpdateProfileAsync(string userId, UpdateProfileDto updateProfileDto);
    Task<UserResponseDto> UpdateUserAsync(string userId, UpdateUserDto updateUserDto);
    Task DeleteUserAsync(string userId);

    // Profile picture management
    Task<UserResponseDto> UpdateProfilePictureAsync(string userId, IFileData file);
    Task<UserResponseDto> DeleteProfilePictureAsync(string userId);
}
