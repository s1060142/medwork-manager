using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
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
            var formFileParams = context.ApiDescription.ActionDescriptor.Parameters
                .Where(p => p.ParameterType == typeof(Microsoft.AspNetCore.Http.IFormFile))
                .ToList();

            foreach (var param in formFileParams)
            {
                var parameterName = param.Name;
                if (string.IsNullOrEmpty(parameterName))
                    continue;

                var existingParam = operation.Parameters.FirstOrDefault(p => p.Name == parameterName);
                if (existingParam != null)
                {
                    operation.Parameters.Remove(existingParam);
                }

                operation.Parameters.Add(new OpenApiParameter
                {
                    Name = parameterName,
                    In = ParameterLocation.Query,
                    Schema = new OpenApiSchema
                    {
                        Type = JsonSchemaType.String,
                        Format = "binary",
                        Description = "Upload file"
                    },
                    Required = false
                });
            }
        }
    }
}