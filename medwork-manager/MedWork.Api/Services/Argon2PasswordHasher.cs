using Konscious.Security.Cryptography;
using System.Security.Cryptography;
using System.Text;

namespace MedWork.Api.Services;

/// <summary>
/// Hashing delle password con Argon2id (OWASP-recommended per il 2023/2024).
/// Parametri: memoria 128 MB, iterazioni 4, parallelismo 2 — bilanciati per un server
/// applicativo (non per il login interattivo su dispositivi limitati).
/// L'hash prodotto è self-contained: "$argon2id$v=19$m=...,t=...,p=...$salt$hash".
/// </summary>
public interface IPasswordHasher
{
    string Hash(string plainPassword);
    bool Verify(string plainPassword, string storedHash);
}

public sealed class Argon2PasswordHasher : IPasswordHasher
{
    // Costanti di costo (regolabili in base alla memoria disponibile del server).
    private const int MemorySizeKb = 128 * 1024; // 128 MB
    private const int Iterations = 4;
    private const int Parallelism = 2;
    private const int SaltBytes = 16;
    private const int HashBytes = 32;

    public string Hash(string plainPassword)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(plainPassword))
        {
            Salt = salt,
            DegreeOfParallelism = Parallelism,
            Iterations = Iterations,
            MemorySize = MemorySizeKb
        };

        var hash = argon2.GetBytes(HashBytes);
        return $"$argon2id$v=19$m={MemorySizeKb},t={Iterations},p={Parallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public bool Verify(string plainPassword, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(storedHash) || !storedHash.StartsWith("$argon2id$"))
        {
            return false;
        }

        try
        {
            // Parsa i parametri dallo stored hash per ricalcolare con gli stessi costi.
            var parts = storedHash.Split('$');
            if (parts.Length != 6) return false;

            var paramPart = parts[3]; // m=...,t=...,p=...
            var saltB64 = parts[4];
            var expectedHashB64 = parts[5];

            int mem = 0, iter = 0, par = 0;
            foreach (var p in paramPart.Split(','))
            {
                var kv = p.Split('=');
                if (kv.Length != 2) continue;
                switch (kv[0])
                {
                    case "m": int.TryParse(kv[1], out mem); break;
                    case "t": int.TryParse(kv[1], out iter); break;
                    case "p": int.TryParse(kv[1], out par); break;
                }
            }

            var salt = Convert.FromBase64String(saltB64);
            using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(plainPassword))
            {
                Salt = salt,
                DegreeOfParallelism = par,
                Iterations = iter,
                MemorySize = mem
            };

            var computed = Convert.ToBase64String(argon2.GetBytes(HashBytes));
            return ConstantTimeEquals(computed, expectedHashB64);
        }
        catch (FormatException)
        {
            return false;
        }
        catch (CryptographicException)
        {
            return false;
        }
    }

    // Confronto in tempo costante per evitare timing attack.
    private static bool ConstantTimeEquals(string a, string b)
    {
        if (a.Length != b.Length) return false;
        var result = 0;
        for (var i = 0; i < a.Length; i++)
        {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }
}
