import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const frontendBaseUrl =
      this.node.tryGetContext("frontendBaseUrl") ?? "http://localhost:3000";
    const googleClientId =
      process.env.GOOGLE_CLIENT_ID
      ?? this.node.tryGetContext("googleClientId");
    const googleClientSecret =
      process.env.GOOGLE_CLIENT_SECRET
      ?? this.node.tryGetContext("googleClientSecret");

    if (!googleClientId || !googleClientSecret) {
      throw new Error(
        "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or pass --context googleClientId=... --context googleClientSecret=...",
      );
    }

    // ── Cognito User Pool ──────────────────────────────────────────────
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${id}-UserPool`,
      selfSignUpEnabled: false, // sign-up only via IdP
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Google Identity Provider ───────────────────────────────────────
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "GoogleProvider",
      {
        userPool: this.userPool,
        clientId: googleClientId,
        clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),
        scopes: ["openid", "email", "profile"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          fullname: cognito.ProviderAttribute.GOOGLE_NAME,
          profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
        },
      },
    );

    // ── User Pool Domain ───────────────────────────────────────────────
    const domainPrefix =
      this.node.tryGetContext("cognitoDomainPrefix") ?? `ichiban-kuji-${cdk.Aws.ACCOUNT_ID}`;
    this.userPool.addDomain("CognitoDomain", {
      cognitoDomain: { domainPrefix },
    });

    // ── User Pool Client ───────────────────────────────────────────────
    this.userPoolClient = this.userPool.addClient("AppClient", {
      userPoolClientName: `${id}-AppClient`,
      generateSecret: false,
      oAuth: {
        flows: { implicitCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [`${frontendBaseUrl}/login/callback`],
        logoutUrls: [`${frontendBaseUrl}/`],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
    });

    // Ensure providers are created before the client
    this.userPoolClient.node.addDependency(googleProvider);

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "CognitoDomainUrl", {
      value: `https://${domainPrefix}.auth.${cdk.Aws.REGION}.amazoncognito.com`,
    });
  }
}
