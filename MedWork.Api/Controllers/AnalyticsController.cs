using MedWork.Api.Analytics;
using MedWork.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedWork.Api.Controllers;

/// <summary>
/// FASE 4 - Analytics: anomaly detection, no-show prediction, slot optimization, benchmark.
/// Exposes pure domain services. No AppDbContext dependency.
/// </summary>
[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "Admin,Doctor")]
public sealed class AnalyticsController : ControllerBase
{
    private readonly IAnomalyDetectionService _anomaly;
    private readonly INoShowPredictionService _noShow;
    private readonly ISlotOptimizationService _slots;
    private readonly IBenchmarkService _benchmark;

    public AnalyticsController(
        IAnomalyDetectionService anomaly,
        INoShowPredictionService noShow,
        ISlotOptimizationService slots,
        IBenchmarkService benchmark)
    {
        _anomaly = anomaly;
        _noShow = noShow;
        _slots = slots;
        _benchmark = benchmark;
    }

    [HttpPost("anomalies")]
    public IActionResult DetectAnomalies([FromBody] IReadOnlyList<ProtocolOutcomeAggregate> aggregates)
    {
        var result = _anomaly.Detect(aggregates ?? Array.Empty<ProtocolOutcomeAggregate>());
        return Ok(result);
    }

    [HttpPost("no-show")]
    public IActionResult PredictNoShow([FromBody] NoShowFeatures features)
    {
        if (features is null) return BadRequest("features required.");
        return Ok(new { probability = _noShow.PredictProbability(features), overbook = _noShow.ShouldOverbook(features) });
    }

    [HttpPost("optimize-routes")]
    public IActionResult OptimizeRoutes([FromBody] IReadOnlyList<VisitStop> stops)
    {
        var routes = _slots.ClusterByCompany(stops ?? Array.Empty<VisitStop>());
        return Ok(routes);
    }

    [HttpPost("benchmark")]
    public IActionResult Benchmark([FromBody] IReadOnlyList<StudioKpi> peers)
    {
        var result = _benchmark.Compare(peers ?? Array.Empty<StudioKpi>());
        return Ok(result);
    }
}
