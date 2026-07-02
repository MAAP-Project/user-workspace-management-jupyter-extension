import { MAAP_API_ENDPOINTS } from '../constants';
import { PageConfig } from '@jupyterlab/coreutils';

export const BASE_URL = PageConfig.getBaseUrl();

type MaapSettings = {
  maapApiUrl: string;
  maapToken: string;
  workspaceBucket: string;
};

export type GetLatestSettings = () => Promise<MaapSettings>;

type RequestOptions = Omit<RequestInit, 'headers'> & {
  endpoint?: string;
  url?: string;
  auth?: boolean;
  headers?: Record<string, string>;
  rawBody?: boolean;
};

function joinUrl(base: string, path: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function readErrorPayload(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const j = await response.json();
      return typeof j === 'string' ? j : JSON.stringify(j);
    }
    return await response.text();
  } catch {
    return '';
  }
}


export function createMaapApi(getLatestSettings: GetLatestSettings) {
  /**
   * Single request helper: always reads latest settings right before calling fetch.
   */
  async function request<T = any>(opts: RequestOptions): Promise<T> {
    const { maapApiUrl, maapToken } = await getLatestSettings();

    const finalUrl =
      opts.url ??
      (opts.endpoint ? joinUrl(maapApiUrl, opts.endpoint) : undefined);

    if (!finalUrl) {
      throw new Error('request() requires either url or endpoint');
    }

    const headers: Record<string, string> = {
      ...(opts.headers ?? {})
    };

    // Only set JSON content-type by default when caller is NOT sending raw body
    if (!opts.rawBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (opts.auth) {
      headers['cpticket'] = maapToken;
    }

    const response = await fetch(finalUrl, {
      ...opts,
      headers
    });

    if (!response.ok) {
      const details = await readErrorPayload(response);
      throw new Error(details);
    }

    // Try JSON first; fall back to text if no JSON
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return (await response.json()) as T;
    }

    // If it isn't JSON, return text (as any)
    return (await response.text()) as any as T;
  }

  // -------------------------
  // API methods
  // -------------------------

  async function getPresigneds3Url(key: string, expiration: string, username: string): Promise<any> {
    try {
      const { workspaceBucket } = await getLatestSettings();
      let generatedEndpoint = MAAP_API_ENDPOINTS.GET_PRESIGNED_S3_URL.replace("{BUCKET}", workspaceBucket).replace("{KEY}", key).replace("{EXPIRATION}", expiration).replace("{USERNAME}", username);
      const presigneds3Url = await request<any>({
        endpoint: generatedEndpoint,
        method: 'GET',
        auth: true
      });

      if (!presigneds3Url) {
        throw new Error('Failed to get presigned s3 url.');
      }
      return presigneds3Url;
    } catch (err) {
      console.error(`Error getting presigned url "${err}`);
      return err;
    }
  }

  async function getEnvironmentsEndpoint(){
    const { maapApiUrl } = await getLatestSettings();
    return new URL(maapApiUrl + MAAP_API_ENDPOINTS.MAAP_API_CONFIG + "/" + window.location.host)
  }

  async function getProfileInformation() {
    try {
        const profileInformation = await request<any>({
            endpoint: MAAP_API_ENDPOINTS.PROFILE_INFORMATION,
            method: 'GET',
            auth: true
        });
        if (!profileInformation) {
            throw new Error('Failed to get profile information.');
        }
        return profileInformation;
    } catch (err) {
        console.error(err);
        return null;
    }


  }

  return {
    request,
    getPresigneds3Url,
    getEnvironmentsEndpoint,
    getProfileInformation
  };
}

export type MaapApi = ReturnType<typeof createMaapApi>;