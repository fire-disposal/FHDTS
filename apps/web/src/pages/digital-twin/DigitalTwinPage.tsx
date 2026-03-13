import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Card } from 'antd'
import Scene from '../../components/digital-twin/Scene'

export function DigitalTwinPage() {
  return (
    <div style={{ height: 'calc(100vh - 128px)' }}>
      <Card
        title="数字孪生场景"
        style={{ height: '100%' }}
        bodyStyle={{ padding: 0, height: '100%' }}
      >
        <Canvas style={{ width: '100%', height: '100%' }}>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Scene />
        </Canvas>
      </Card>
    </div>
  )
}

export default DigitalTwinPage
