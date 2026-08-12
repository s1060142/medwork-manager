import re, io, sys

# Mappa rename italiano -> inglese (word-boundary). Ordine: i composti prima dei substring.
RENAMES = [
    ("Nominativo", "FullName"),
    ("EmailReferente", "ManagerEmail"),
    ("RagioneSociale", "LegalName"),
    ("ArchivioUnico", "SingleArchive"),
    ("Indirizzo", "Address"),
    ("Citta", "City"),
    ("Cap", "PostalCode"),
    ("Provincia", "Province"),
    ("PartitaIva", "VATNumber"),
    ("CodiceFiscale", "TaxCode"),
    ("Attivo", "IsActive"),
    ("Ruolo", "Role"),
    ("Nome", "Name"),
    ("Referente", "Manager"),
    ("StrutturaVisitata", "VisitedStructure"),
    ("Luogo", "Location"),
    ("Medico", "DoctorName"),
    ("Data", "VisitDate"),
    ("Periodicita", "Frequency"),
    ("Scadenza", "NextDueDate"),
]
# pattern word-boundary per ciascuno
pats = [(re.compile(r'(?<![\w])' + re.escape(o) + r'(?![\w])'), n) for o, n in RENAMES]

# Descrizione: mappata per (file, linea 0-indexed) -> nuovo nome
DESCR = {
    "AdminCrudController.cs": {467: "LegalName", 574: "Notes"},
    "MasterDataController.cs": {461: "LegalName", 469: "LegalName", 529: "Notes", 535: "Notes"},
}

files = ["AdminCrudController.cs", "MasterDataController.cs"]
base = r"C:\github\medwork-manager\MedWork.Api\Controllers"
for f in files:
    p = base + "\\" + f
    with io.open(p, "r", encoding="utf-8") as fh:
        lines = fh.readlines()
    # 1) rename non-ambigui su tutto il file
    new_lines = []
    for ln in lines:
        for pat, rep in pats:
            ln = pat.sub(rep, ln)
        new_lines.append(ln)
    # 2) Descrizione per linea
    desc = DESCR.get(f, {})
    for idx, rep in desc.items():
        # match 'Descrizione' standalone (entity.Descrizione / x.Descrizione / request.Descrizione)
        new_lines[idx] = re.sub(r'(?<![\w])Descrizione(?![\w])', rep, new_lines[idx])
    with io.open(p, "w", encoding="utf-8") as fh:
        fh.writelines(new_lines)
    print("processed", f)
