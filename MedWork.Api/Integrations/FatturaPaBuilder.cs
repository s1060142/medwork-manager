namespace MedWork.Api.Integrations;

/// <summary>
/// FASE 3 - Fatturazione / SDI / PagoPA converters (pure transforms, no network).
/// </summary>

public sealed record FatturaPiva(
    string Numero,
    DateTime Data,
    string CedentePiva,
    string CessionarioPiva,
    decimal Imponibile,
    decimal IvaPercentuale);

/// <summary>Builds a minimal FatturaPA XML body (no namespace envelope) from a DTO.</summary>
public interface IFatturaPaBuilder
{
    string BuildXml(FatturaPiva fattura);
}

public sealed class FatturaPaBuilder : IFatturaPaBuilder
{
    public string BuildXml(FatturaPiva f)
    {
        var iva = Math.Round(f.Imponibile * f.IvaPercentuale / 100m, 2);
        var totale = f.Imponibile + iva;
        return $"""
            <FatturaElettronica>
              <FatturaBody>
                <DatiGenerali><DatiGeneraliDocumento>
                  <TipoDocumento>TD01</TipoDocumento>
                  <Numero>{Escape(f.Numero)}</Numero>
                  <Data>{f.Data:yyyy-MM-dd}</Data>
                  <ImportoTotaleDocumento>{totale:0.00}</ImportoTotaleDocumento>
                </DatiGeneraliDocumento></DatiGenerali>
                <DatiBeniServizi>
                  <DettaglioLinee>
                    <Descrizione>Sorveglianza sanitaria</Descrizione>
                    <PrezzoUnitario>{f.Imponibile:0.00}</PrezzoUnitario>
                    <AliquotaIVA>{f.IvaPercentuale:0.00}</AliquotaIVA>
                  </DettaglioLinee>
                  <DatiRiepilogo>
                    <AliquotaIVA>{f.IvaPercentuale:0.00}</AliquotaIVA>
                    <ImponibileImporto>{f.Imponibile:0.00}</ImponibileImporto>
                    <Imposta>{iva:0.00}</Imposta>
                  </DatiRiepilogo>
                </DatiBeniServizi>
              </FatturaBody>
            </FatturaElettronica>
            """;
    }

    private static string Escape(string? value) =>
        (value ?? string.Empty).Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");
}
