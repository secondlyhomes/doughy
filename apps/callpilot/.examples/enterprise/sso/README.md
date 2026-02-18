# Single Sign-On (SSO) Implementation Guide

Complete guide to implementing enterprise SSO in your React Native + Expo + Supabase application.

## Supported Protocols

- **SAML 2.0**: Enterprise standard (Okta, Azure AD, OneLogin)
- **OAuth 2.0**: Social and enterprise (Google, GitHub, GitLab)
- **OpenID Connect (OIDC)**: Modern standard (Auth0, Keycloak)

## Quick Start

### 1. Configure SSO Provider

```tsx
import { useSSO } from './contexts/SSOContext'

const { createProvider } = useSSO()

// SAML (Okta example)
await createProvider({
  type: 'saml',
  name: 'Okta',
  domain: 'company.com',
  settings: {
    ssoUrl: 'https://company.okta.com/app/abc/sso/saml',
    entityId: 'yourapp',
    certificate: 'MII...',
  },
})
```

### 2. Sign In with SSO

```tsx
const { signInWithSSO } = useSSO()

// Auto-detects provider by email domain
await signInWithSSO('user@company.com')
```

## SAML 2.0 Configuration

### Okta Setup

1. **Create SAML App in Okta**
   - App name: Your App Name
   - Single sign on URL: `yourapp://sso/callback`
   - Audience URI: `yourapp`

2. **Configure Attribute Mappings**
   - `email` → `user.email`
   - `firstName` → `user.firstName`
   - `lastName` → `user.lastName`

3. **Download Certificate**
   - Copy IdP metadata or certificate

4. **Configure in App**
```tsx
await createProvider({
  type: 'saml',
  name: 'Okta',
  domain: 'company.com',
  settings: {
    ssoUrl: 'https://company.okta.com/app/abc123/sso/saml',
    entityId: 'yourapp',
    certificate: 'MIIDpDCCAoygAwIBA...',
    signRequests: true,
    wantAssertionsSigned: true,
  },
})
```

### Azure AD Setup

Similar to Okta but with Azure-specific endpoints:

```tsx
await createProvider({
  type: 'saml',
  name: 'Azure AD',
  domain: 'company.com',
  settings: {
    ssoUrl: 'https://login.microsoftonline.com/{tenant}/saml2',
    entityId: 'yourapp',
    certificate: '...',
  },
})
```

## OAuth 2.0 Configuration

### Google Workspace

```tsx
await createProvider({
  type: 'oauth',
  name: 'Google',
  domain: 'company.com',
  settings: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    scope: 'openid email profile',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo',
  },
})
```

## OIDC Configuration

### Auth0

```tsx
await createProvider({
  type: 'oidc',
  name: 'Auth0',
  domain: 'company.com',
  settings: {
    issuer: 'https://company.auth0.com/',
    authorizationUrl: 'https://company.auth0.com/authorize',
    tokenUrl: 'https://company.auth0.com/oauth/token',
    userInfoUrl: 'https://company.auth0.com/userinfo',
    jwksUrl: 'https://company.auth0.com/.well-known/jwks.json',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    scope: 'openid email profile',
  },
})
```

## Just-In-Time (JIT) Provisioning

Automatically create users on first SSO login:

```typescript
async function provisionUser(samlAttributes: any): Promise<void> {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', samlAttributes.email)
    .single()

  if (!existingUser) {
    // Create user
    await supabase.from('users').insert({
      email: samlAttributes.email,
      full_name: samlAttributes.name,
      sso_provider: 'saml',
      sso_attributes: samlAttributes,
    })

    // Auto-add to organization
    await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: newUser.id,
      role: 'member',
    })
  }
}
```

## Security Best Practices

1. **Validate SAML Assertions**: Always verify signature and timestamps
2. **Use HTTPS**: Enforce TLS for all SSO endpoints
3. **Implement CSRF Protection**: Use state parameter in OAuth/OIDC
4. **Certificate Rotation**: Support multiple valid certificates
5. **Audit SSO Logins**: Log all SSO authentication attempts

## Testing SSO

```typescript
describe('SSO Authentication', () => {
  it('redirects to IdP for SAML login', async () => {
    const { signInWithSSO } = useSSO()

    const promise = signInWithSSO('user@company.com')

    // Should open browser to IdP
    await expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      expect.stringContaining('idp.company.com'),
      expect.any(String)
    )
  })

  it('handles SAML callback and creates session', async () => {
    const { handleCallback } = useSSO()

    const samlResponse = 'base64-encoded-saml-response'
    await handleCallback(`yourapp://sso/callback?SAMLResponse=${samlResponse}`)

    // Should be authenticated
    expect(currentUser).toBeTruthy()
  })
})
```

## Troubleshooting

### SAML Issues

**Assertion Invalid**:
- Check clock skew (IdP and app times must be synchronized)
- Verify certificate is correct
- Ensure audience matches entity ID

**Redirect Loop**:
- Check callback URL configuration
- Verify app scheme is registered

### OAuth Issues

**Token Exchange Failing**:
- Verify client secret
- Check redirect URI matches exactly
- Ensure token endpoint is correct

## Production Checklist

- [ ] SSO providers configured for production domains
- [ ] Certificates validated and backed up
- [ ] Callback URLs whitelisted in IdP
- [ ] Error handling for failed SSO attempts
- [ ] Audit logging for SSO events
- [ ] Fallback authentication method available
- [ ] JIT provisioning tested
- [ ] SSO tested with actual IdP

## Resources

- [SAML 2.0 Technical Overview](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [Okta SAML Setup](https://developer.okta.com/docs/guides/build-sso-integration/saml2/main/)
- [Azure AD SAML](https://docs.microsoft.com/en-us/azure/active-directory/develop/single-sign-on-saml-protocol)
