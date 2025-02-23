import { ReactThreeFiber } from '@react-three/fiber'    
import { DirectionalLight } from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      directionalLight: ReactThreeFiber.Object3DNode<DirectionalLight, typeof DirectionalLight>
    }
  }
}