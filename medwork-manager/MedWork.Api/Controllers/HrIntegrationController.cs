using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MedWork.Api.Models;
using MedWork.Api.Services;

namespace MedWork.Api.Controllers
{
    /// <summary>
    /// Controller for HR integration events (hire, termination, absence, transfer)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication
    public class HrIntegrationController : ControllerBase
    {
        private readonly IHrIntegrationService _hrIntegrationService;

        public HrIntegrationController(IHrIntegrationService hrIntegrationService)
        {
            _hrIntegrationService = hrIntegrationService;
        }

        /// <summary>
        /// Processes a new hire event from an HR system.
        /// </summary>
        /// <param name="hireEvent">The hire event data.</param>
        /// <returns>The created employee.</returns>
        [HttpPost("hire")]
        [ProducesResponseType(typeof(Employee), 200)]
        [ProducesResponseType(typeof(string), 400)]
        [ProducesResponseType(typeof(string), 404)]
        public async Task<IActionResult> ProcessHire([FromBody] HireEventDto hireEvent)
        {
            try
            {
                var employee = await _hrIntegrationService.ProcessHireEventAsync(hireEvent);
                return Ok(employee);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Processes a termination event from an HR system.
        /// </summary>
        /// <param name="terminationEvent">The termination event data.</param>
        /// <returns>The employee (if found) or not found.</returns>
        [HttpPost("terminate")]
        [ProducesResponseType(typeof(Employee), 200)]
        [ProducesResponseType(typeof(string), 404)]
        [ProducesResponseType(typeof(string), 400)]
        public async Task<IActionResult> ProcessTermination([FromBody] TerminationEventDto terminationEvent)
        {
            try
            {
                var employee = await _hrIntegrationService.ProcessTerminationEventAsync(terminationEvent);
                if (employee == null)
                    return NotFound($"Employee with ID {terminationEvent.EmployeeId} not found.");

                return Ok(employee);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Processes an absence event (e.g., sick leave, vacation) from an HR system.
        /// </summary>
        /// <param name="absenceEvent">The absence event data.</param>
        /// <returns>The employee (if found) or not found.</returns>
        [HttpPost("absence")]
        [ProducesResponseType(typeof(Employee), 200)]
        [ProducesResponseType(typeof(string), 404)]
        [ProducesResponseType(typeof(string), 400)]
        public async Task<IActionResult> ProcessAbsence([FromBody] AbsenceEventDto absenceEvent)
        {
            try
            {
                var employee = await _hrIntegrationService.ProcessAbsenceEventAsync(absenceEvent);
                if (employee == null)
                    return NotFound($"Employee with ID {absenceEvent.EmployeeId} not found.");

                return Ok(employee);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Processes a transfer event (change of department, branch, job role) from an HR system.
        /// </summary>
        /// <param name="transferEvent">The transfer event data.</param>
        /// <returns>The employee (if found) or not found.</returns>
        [HttpPost("transfer")]
        [ProducesResponseType(typeof(Employee), 200)]
        [ProducesResponseType(typeof(string), 404)]
        [ProducesResponseType(typeof(string), 400)]
        public async Task<IActionResult> ProcessTransfer([FromBody] TransferEventDto transferEvent)
        {
            try
            {
                var employee = await _hrIntegrationService.ProcessTransferEventAsync(transferEvent);
                if (employee == null)
                    return NotFound($"Employee with ID {transferEvent.EmployeeId} not found.");

                return Ok(employee);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}