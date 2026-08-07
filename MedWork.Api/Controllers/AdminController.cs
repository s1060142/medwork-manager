using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = AppRole.Admin)]
public class AdminController : ControllerBase
{
    [HttpGet("health")]
    public IActionResult GetAdminHealth()
    {
        return Ok(new { Message = "Admin area enabled." });
    }
}
