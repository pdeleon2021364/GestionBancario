using AuthService.Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary? _cloudinary;
    private readonly IConfiguration _configuration;

    public CloudinaryService(IConfiguration configuration)
    {
        _configuration = configuration;
        var cloudName = configuration["CloudinarySettings:CloudName"];
        var apiKey = configuration["CloudinarySettings:ApiKey"];
        var apiSecret = configuration["CloudinarySettings:ApiSecret"];

        if (!string.IsNullOrEmpty(cloudName) && !string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(apiSecret))
        {
            _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));
        }
    }

    public async Task<string> UploadImageAsync(IFileData imageFile, string fileName)
    {
        try
        {
            if (_cloudinary == null)
                throw new InvalidOperationException("Cloudinary is not configured. Please configure CloudinarySettings in appsettings.json");

            using var stream = new MemoryStream(imageFile.Data);

            var folder = _configuration["CloudinarySettings:Folder"]
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
            if (_cloudinary == null)
                throw new InvalidOperationException("Cloudinary is not configured. Please configure CloudinarySettings in appsettings.json");

            var folder = _configuration["CloudinarySettings:Folder"]
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
        var baseUrl = _configuration["CloudinarySettings:BaseUrl"] ?? "https://res.cloudinary.com/dug3apxt3/image/upload/";
        var defaultPath = _configuration["CloudinarySettings:DefaultAvatarPath"] ?? "auth_service/profiles/avatarDefault-1749508519496_oam3k3";
        // Asegurar que tenga extensión .png
        if (!defaultPath.EndsWith(".png"))
            defaultPath += ".png";
        return $"{baseUrl}{defaultPath}";
    }

    public string GetFullImageUrl(string fileName)
    {
        var baseUrl = _configuration["CloudinarySettings:BaseUrl"]
                      ?? "https://res.cloudinary.com/dqx1m6nxh/image/upload/";

        if (string.IsNullOrWhiteSpace(fileName))
        {
            // Avatar por defecto: usar versión y sin carpeta duplicada
            var version = "v1774318088";
            var defaultFile = _configuration["CloudinarySettings:DefaultAvatarPath"] ?? "avatarDefault-1749508519496_oam3k3";
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
