import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Play,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Settings,
  Key,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Alert,
  Badge,
} from '@dauth/ui';

const AUTH_SERVER = 'http://localhost:3001';
const PLAYGROUND_REDIRECT_URI = 'http://localhost:5173/playground';

// Helper to decode JWT payload client-side
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

// Cryptographically secure random verifier generation
function generateCodeVerifier() {
  const array = new Uint8Array(43);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => dec.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 128);
}

// S256 Base64URL challenge generation
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate secure state parameter
function generateState() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => dec.toString(16).padStart(2, '0')).join('');
}

export default function OidcPlayground() {
  const location = useLocation();
  const navigate = useNavigate();

  // Clients state
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // Flow configuration state
  const [scopes, setScopes] = useState({
    openid: true,
    profile: true,
    email: true,
    offline_access: true,
  });
  const [usePkce, setUsePkce] = useState(true);
  const [stateParam, setStateParam] = useState('');
  const [codeVerifier, setCodeVerifier] = useState('');
  const [codeChallenge, setCodeChallenge] = useState('');

  // Flow outputs
  const [receivedCode, setReceivedCode] = useState('');
  const [receivedState, setReceivedState] = useState('');
  const [stateIsValid, setStateIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OIDC action states
  const [loading, setLoading] = useState(false);
  const [tokenResponse, setTokenResponse] = useState(null);
  const [userInfoResponse, setUserInfoResponse] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  // 1. Fetch clients on mount
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch(`${AUTH_SERVER}/api/clients`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
          
          // Select default seeded client if available
          const sample = data.clients?.find((c) => c.id === 'dauth_cli_sample_client');
          if (sample) {
            setSelectedClientId(sample.id);
            setClientSecret('dauth_sec_89dfj19h0fas89d12fjlkjas'); // Seeded plaintext secret
          } else if (data.clients?.length > 0) {
            setSelectedClientId(data.clients[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      }
    }
    fetchClients();
  }, []);

  // 2. Initialize or reload config parameters
  useEffect(() => {
    // Check if we are landing back from authorization redirect
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDesc = params.get('error_description');

    if (code) {
      setReceivedCode(code);
      setReceivedState(state || '');

      // Load parameters used when initiating flow
      const savedConfig = sessionStorage.getItem('dauth_playground_config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setSelectedClientId(config.clientId);
          setClientSecret(config.clientSecret);
          setScopes(config.scopes);
          setUsePkce(config.usePkce);
          setCodeVerifier(config.codeVerifier);
          setStateParam(config.stateParam);

          // Verify state
          if (config.stateParam === state) {
            setStateIsValid(true);
          }
        } catch (e) {
          console.error('Failed to restore playground configuration:', e);
        }
      }
    } else if (error) {
      setErrorMsg(`${error}: ${errorDesc || 'Authorization failed'}`);
    } else {
      // Generate clean new state parameters
      regenerateParameters();
    }
  }, [location.search]);

  // Regenerate verifier, state, and challenge
  const regenerateParameters = async () => {
    const state = generateState();
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    setStateParam(state);
    setCodeVerifier(verifier);
    setCodeChallenge(challenge);
    setErrorMsg('');
    setReceivedCode('');
    setReceivedState('');
    setTokenResponse(null);
    setUserInfoResponse(null);
  };

  // Build current Authorization URL
  const getAuthUrl = () => {
    const scopeStr = Object.keys(scopes)
      .filter((k) => scopes[k])
      .join(' ');

    const url = new URL(`${AUTH_SERVER}/authorize`);
    url.searchParams.append('client_id', selectedClientId);
    url.searchParams.append('redirect_uri', PLAYGROUND_REDIRECT_URI);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', scopeStr);
    url.searchParams.append('state', stateParam);

    if (usePkce) {
      url.searchParams.append('code_challenge', codeChallenge);
      url.searchParams.append('code_challenge_method', 'S256');
    }
    return url.toString();
  };

  // Launch OIDC flow
  const handleLaunchFlow = () => {
    // Save current parameters in session to reload on callback redirect
    const config = {
      clientId: selectedClientId,
      clientSecret,
      scopes,
      usePkce,
      codeVerifier,
      stateParam,
    };
    sessionStorage.setItem('dauth_playground_config', JSON.stringify(config));
    window.location.href = getAuthUrl();
  };

  // Exchange auth code for tokens
  const handleExchangeCode = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const bodyParams = {
        grant_type: 'authorization_code',
        code: receivedCode,
        redirect_uri: PLAYGROUND_REDIRECT_URI,
        client_id: selectedClientId,
      };

      if (usePkce) {
        bodyParams.code_verifier = codeVerifier;
      } else if (clientSecret) {
        bodyParams.client_secret = clientSecret;
      }

      // Convert body to form URL encoded
      const formBody = Object.keys(bodyParams)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(bodyParams[key]))
        .join('&');

      const res = await fetch(`${AUTH_SERVER}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Failed to exchange token');
      }

      setTokenResponse(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Call userinfo endpoint
  const handleCallUserInfo = async () => {
    if (!tokenResponse?.access_token) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${AUTH_SERVER}/userinfo`, {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Failed to fetch UserInfo claims');
      }

      setUserInfoResponse(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh tokens flow
  const handleRefreshTokens = async () => {
    if (!tokenResponse?.refresh_token) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const bodyParams = {
        grant_type: 'refresh_token',
        refresh_token: tokenResponse.refresh_token,
        client_id: selectedClientId,
      };

      if (clientSecret) {
        bodyParams.client_secret = clientSecret;
      }

      const formBody = Object.keys(bodyParams)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(bodyParams[key]))
        .join('&');

      const res = await fetch(`${AUTH_SERVER}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Failed to refresh tokens');
      }

      setTokenResponse(data);
      setUserInfoResponse(null); // Clear userinfo to fetch fresh claims
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear/Reset state
  const handleReset = () => {
    navigate('/playground');
    regenerateParameters();
  };

  // Copy text helper
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const idTokenClaims = tokenResponse?.id_token ? decodeJwt(tokenResponse.id_token) : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
            OIDC Playground
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Debug and learn OAuth 2.0 and OpenID Connect flows interactively.
          </p>
        </div>
        <Button variant="secondary" onClick={handleReset} className="flex items-center gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Reset Playground
        </Button>
      </div>

      {errorMsg && (
        <Alert variant="danger" title="OIDC Error Event">
          {errorMsg}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration & Step Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Configuration */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                1
              </span>
              <div>
                <CardTitle>OIDC Client & Flow Configuration</CardTitle>
                <CardDescription>Setup client details and auth flow parameters.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Client Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    OAuth Client Profile
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      const cli = clients.find((c) => c.id === e.target.value);
                      setClientSecret(cli?.clientSecret ? '*****' : '');
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.name} ({cli.id.substring(0, 12)}...)
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Client Secret (Required if non-PKCE)"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="e.g. client secret credentials"
                />
              </div>

              {/* Scopes & PKCE Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-250/40 dark:border-white/5">
                <div>
                  <span className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Requested Scopes
                  </span>
                  <div className="space-y-2">
                    {Object.keys(scopes).map((scopeName) => (
                      <label key={scopeName} className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scopes[scopeName]}
                          onChange={(e) => setScopes({ ...scopes, [scopeName]: e.target.checked })}
                          className="rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">
                          {scopeName}
                        </code>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Proof Key for Code Exchange (PKCE)
                    </span>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePkce}
                        onChange={(e) => setUsePkce(e.target.checked)}
                        className="rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span>Enforce PKCE Flow (S256 Method)</span>
                    </label>
                  </div>

                  <div className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed border-t border-gray-200 dark:border-white/5 pt-3">
                    PKCE uses code challenge parameters to block authorization code theft on public clients.
                  </div>
                </div>
              </div>

              {/* URL Preview */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Generated Authorization URL
                </span>
                <div className="relative">
                  <div className="bg-gray-950 text-indigo-300 p-3 rounded-lg font-mono text-[11px] break-all pr-12 max-h-24 overflow-y-auto">
                    {getAuthUrl()}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(getAuthUrl(), 'authurl')}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                    title="Copy URL"
                  >
                    {copiedText === 'authurl' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button variant="primary" onClick={handleLaunchFlow} className="w-full flex items-center justify-center gap-1.5">
                <Play className="h-4 w-4" /> Start Authorization Handshake
              </Button>

            </CardContent>
          </Card>

          {/* Step 2: Callback Parsing (conditional) */}
          {receivedCode && (
            <Card className="animate-fadeIn">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  2
                </span>
                <div>
                  <CardTitle>Redirect Callback Handler</CardTitle>
                  <CardDescription>Server returned OIDC authorization parameters.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Authorization Code (code)
                    </label>
                    <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/5 px-3 py-2 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-200 truncate select-all">
                      {receivedCode}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      State Parameter Verification
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/5 px-3 py-2 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-200 truncate select-all">
                        {receivedState || 'No state returned'}
                      </div>
                      {stateIsValid ? (
                        <Badge variant="success" className="h-8 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="h-8 flex items-center justify-center">
                          <AlertCircle className="h-3.5 w-3.5 mr-1" /> Invalid
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {!tokenResponse && (
                  <Button variant="primary" onClick={handleExchangeCode} disabled={loading} className="w-full flex items-center justify-center gap-1.5">
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Exchange Auth Code for Tokens
                  </Button>
                )}

              </CardContent>
            </Card>
          )}

          {/* Step 3: Call UserInfo (conditional) */}
          {tokenResponse?.access_token && (
            <Card className="animate-fadeIn">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold text-sm">
                  3
                </span>
                <div>
                  <CardTitle>Verify Profile & UserInfo Claims</CardTitle>
                  <CardDescription>Retrieve signed user credentials using Access Token.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                
                <div className="p-3 bg-gray-50 dark:bg-zinc-900/30 border border-gray-200 dark:border-white/5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="font-bold text-green-600 font-mono">GET</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">URL Endpoint</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-200">{AUTH_SERVER}/userinfo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Authorization header</span>
                    <span className="font-mono text-indigo-500 dark:text-indigo-400 truncate max-w-[250px]">
                      Bearer {tokenResponse.access_token.substring(0, 20)}...
                    </span>
                  </div>
                </div>

                {!userInfoResponse && (
                  <Button variant="primary" onClick={handleCallUserInfo} disabled={loading} className="w-full flex items-center justify-center gap-1.5">
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    Fetch UserInfo Claims
                  </Button>
                )}

              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column: Console Terminal / Output Logs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* OIDC Console Monitor Terminal */}
          <Card className="h-full flex flex-col bg-gray-950 border border-gray-800 text-zinc-300">
            <CardHeader className="border-b border-zinc-800 pb-3 bg-zinc-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                  <CardTitle className="text-sm font-semibold text-white">OIDC Console Monitor</CardTitle>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-4 font-mono text-xs overflow-y-auto min-h-[480px]">
              
              {/* Parameters debug */}
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans mb-1.5">Configuration Params</p>
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded p-2.5 space-y-1 text-zinc-400 font-mono">
                  <div><span className="text-zinc-500">scope:</span> {Object.keys(scopes).filter((k) => scopes[k]).join(', ')}</div>
                  <div><span className="text-zinc-500">pkce:</span> {usePkce ? 'enabled' : 'disabled'}</div>
                  <div><span className="text-zinc-500">state:</span> {stateParam}</div>
                  {usePkce && (
                    <>
                      <div><span className="text-zinc-500">code_verifier:</span> {codeVerifier.substring(0, 16)}...</div>
                      <div><span className="text-zinc-500">code_challenge:</span> {codeChallenge.substring(0, 16)}...</div>
                    </>
                  )}
                </div>
              </div>

              {/* Token endpoint response */}
              {tokenResponse && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans">Token Endpoint Response</p>
                    {tokenResponse.refresh_token && (
                      <button
                        onClick={handleRefreshTokens}
                        disabled={loading}
                        className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none"
                      >
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Tokens
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <pre className="bg-zinc-900/60 border border-zinc-800/80 rounded p-2.5 text-emerald-450 overflow-x-auto select-all max-h-56">
                      {JSON.stringify(tokenResponse, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(tokenResponse, null, 2), 'tokens')}
                      className="absolute top-2 right-2 p-1 bg-zinc-850 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                      title="Copy response"
                    >
                      {copiedText === 'tokens' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Decoded ID Token claims */}
              {idTokenClaims && (
                <div className="space-y-2 animate-fadeIn">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans">Decoded ID Token Claims</p>
                  <pre className="bg-zinc-900/60 border border-zinc-800/80 rounded p-2.5 text-blue-400 overflow-x-auto select-all max-h-48">
                    {JSON.stringify(idTokenClaims, null, 2)}
                  </pre>
                </div>
              )}

              {/* UserInfo endpoint response */}
              {userInfoResponse && (
                <div className="space-y-2 animate-fadeIn">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans">UserInfo Response</p>
                  <div className="relative">
                    <pre className="bg-zinc-900/60 border border-zinc-800/80 rounded p-2.5 text-indigo-400 overflow-x-auto select-all max-h-48">
                      {JSON.stringify(userInfoResponse, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(userInfoResponse, null, 2), 'userinfo')}
                      className="absolute top-2 right-2 p-1 bg-zinc-850 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                      title="Copy response"
                    >
                      {copiedText === 'userinfo' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              )}

              {!receivedCode && (
                <div className="text-zinc-600 text-xs italic font-sans py-12 text-center">
                  Launch the authorization handshake flow above to begin capturing OIDC requests.
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
