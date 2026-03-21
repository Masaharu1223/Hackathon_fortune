import type { APIGatewayProxyEvent } from "aws-lambda";

type CognitoClaims = Record<string, string>;

export function getCognitoClaims(
  event: APIGatewayProxyEvent,
): CognitoClaims | null {
  const claims = event.requestContext.authorizer?.claims;

  if (!claims || typeof claims !== "object") {
    return null;
  }

  return claims as CognitoClaims;
}

export function getUserId(event: APIGatewayProxyEvent): string | null {
  return getCognitoClaims(event)?.sub ?? null;
}

export function getUserEmail(event: APIGatewayProxyEvent): string | null {
  const email = getCognitoClaims(event)?.email;
  return email ? email.toLowerCase() : null;
}

export function getUserDisplayName(
  event: APIGatewayProxyEvent,
): string | null {
  const claims = getCognitoClaims(event);

  return (
    claims?.name
    ?? claims?.email
    ?? claims?.["cognito:username"]
    ?? null
  );
}
