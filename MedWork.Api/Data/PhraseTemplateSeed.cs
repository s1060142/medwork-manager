using MedWork.Api.Data;
using MedWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MedWork.Api.Data;

/// <summary>
/// FASE 1 seed: >= 100 phrase templates for the Cartella Sanitaria 3A library.
/// Call from AppDbSeeder.SeedAsync (FASE 0) once the PhraseTemplates DbSet is available.
/// </summary>
public static class PhraseTemplateSeed
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.PhraseTemplates.AnyAsync()) return;

        var phrases = new List<PhraseTemplate>();
        void Add(string category, string text, string? tags = null)
        {
            phrases.Add(new PhraseTemplate
            {
                TenantId = 1,
                Category = category,
                Text = text,
                Tags = tags,
                IsFavourite = false
            });
        }

        // ---- Anamnesi (40) ----
        Add("Anamnesi", "Negata patologia cronica in atto.", "generale");
        Add("Anamnesi", "Riferita buona tolleranza alle mansioni svolte.", "generale");
        Add("Anamnesi", "Non riferisce sintomi soggettivi significativi.", "generale");
        Add("Anamnesi", "Anamnesi patologica remota: appendicectomia in eta' infantile.", "chirurgia");
        Add("Anamnesi", "Ipertensione arteriosa in trattamento farmacologico.", "cardiovascolare");
        Add("Anamnesi", "Diabete mellito tipo 2 in terapia orale.", "metabolico");
        Add("Anamnesi", "Asma bronchiala sporadica, ben controllata.", "respiratorio");
        Add("Anamnesi", "Rinite allergica stagionale.", "respiratorio");
        Add("Anamnesi", "Colecistectomia laparoscopica pregressa.", "chirurgia");
        Add("Anamnesi", "Non fumatore.", "stili-vita");
        Add("Anamnesi", "Fumatore di circa 10 sigarette/die.", "stili-vita");
        Add("Anamnesi", "Ex fumatore da 5 anni, ex 20 pacchetti/anno.", "stili-vita");
        Add("Anamnesi", "Consumo alcolico occasionale.", "stili-vita");
        Add("Anamnesi", "Allergia documentata a penicillina.", "allergie");
        Add("Anamnesi", "Non riferisce allergie note a farmaci.", "allergie");
        Add("Anamnesi", "Lombalgia cronica con episodi acuti.", "muscoloscheletrico");
        Add("Anamnesi", "Cervicobrachialgia da attivita' al videoterminale.", "videoterminali");
        Add("Anamnesi", "Riferita irritabilita' e disturbi del sonno.", "psicosociale");
        Add("Anamnesi", "Esposizione pregressa ad amianto (sitazione).", "chimico");
        Add("Anamnesi", "Tiroidectomia totale per gozzo.", "endocrino");
        Add("Anamnesi", "Ipotiroidismo in terapia sostitutiva.", "endocrino");
        Add("Anamnesi", "Calcolosi renale episodica.", "rene");
        Add("Anamnesi", "Gastrite cronica in terapia.", "gastroenterologico");
        Add("Anamnesi", "Emicrania con aura, rara.", "neurologico");
        Add("Anamnesi", "Non riferisce patologie neurologiche.", "neurologico");
        Add("Anamnesi", "Intervento di ernia discale L4-L5.", "muscoloscheletrico");
        Add("Anamnesi", "Iposacusia lieve bilaterale da rumore.", "rumore");
        Add("Anamnesi", "Parestesie agli arti superiori riferite.", "muscoloscheletrico");
        Add("Anamnesi", "Non riferisce esposizioni traumatiche recenti.", "generale");
        Add("Anamnesi", "Stato di gravidanza dichiarato.", "gravidanza");
        Add("Anamnesi", "Allattamento in corso.", "gravidanza");
        Add("Anamnesi", "Assunzione di ansiolitici occasionale.", "psicosociale");
        Add("Anamnesi", "Glaucoma in trattamento topico.", "oculistico");
        Add("Anamnesi", "Cheratocongiuntivite da lenti a contatto.", "oculistico");
        Add("Anamnesi", "Non riferisce patologie cutanee attive.", "dermatologico");
        Add("Anamnesi", "Dermatite irritativa alle mani.", "dermatologico");
        Add("Anamnesi", "Riferita astenia ingiustificata.", "generale");
        Add("Anamnesi", "Non assumo terapie croniche.", "generale");
        Add("Anamnesi", "Terapia anticoagulante in corso (warfarina).", "ematologico");
        Add("Anamnesi", "Pollakiuria e bruciore minzionale riferiti.", "rene");

        // ---- Esame Obiettivo (35) ----
        Add("EsameObiettivo", "PA 130/80 mmHg, normotono.", "cardiovascolare");
        Add("EsameObiettivo", "PA 145/95 mmHg, ipertensione lieve.", "cardiovascolare");
        Add("EsameObiettivo", "Polso regolare, 72 bpm.", "cardiovascolare");
        Add("EsameObiettivo", "Auscultazione polmonare nella norma.", "respiratorio");
        Add("EsameObiettivo", "Ronchi diffusi agli acti espiratori.", "respiratorio");
        Add("EsameObiettivo", "Addome trattabile, indolente.", "gastroenterologico");
        Add("EsameObiettivo", "Peso 78 kg, altezza 175 cm, BMI 25.5.", "generale");
        Add("EsameObiettivo", "BMI nei limiti della norma.", "generale");
        Add("EsameObiettivo", "BMI sovrappeso (28.1).", "generale");
        Add("EsameObiettivo", "Lieva della colonna nella norma.", "muscoloscheletrico");
        Add("EsameObiettivo", "Ridotta mobilita' flesso-estensoria del rachide.", "muscoloscheletrico");
        Add("EsameObiettivo", "Arti inferiori: assi e trofismo conservati.", "muscoloscheletrico");
        Add("EsameObiettivo", "Segni di varici agli arti inferiori.", "muscoloscheletrico");
        Add("EsameObiettivo", "Connettiva e cute nella norma.", "dermatologico");
        Add("EsameObiettivo", "Dermatite secca al dorso delle mani.", "dermatologico");
        Add("EsameObiettivo", "Acuita' visiva corretta 10/10 bilateralmente.", "oculistico");
        Add("EsameObiettivo", "Lieva ipoacusi bilaterale confermata.", "rumore");
        Add("EsameObiettivo", "Timpani normali bilateralmente.", "rumore");
        Add("EsameObiettivo", "Non deficit neurologici focali.", "neurologico");
        Add("EsameObiettivo", "Riflessi osteotendinei presenti e simmetrici.", "neurologico");
        Add("EsameObiettivo", "Tono dell'umore nella norma.", "psicosociale");
        Add("EsameObiettivo", "Tiroide non palpabilmente ingrandita.", "endocrino");
        Add("EsameObiettivo", "Linfonodi superficiali non soggetti.", "generale");
        Add("EsameObiettivo", "Cute delle mani: ipercheratosi palmare.", "dermatologico");
        Add("EsameObiettivo", "Cianosi delle estremita' non presente.", "cardiovascolare");
        Add("EsameObiettivo", "Soffio cardiaco NON auscultato.", "cardiovascolare");
        Add("EsameObiettivo", "Edemi declivi non evidenti.", "cardiovascolare");
        Add("EsameObiettivo", "Funzionalita' respiratoria riferita buona.", "respiratorio");
        Add("EsameObiettivo", "Pupille isocoriche e normoreattive.", "oculistico");
        Add("EsameObiettivo", "Movimenti oculari nella norma.", "oculistico");
        Add("EsameObiettivo", "Prove di Romberg negative.", "neurologico");
        Add("EsameObiettivo", "Coordinazione e equilibrio conservati.", "neurologico");
        Add("EsameObiettivo", "Trofismo muscolare conservato agli arti.", "muscoloscheletrico");
        Add("EsameObiettivo", "Cicatrice chirurgica stable in ipocondrio dx.", "chirurgia");
        Add("EsameObiettivo", "Non segni di sofferenza epatica.", "gastroenterologico");
        Add("EsameObiettivo", "Alvo e diuresi riferiti regolari.", "generale");

        // ---- Conclusioni / Giudizio (30) ----
        Add("Conclusioni", "Idoneita' alla mansione specifica.", "giudizio");
        Add("Conclusioni", "Idoneita' con prescrizioni.", "giudizio");
        Add("Conclusioni", "Idoneita' parziale temporanea.", "giudizio");
        Add("Conclusioni", "Non idoneita' temporanea alla mansione.", "giudizio");
        Add("Conclusioni", "Non idoneita' permanente alla mansione.", "giudizio");
        Add("Conclusioni", "Idoneita' con riserva per esposizione rumore.", "rumore");
        Add("Conclusioni", "Prescrizione: uso di DPI uditivi in zona rumorosa.", "rumore");
        Add("Conclusioni", "Prescrizione: occhiali con filtro specifico.", "oculistico");
        Add("Conclusioni", "Prescrizione: pausa ogni 2h da videoterminale.", "videoterminali");
        Add("Conclusioni", "Prescrizione: visita specialistica dermatologica.", "dermatologico");
        Add("Conclusioni", "Controllo audiometrico annuale consigliato.", "rumore");
        Add("Conclusioni", "Sorveglianza sanitaria periodica annuale.", "generale");
        Add("Conclusioni", "Rinvio a specialista per approfondimento.", "generale");
        Add("Conclusioni", "Sospensione temporanea per gravidanza.", "gravidanza");
        Add("Conclusioni", "Idoneita' a lavori con esposizione chimica.", "chimico");
        Add("Conclusioni", "Idoneita' a mansioni di sollevamento carichi.", "muscoloscheletrico");
        Add("Conclusioni", "Limitazione al sollevamento pesi oltre 15 kg.", "muscoloscheletrico");
        Add("Conclusioni", "Idoneita' con sorveglianza per diabete.", "metabolico");
        Add("Conclusioni", "Controllo pressione arteriosa trimestrale.", "cardiovascolare");
        Add("Conclusioni", "Nessuna limitazione rispetto al rischio vibrazioni.", "vibrazioni");
        Add("Conclusioni", "Prescrizione: guanti protettivi specifici.", "dermatologico");
        Add("Conclusioni", "Idoneita' a guida di carrelli elevatori.", "generale");
        Add("Conclusioni", "Non idoneita' temporanea a lavori in quota.", "generale");
        Add("Conclusioni", "Accertamenti integrativi in attesa.", "generale");
        Add("Conclusioni", "Idoneita' confermata previo parere SPISAL.", "generale");
        Add("Conclusioni", "Sorveglianza per esposizione a polveri.", "chimico");
        Add("Conclusioni", "Prescrizione: visita oculistica annuale.", "oculistico");
        Add("Conclusioni", "Nessuna controindicazione alla guida.", "generale");
        Add("Conclusioni", "Idoneita' con riserva per turni notturni.", "psicosociale");
        Add("Conclusioni", "Rivalutazione a 6 mesi per decorso.", "generale");

        await db.PhraseTemplates.AddRangeAsync(phrases);
        await db.SaveChangesAsync();
    }
}
