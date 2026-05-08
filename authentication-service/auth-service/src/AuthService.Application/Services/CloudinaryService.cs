using AuthService.Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Services;

public class CloudinaryService(IConfiguration configuration) : ICloudinaryService
{
    private readonly Cloudinary _cloudinary = new(new Account(
        configuration["CloudinarySettings:CloudName"],
        configuration["CloudinarySettings:ApiKey"],
        configuration["CloudinarySettings:ApiSecret"]
    ));

    public async Task<string> UploadImageAsync(IFileData imageFile, string fileName)
    {
        try
        {
            using var stream = new MemoryStream(imageFile.Data);

            var folder = configuration["CloudinarySettings:Folder"]
                         ?? "auth_service/profiles";

            var cleanName = Path.GetFileNameWithoutExtension(fileName);

            var publicId = $"{folder}/{cleanName}";

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(imageFile.FileName, stream),
                PublicId = publicId,
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
                throw new InvalidOperationException($"Error uploading image: {uploadResult.Error.Message}");

            return $"v{uploadResult.Version}/{uploadResult.PublicId}.{uploadResult.Format}";
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to upload image to Cloudinary: {ex.Message}", ex);
        }
    }

    public async Task<bool> DeleteImageAsync(string fileName)
    {
        try
        {
            var folder = configuration["CloudinarySettings:Folder"]
                         ?? "auth_service/profiles";

            var withoutVersion = fileName.Contains('/')
                ? string.Join('/', fileName.Split('/').Skip(1))
                : fileName;

            var withoutExtension = Path.Combine(
                Path.GetDirectoryName(withoutVersion) ?? "",
                Path.GetFileNameWithoutExtension(withoutVersion)
            ).Replace("\\", "/");


            var deleteParams = new DelResParams
            {
                PublicIds = [withoutExtension]
            };

            var result = await _cloudinary.DeleteResourcesAsync(deleteParams);
            return result.Deleted?.ContainsKey(withoutExtension) == true;
        }
        catch
        {
            return false;
        }
    }


    public string GetDefaultAvatarUrl()
    {
        var baseUrl = configuration["CloudinarySettings:BaseUrl"] ?? "https://res.cloudinary.com/dug3apxt3/image/upload/";
        var defaultPath = configuration["CloudinarySettings:DefaultAvatarPath"] ?? "auth_service/profiles/avatarDefault-1749508519496_oam3k3";
        // Asegurar que tenga extensión .png
        if (!defaultPath.EndsWith(".png"))
            defaultPath += ".png";
        return $"{baseUrl}{defaultPath}";
    }

    public string GetFullImageUrl(string fileName)
    {
        var baseUrl = configuration["CloudinarySettings:BaseUrl"]
                      ?? "https://res.cloudinary.com/dqx1m6nxh/image/upload/";

        if (string.IsNullOrWhiteSpace(fileName))
        {
            // Avatar por defecto: usar versión y sin carpeta duplicada
            var version = "v1774318088";
            var defaultFile = configuration["CloudinarySettings:DefaultAvatarPath"] ?? "avatarDefault-1749508519496_oam3k3";
            if (!defaultFile.EndsWith(".png"))
                defaultFile += ".png";
            // Solo el filename, sin carpeta
            var fileNameOnly = defaultFile.Split('/').Last();
            return $"{baseUrl}{version}/{fileNameOnly}";
        }

        // Si el nombre ya tiene extensión, respétala (imagen personalizada)
        return $"{baseUrl}w_400,h_400,c_fill,g_auto,q_auto,f_auto/{fileName}";
    }

}
