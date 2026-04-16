import { NextRequest, NextResponse } from 'next/server';

// This route proxies all OKX API calls from the agent runtime
// Agent calls: POST/GET http://localhost:3000/api/okx/v5/dex/...
// This forwards to:  https://www.okx.com/api/v5/dex/...

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToOKX(req, path, 'GET');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToOKX(req, path, 'POST');
}

async function proxyToOKX(req: NextRequest, pathSegments: string[], method: string) {
  const path = pathSegments.join('/');
  const search = req.nextUrl.search;
  // Agent sends paths like /api/v5/dex/... so strip leading 'api/' if present
  const cleanPath = path.startsWith('api/') ? path.slice(4) : path;
  const targetUrl = `https://www.okx.com/api/${cleanPath}${search}`;

  // Forward all OKX auth headers from the agent
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const forwardHeaders = [
    'OK-ACCESS-KEY',
    'OK-ACCESS-SIGN',
    'OK-ACCESS-TIMESTAMP',
    'OK-ACCESS-PASSPHRASE',
    'OK-ACCESS-PROJECT',
  ];

  forwardHeaders.forEach(h => {
    const val = req.headers.get(h);
    if (val) headers[h] = val;
  });

  const body = method === 'POST' ? await req.text() : undefined;

  const res = await fetch(targetUrl, { method, headers, body });
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
