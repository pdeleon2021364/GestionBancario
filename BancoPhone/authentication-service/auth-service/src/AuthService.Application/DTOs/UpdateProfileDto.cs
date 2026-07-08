using System.ComponentModel.DataAnnotations;
using AuthService.Application.Interfaces;

namespace AuthService.Application.DTOs;

public class UpdateProfileDto
{
    [MaxLength(25)]
    public string? Name { get; set; }

    [MaxLength(25)]
    public string? Surname { get; set; }

    [StringLength(8, MinimumLength = 8)]
    public string? Phone { get; set; }

    public IFileData? ProfilePicture { get; set; }
}
