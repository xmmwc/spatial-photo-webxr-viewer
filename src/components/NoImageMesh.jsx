import * as THREE from 'three';
import { useTexture } from "@react-three/drei";

export default function NoImageMesh() {
    const [immersiveLoadingTexture] = useTexture([`${import.meta.env.BASE_URL}/NoImage.jpg`], ([tex]) => {
        tex.repeat.set(2, 1);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    });

    return (
        <mesh
            position={[0, 0, 0]}
            scale={[-1, 1, 1]}
            layers={0}>
            <sphereGeometry args={[9.8, 140, 100, -Math.PI, 2 * Math.PI]} />
            <meshStandardMaterial
                side={THREE.BackSide}
                map={immersiveLoadingTexture} />
        </mesh>
    )
}