using Microsoft.AspNetCore.DataProtection;

namespace MedWork.Api.Services;

public class FieldEncryptionService : IFieldEncryptionService
{
    private readonly IDataProtector _protector;

    public FieldEncryptionService(IDataProtectionProvider dataProtectionProvider)
    {
        _protector = dataProtectionProvider.CreateProtector("MedWork.Api.SensitiveFieldProtector.v1");
    }

    public string Encrypt(string plainText)
    {
        return _protector.Protect(plainText);
    }

    public string Decrypt(string cipherText)
    {
        return _protector.Unprotect(cipherText);
    }
}
