import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
    const googleClientId = cdk.Fn.importValue("GoogleClientId");
    const googleClientSecret = cdk.Fn.importValue("GoogleClientSecret");

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

    // ── LINE OIDC Identity Provider ────────────────────────────────────
    const lineChannelId = cdk.Fn.importValue("LineChannelId");
    const lineChannelSecret = cdk.Fn.importValue("LineChannelSecret");

    const lineProvider = new cognito.UserPoolIdentityProviderOidc(
      this,
      "LineProvider",
      {
        userPool: this.userPool,
        name: "LINE",
        clientId: lineChannelId,
        clientSecret: lineChannelSecret,
        issuerUrl: "https://access.line.me",
        scopes: ["openid", "profile", "email"],
        attributeMapping: {
          email: cognito.ProviderAttribute.other("email"),
          fullname: cognito.ProviderAttribute.other("name"),
          profilePicture: cognito.ProviderAttribute.other("picture"),
        },
        endpoints: {
          authorization: "https://access.line.me/oauth2/v2.1/authorize",
          token: "https://api.line.me/oauth2/v2.1/token",
          userInfo: "https://api.line.me/v2/profile",
          jwksUri:
            "https://api.line.me/oauth2/v2.1/certs",
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
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ["http://localhost:3000/callback"],
        logoutUrls: ["http://localhost:3000/"],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.custom("LINE"),
      ],
    });

    // Ensure providers are created before the client
    this.userPoolClient.node.addDependency(googleProvider);
    this.userPoolClient.node.addDependency(lineProvider);

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
