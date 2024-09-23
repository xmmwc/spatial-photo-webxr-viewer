import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import ImmersiveImageMesh from './ImmersiveImageMesh';
import { useState } from 'react';

const store = createXRStore();
const DEFAULT_FOV = 75;
const DEFAULT_POSITION_M = [0, 0, 0];
const cameraLayers = new THREE.Layers();
cameraLayers.enable(0);
cameraLayers.enable(1);

export default function Viewer() {
    const [imageSrc, setImageSrc] = useState("");

    const processBrowsedFile = (e) => {
        if (!(e.target.files && e.target.files.length)) return;

        setImageSrc(URL.createObjectURL(e.target.files[0]));
    }

    return (
        <div className='w-full h-full min-h-screen bg-black absolute flex items-center'>
            <Canvas
                gl={{ toneMapping: THREE.LinearToneMapping }}
                camera={{ fov: DEFAULT_FOV, position: DEFAULT_POSITION_M, layers: cameraLayers }}>
                <XR store={store}>
                    <ambientLight intensity={Math.PI} />
                    <ImmersiveImageMesh imageSrc={imageSrc} />
                </XR>
            </Canvas>

            <div className='fixed left-1/2 -translate-x-1/2 bottom-0 bg-white/80 flex justify-center gap-4 p-4 rounded-t-md'>
                <div className='flex flex-col gap-1'>
                    <p className='text-sm font-semibold'>Select an Apple Spatial Photo <span className='font-mono'>(.heic)</span></p>
                    <input type="file" accept=".heic" onChange={processBrowsedFile} />
                    <p className='text-xs'>Your image is processed locally.</p>
                </div>
                
                <button className='bg-amber-600 text-white px-8 py-1 font-semibold text-xl rounded-md' onClick={() => store.enterAR()}>Enter AR</button>
            </div>
        </div>
    )
}