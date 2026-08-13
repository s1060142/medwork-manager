using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.OpenApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MedWork.Api.Swagger
{
    /// <summary>
    /// Custom operation filter to handle IFormFile parameters in Swagger generation.
    /// Fixes the SwaggerGeneratorException: "Error reading parameter(s) for action ... as [FromForm] attribute used with IFormFile"
    /// </summary>
    public class FormFileOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Handle IFormFile parameters
            var formFileParams = context.ApiDescription.ActionDescriptor.Parameters
                .Where(p => p.ParameterType == typeof(IFormFile));

            foreach (var param in formFileParams)
            {
                var parameterName = param.Name;
                var openApiParam = operation.Parameters.FirstOrDefault(p => p.Name == parameterName);

                if (openApiParam != null)
                {
                    // Use explicit cast to handle nullable ParameterLocation
                    openApiParam.In = (Microsoft.OpenApi.Models.ParameterLocation)"FormData";
                    openApiParam.Schema = new OpenApiSchema
                    {
                        Type = "string",
                        Format = "binary",
                        Description = "Upload file"
                    };
                }
                else
                {
                    operation.Parameters.Add(new OpenApiParameter
                    {
                        Name = parameterName,
                        // Use explicit cast to handle nullable ParameterLocation
                        In = (Microsoft.OpenApi.Models.ParameterLocation)"FormData",
                        Schema = new OpenApiSchema
                        {
                            Type = "string",
                            Format = "binary",
                            Description = "Upload file"
                        }
                    });
                }
            }
        }
    }
}