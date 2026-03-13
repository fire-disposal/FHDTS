import { createServer, type Socket } from 'node:net'
import msgpack from 'msgpack-lite'

export function startTcpServer(port: number) {
  const server = createServer((socket: Socket) => {
    console.log(`Client connected: ${socket.remoteAddress}`)

    socket.on('data', (data: Buffer) => {
      try {
        const decoded = msgpack.decode(data)
        console.log('Received IoT data:', decoded)

        socket.write(msgpack.encode({ status: 'ok' }))
      } catch (err) {
        console.error('Failed to decode msgpack:', err)
      }
    })

    socket.on('end', () => {
      console.log(`Client disconnected: ${socket.remoteAddress}`)
    })

    socket.on('error', err => {
      console.error('Socket error:', err)
    })
  })

  server.listen(port, () => {
    console.log(`TCP server listening on port ${port}`)
  })

  return server
}
