using MedWork.Api.Contracts.Auth;
using MedWork.Api.Security;
using MedWork.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MedWork.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthSettings _authSettings;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthController(IOptions<AuthSettings> authSettings, IJwtTokenService jwtTokenService)
    {
        _authSettings = authSettings.Value;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        var user = _authSettings.Users.FirstOrDefault(x =>
            x.Username.Equals(request.Username, StringComparison.OrdinalIgnoreCase) &&
            x.Password == request.Password);

        if (user is null || (user.Role != AppRole.Admin && user.Role != AppRole.Doctor))
        {
            return Unauthorized();
        }

        var token = _jwtTokenService.GenerateToken(user.Username, user.Role);
        return Ok(new LoginResponse
        {
            AccessToken = token,
            Role = user.Role
        });
    }
}
