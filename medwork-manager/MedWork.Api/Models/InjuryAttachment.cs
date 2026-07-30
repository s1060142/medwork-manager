using System.ComponentModel.DataAnnotations;

namespace MedWork.Api.Models;

public class InjuryAttachment
{
    public int InjuryId { get; set; }
    public Injury? Injury { get; set; }

    public int AttachmentId { get; set; }
    public Attachment? Attachment { get; set; }
}
