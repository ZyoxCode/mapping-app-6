export function toAbsoluteUrl(relativePath: string): string {
    return new URL(relativePath, window.location.href).href;
}

export async function pathExists(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok && !res.headers.get('content-type')?.includes('text/html');
    } catch {
        return false;
    }
}