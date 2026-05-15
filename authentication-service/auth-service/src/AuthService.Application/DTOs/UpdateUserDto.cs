using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class UpdateUserDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(25, ErrorMessage = "El nombre no puede tener mas de 25 caracteres.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [MaxLength(25, ErrorMessage = "El apellido no puede tener mas de 25 caracteres.")]
    public string Surname { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El nombre de usuario no puede tener mas de 50 caracteres.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electronico es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo electronico no tiene un formato valido.")]
    [MaxLength(150, ErrorMessage = "El correo electronico no puede tener mas de 150 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El telefono es obligatorio.")]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El telefono debe contener exactamente 8 digitos.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rol es obligatorio.")]
    public string Role { get; set; } = string.Empty;

    public bool Status { get; set; }
}
