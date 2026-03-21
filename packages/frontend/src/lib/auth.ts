const COGNITO_DOMAIN = (process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '').replace(/\/$/, '');
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/login/callback';
const LOGOUT_URI = process.env.NEXT_PUBLIC_LOGOUT_URI || 'http://localhost:3000/';

const TOKEN_KEY = 'auth_token';

export function isAuthConfigured(): boolean {
  return Boolean(COGNITO_DOMAIN && CLIENT_ID);
}

export function getGoogleLoginUrl(): string {
  if (!isAuthConfigured()) {
    return '#';
  }

  const params = new URLSearchParams({
    response_type: 'token',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid email profile',
    identity_provider: 'Google',
  });
  return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export function parseTokenFromCallback(): string | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const idToken = params.get('id_token');
  const accessToken = params.get('access_token');

  const token = idToken || accessToken;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  clearToken();

  if (!isAuthConfigured()) {
    window.location.href = '/';
    return;
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: LOGOUT_URI,
  });
  window.location.href = `${COGNITO_DOMAIN}/logout?${params.toString()}`;
}
