using System.Security.Cryptography;

namespace MedWork.Api.Services;

/// <summary>
/// FASE 1 - Firma grafometrica. Verifies the integrity of a signed medical document
/// (PDF) by comparing the stored content hash against a freshly computed one and
/// validating the detached signature with the doctor's public key.
/// Pure crypto: no DB dependency.
/// </summary>
public interface ISignatureService
{
    /// <summary>Signs a document payload, returning the base64 signature + content hash.</summary>
    SignatureResult Sign(byte[] documentBytes, byte[] privateKey);

    /// <summary>Verifies a detached signature against the document and the signer public key.</summary>
    bool Verify(byte[] documentBytes, byte[] signature, byte[] publicKey);

    /// <summary>Computes the SHA-256 content hash (used for tamper-evidence).</summary>
    string ContentHash(byte[] documentBytes);
}

public sealed record SignatureResult(string ContentHash, string SignatureBase64);

public sealed class SignatureService : ISignatureService
{
    public SignatureResult Sign(byte[] documentBytes, byte[] privateKey)
    {
        var hash = ComputeHash(documentBytes);
        var signature = RSAHelper.Sign(hash, privateKey);
        return new SignatureResult(Convert.ToHexString(hash), Convert.ToBase64String(signature));
    }

    public bool Verify(byte[] documentBytes, byte[] signature, byte[] publicKey)
    {
        var hash = ComputeHash(documentBytes);
        return RSAHelper.Verify(hash, signature, publicKey);
    }

    public string ContentHash(byte[] documentBytes)
    {
        return Convert.ToHexString(ComputeHash(documentBytes));
    }

    private static byte[] ComputeHash(byte[] documentBytes)
    {
        using var sha = SHA256.Create();
        return sha.ComputeHash(documentBytes);
    }
}

/// <summary>In-memory RSA sign/verify helper (demo keys; replace with KMS/HSM in prod).</summary>
internal static class RSAHelper
{
    public static byte[] Sign(byte[] data, byte[] privateKey)
    {
        using var rsa = RSA.Create();
        rsa.ImportRSAPrivateKey(privateKey, out _);
        return rsa.SignData(data, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
    }

    public static bool Verify(byte[] data, byte[] signature, byte[] publicKey)
    {
        try
        {
            using var rsa = RSA.Create();
            rsa.ImportRSAPublicKey(publicKey, out _);
            return rsa.VerifyData(data, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        }
        catch
        {
            return false;
        }
    }

    public static (byte[] publicKey, byte[] privateKey) GenerateKeyPair()
    {
        using var rsa = RSA.Create(2048);
        return (rsa.ExportRSAPublicKey(), rsa.ExportRSAPrivateKey());
    }
}
