declare module 'node:path' {
  export function dirname(path: string): string
  export function join(...paths: string[]): string
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string
}

declare const process: {
  env: Record<string, string | undefined>
  uptime: () => number
  on: (event: string, listener: () => void) => void
  exit: (code?: number) => never
}