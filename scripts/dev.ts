import { spawn } from 'node:child_process'

const api = spawn('pnpm', ['exec', 'tsx', 'watch', 'server/index.ts'], { shell: true, stdio: 'inherit', env: { ...process.env, PORT: '8787' } })
const web = spawn('pnpm', ['exec', 'vite', '--host', '0.0.0.0'], { shell: true, stdio: 'inherit' })
const stop = () => { api.kill(); web.kill() }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
await Promise.all([new Promise(resolve => api.on('exit', resolve)), new Promise(resolve => web.on('exit', resolve))])
