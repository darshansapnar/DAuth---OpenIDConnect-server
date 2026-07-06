import crypto from 'crypto';

const AUTH_SERVER = 'http://localhost:3001';
const CLIENT_ID = 'dauth_cli_sample_client';
const CLIENT_SECRET = 'dauth_sec_89dfj19h0fas89d12fjlkjas';
const REDIRECT_URI = 'http://localhost:5174/callback';

async function runTests() {
  console.log('==================================================');
  console.log('STARTING DAUTH END-TO-END SPEC COMPLIANCE TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Parses Set-Cookie header and keeps track of active cookie jar
  let cookieJar = {};
  let csrfTokenVal = '';

  function parseCookies(res) {
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const rawCookies = setCookie.split(/,(?=\s*[a-zA-Z0-9_]+=)/);
      for (const raw of rawCookies) {
        const parts = raw.split(';')[0].trim().split('=');
        const name = parts[0];
        const val = parts.slice(1).join('=');
        cookieJar[name] = val;
        if (name === 'dauth_csrf') {
          csrfTokenVal = val;
        }
      }
    }
  }

  function getCookieHeader() {
    return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Discovery Endpoint
    // ----------------------------------------------------
    console.log('--- Test 1: Discovery Endpoint ---');
    const discoveryRes = await fetch(`${AUTH_SERVER}/.well-known/openid-configuration`);
    assert(discoveryRes.status === 200, 'Discovery returns 200 OK');
    const discovery = await discoveryRes.json();
    assert(discovery.issuer === 'http://localhost:3001', 'Discovery contains correct issuer');
    assert(discovery.authorization_endpoint, 'Discovery contains authorization_endpoint');
    assert(discovery.token_endpoint, 'Discovery contains token_endpoint');
    assert(discovery.jwks_uri, 'Discovery contains jwks_uri');
    assert(discovery.userinfo_endpoint, 'Discovery contains userinfo_endpoint');
    console.log('');

    // ----------------------------------------------------
    // TEST 2: JWKS Endpoint
    // ----------------------------------------------------
    console.log('--- Test 2: JWKS Endpoint ---');
    const jwksRes = await fetch(`${AUTH_SERVER}/jwks`);
    assert(jwksRes.status === 200, 'JWKS returns 200 OK');
    const jwks = await jwksRes.json();
    assert(Array.isArray(jwks.keys), 'JWKS contains keys array');
    assert(jwks.keys[0].kid === 'dauth_rsa_active_key', 'JWKS active key has correct kid');
    assert(jwks.keys[0].alg === 'RS256', 'JWKS active key has RS256 alg');
    console.log('');

    // ----------------------------------------------------
    // TEST 3: Negative Case - Invalid Client ID
    // ----------------------------------------------------
    console.log('--- Test 3: Invalid Client ID (No Redirect) ---');
    const invalidClientRes = await fetch(`${AUTH_SERVER}/authorize?client_id=invalid_client&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid`);
    assert(invalidClientRes.status === 400, 'Invalid client ID returns 400 Bad Request');
    const invalidClientHtml = await invalidClientRes.text();
    assert(invalidClientHtml.includes('OIDC Authorization Error') && invalidClientHtml.includes('not registered'), 'Renders error directly to protect against redirect hijacking');
    console.log('');

    // ----------------------------------------------------
    // TEST 4: Negative Case - Invalid Redirect URI
    // ----------------------------------------------------
    console.log('--- Test 4: Invalid Redirect URI (No Redirect) ---');
    const invalidRedirectRes = await fetch(`${AUTH_SERVER}/authorize?client_id=${CLIENT_ID}&redirect_uri=http://attacker.com/malicious&response_type=code&scope=openid`);
    assert(invalidRedirectRes.status === 400, 'Invalid redirect URI returns 400 Bad Request');
    const invalidRedirectHtml = await invalidRedirectRes.text();
    assert(invalidRedirectHtml.includes('Redirect URI mismatch'), 'Renders mismatch error directly on page');
    console.log('');

    // ----------------------------------------------------
    // TEST 5: Negative Case - Invalid Response Type (Standard Redirect-On-Error)
    // ----------------------------------------------------
    console.log('--- Test 5: Invalid Response Type (Redirect-On-Error) ---');
    const invalidResponseTypeRes = await fetch(`${AUTH_SERVER}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=openid&state=invalid_type_state`, {
      redirect: 'manual'
    });
    assert(invalidResponseTypeRes.status === 302, 'Invalid response_type returns 302 Redirect');
    const redirectLocation = invalidResponseTypeRes.headers.get('location');
    assert(redirectLocation.startsWith(REDIRECT_URI), 'Redirects back to redirect_uri');
    const redirectUrlParams = new URL(redirectLocation);
    assert(redirectUrlParams.searchParams.get('error') === 'unsupported_response_type', 'Includes error unsupported_response_type');
    assert(redirectUrlParams.searchParams.get('state') === 'invalid_type_state', 'Maintains state parameter');
    console.log('');

    // ----------------------------------------------------
    // TEST 6: User Registration
    // ----------------------------------------------------
    console.log('--- Test 6: User Registration ---');
    const randomEmail = `testuser_${crypto.randomBytes(4).toString('hex')}@dauth.io`;
    const regRes = await fetch(`${AUTH_SERVER}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail,
        password: 'Password123',
        name: 'Test OIDC User'
      })
    });
    assert(regRes.status === 201, 'User registration returns 201 Created');
    parseCookies(regRes);
    const regData = await regRes.json();
    assert(regData.success === true, 'Registration reports success');
    console.log('');

    // ----------------------------------------------------
    // TEST 7: User Login & Session Persistence
    // ----------------------------------------------------
    console.log('--- Test 7: User Login & Session ---');
    const loginRes = await fetch(`${AUTH_SERVER}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail,
        password: 'Password123'
      })
    });
    assert(loginRes.status === 200, 'Login returns 200 OK');
    parseCookies(loginRes);
    console.log('[DEBUG] parsed Cookie header:', getCookieHeader());
    console.log('[DEBUG] parsed CSRF token:', csrfTokenVal);
    console.log('');

    // ----------------------------------------------------
    // TEST 8: Positive Flow - Authorize and Redirect to Consent
    // ----------------------------------------------------
    console.log('--- Test 8: Authorize GET Redirects to Consent ---');
    const stateParam = 'state_handshake_123';
    const nonceParam = 'nonce_secret_abc';
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

    const authRes = await fetch(
      `${AUTH_SERVER}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid+profile+email+offline_access&state=${stateParam}&nonce=${nonceParam}&code_challenge=${challenge}&code_challenge_method=S256`,
      {
        headers: { Cookie: getCookieHeader() },
        redirect: 'manual'
      }
    );

    const authRedirect = authRes.headers.get('location');
    console.log('[DEBUG] authRes status:', authRes.status);
    console.log('[DEBUG] authRedirect location:', authRedirect);

    assert(authRes.status === 302, 'Authorize GET returns 302 Redirect');
    const absoluteAuthRedirect = new URL(authRedirect, AUTH_SERVER);
    assert(absoluteAuthRedirect.pathname === '/consent', 'Redirects to /consent view');
    console.log('');

    // ----------------------------------------------------
    // TEST 9: Consent Approval Screen POST
    // ----------------------------------------------------
    console.log('--- Test 9: Consent Approval POST ---');
    const consentRes = await fetch(`${AUTH_SERVER}/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSR-Token': csrfTokenVal,
        Cookie: getCookieHeader()
      },
      body: `approval=approve&_csrf=${csrfTokenVal}`,
      redirect: 'manual'
    });
    console.log('[DEBUG] consentRes status:', consentRes.status);
    console.log('[DEBUG] consentRes location:', consentRes.headers.get('location'));
    assert(consentRes.status === 302 || consentRes.status === 200, 'POST /consent approves and redirects');

    const finalAuthorizeUrlRes = await fetch(
      `${AUTH_SERVER}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid+profile+email+offline_access&state=${stateParam}&nonce=${nonceParam}&code_challenge=${challenge}&code_challenge_method=S256`,
      {
        headers: { Cookie: getCookieHeader() },
        redirect: 'manual'
      }
    );

    assert(finalAuthorizeUrlRes.status === 302, 'Final Authorize call yields 302 redirect back to client callback');
    const finalRedirectLocation = finalAuthorizeUrlRes.headers.get('location');
    assert(finalRedirectLocation.startsWith(REDIRECT_URI), 'Location matches callback URL');
    const finalRedirectParams = new URL(finalRedirectLocation);
    const code = finalRedirectParams.searchParams.get('code');
    const returnedState = finalRedirectParams.searchParams.get('state');
    assert(code && code.startsWith('dauth_code_'), 'Code parameter returned correctly');
    assert(returnedState === stateParam, 'State parameter verified');
    console.log('');

    // ----------------------------------------------------
    // TEST 10: Token Exchange
    // ----------------------------------------------------
    console.log('--- Test 10: Token Exchange (Code -> Tokens) ---');
    const tokenRes = await fetch(`${AUTH_SERVER}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code_verifier=${verifier}`
    });

    assert(tokenRes.status === 200, 'Token exchange returns 200 OK');
    const tokens = await tokenRes.json();
    assert(tokens.access_token, 'Access token issued');
    assert(tokens.id_token, 'ID token issued');
    assert(tokens.refresh_token, 'Refresh token issued');
    assert(tokens.token_type === 'Bearer', 'Token type is Bearer');

    // Decode ID Token to verify nonce
    const idTokenParts = tokens.id_token.split('.');
    const idTokenClaims = JSON.parse(Buffer.from(idTokenParts[1], 'base64url').toString('utf8'));
    assert(idTokenClaims.nonce === nonceParam, 'ID token contains correct nonce mapping');
    assert(idTokenClaims.email === randomEmail, 'ID token contains user email scope claim');
    assert(idTokenClaims.name === 'Test OIDC User', 'ID token contains profile name claim');
    console.log('');

    // ----------------------------------------------------
    // TEST 11: UserInfo Endpoint (GET & POST)
    // ----------------------------------------------------
    console.log('--- Test 11: UserInfo Endpoint Queries ---');
    const uiGetRes = await fetch(`${AUTH_SERVER}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    assert(uiGetRes.status === 200, 'GET /userinfo returns 200 OK');
    const claimsGet = await uiGetRes.json();
    assert(claimsGet.email === randomEmail, 'GET /userinfo returns email claim');
    assert(claimsGet.name === 'Test OIDC User', 'GET /userinfo returns profile claims');

    const uiPostRes = await fetch(`${AUTH_SERVER}/userinfo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    assert(uiPostRes.status === 200, 'POST /userinfo returns 200 OK');
    const claimsPost = await uiPostRes.json();
    assert(claimsPost.email === randomEmail, 'POST /userinfo returns email claim');
    console.log('');

    // ----------------------------------------------------
    // TEST 12: Refresh Token Rotation
    // ----------------------------------------------------
    console.log('--- Test 12: Refresh Token Grant ---');
    const refreshRes = await fetch(`${AUTH_SERVER}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${tokens.refresh_token}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    });
    assert(refreshRes.status === 200, 'Token refresh returns 200 OK');
    const refreshedTokens = await refreshRes.json();
    assert(refreshedTokens.access_token && refreshedTokens.id_token, 'Successfully rotated tokens');
    assert(refreshedTokens.refresh_token, 'Returned refresh token');
    console.log('');

    // ----------------------------------------------------
    // TEST 13: Reused Code (Negative Case)
    // ----------------------------------------------------
    console.log('--- Test 13: Reused Code Replay Attack Protection ---');
    const replayRes = await fetch(`${AUTH_SERVER}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code_verifier=${verifier}`
    });
    assert(replayRes.status === 400, 'Reused code returns 400 Bad Request');
    const replayErr = await replayRes.json();
    assert(replayErr.error === 'invalid_grant', 'Returns invalid_grant error code');
    console.log('');

    // ----------------------------------------------------
    // TEST 14: Invalid PKCE Verifier (Negative Case)
    // ----------------------------------------------------
    console.log('--- Test 14: Invalid PKCE Verifier ---');
    // Get a new code
    const secondCodeRes = await fetch(
      `${AUTH_SERVER}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid&state=state_second&code_challenge=${challenge}&code_challenge_method=S256`,
      {
        headers: { Cookie: getCookieHeader() },
        redirect: 'manual'
      }
    );
    const secondRedirectLocation = secondCodeRes.headers.get('location');
    const secondRedirectParams = new URL(secondRedirectLocation, AUTH_SERVER);
    const secondCode = secondRedirectParams.searchParams.get('code');

    // Exchange with invalid verifier
    const badPkceRes = await fetch(`${AUTH_SERVER}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&code=${secondCode}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code_verifier=bad_verifier_value`
    });
    assert(badPkceRes.status === 400, 'Incorrect code_verifier returns 400 Bad Request');
    const badPkceErr = await badPkceRes.json();
    assert(badPkceErr.error === 'invalid_grant', 'Returns invalid_grant error code');
    console.log('');

    // ----------------------------------------------------
    // TEST 15: Denied Consent Redirect
    // ----------------------------------------------------
    console.log('--- Test 15: Denied Consent Redirect ---');
    // Trigger authorize flow
    await fetch(
      `${AUTH_SERVER}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid&state=consent_denied_state`,
      { headers: { Cookie: getCookieHeader() } }
    );
    // Deny consent
    const denyConsentRes = await fetch(`${AUTH_SERVER}/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: getCookieHeader()
      },
      body: `approval=deny&_csrf=${csrfTokenVal}`,
      redirect: 'manual'
    });
    assert(denyConsentRes.status === 302, 'Consent denial redirects back with 302');
    const denyRedirectLoc = denyConsentRes.headers.get('location');
    assert(denyRedirectLoc.startsWith(REDIRECT_URI), 'Redirects back to redirect_uri');
    const denyRedirectUrl = new URL(denyRedirectLoc);
    assert(denyRedirectUrl.searchParams.get('error') === 'access_denied', 'Contains error=access_denied');
    console.log('');

  } catch (err) {
    console.error('Fatal execution error inside test script:', err);
    failed++;
  }

  console.log('==================================================');
  console.log(`TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
