export interface ApiResponse {
    ok: boolean;
    endpoint: string;
    mode: string;
    scenario: 'normal' | 'slow' | 'fail' | 'fail-window';
    correlationId: string;
    latencyMs: number;
    message: string;
    status: number;
    failWindowIndex?: number;
    inFailWindow?: boolean;
}

export async function callEndpoint(
    endpoint: 'profile' | 'search',
    mode: 'baseline' | 'hardened',
    scenario: 'normal' | 'slow' | 'fail' | 'fail-window'
): Promise<ApiResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const correlationId = Math.random().toString(36).substring(7);
    const start = Date.now();

    try {
        const response = await fetch(
            `${baseUrl}/api/${endpoint}?mode=${mode}&scenario=${scenario}`,
            {
                headers: {
                    'X-Correlation-Id': correlationId,
                },
            }
        );

        const data = await response.json();
        const end = Date.now();

        return {
            ...data,
            status: response.status,
            latencyMs: data.latencyMs || (end - start), // Fallback to client-side measurement if needed
        };
    } catch (error: any) {
        const end = Date.now();
        return {
            ok: false,
            endpoint,
            mode,
            scenario,
            correlationId,
            latencyMs: end - start,
            message: error.message || 'Network error or backend unreachable',
            status: 500,
        };
    }
}

export async function getAdminStatus(): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/api/admin/status`);
    return response.json();
}

export async function resetLab(): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/api/admin/reset`, { method: 'POST' });
    return response.json();
}
