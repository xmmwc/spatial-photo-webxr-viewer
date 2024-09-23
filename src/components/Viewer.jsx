import { Canvas } from '@react-three/fiber';
import { XR, XROrigin, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import ImmersiveImageMesh from './ImmersiveImageMesh';
import { useRef, useState } from 'react';
import { PerspectiveCamera } from '@react-three/drei';

const store = createXRStore();
const DEFAULT_FOV = 75;
const DEFAULT_CAMERA_ROTATION = [0, 0, 0];
const DEFAULT_CAMERA_POSITION_M = [0, 0, 0];
const XR_ORIGIN_POSITION_M = [0, -1.25, 0];
const cameraLayers = new THREE.Layers();
cameraLayers.enable(0);
cameraLayers.enable(1);

export default function Viewer() {
    const [imageSrc, setImageSrc] = useState("");
    const [isInXR, setIsInXR] = useState(false);
    const cameraRef = useRef();

    const processBrowsedFile = (e) => {
        if (!(e.target.files && e.target.files.length)) return;

        setImageSrc(URL.createObjectURL(e.target.files[0]));
    }

    store.subscribe((state) => {
        let newIsInXR;
        if (state && state.session) {
            newIsInXR = true;
        } else {
            newIsInXR = false;
        }

        if (isInXR === newIsInXR) return;

        if (!newIsInXR && cameraRef.current) {
            cameraRef.current.rotation.set(...DEFAULT_CAMERA_ROTATION);
            cameraRef.current.position.set(...DEFAULT_CAMERA_POSITION_M);
            cameraRef.current.fov = DEFAULT_FOV;
            cameraRef.current.updateProjectionMatrix();
        }

        setIsInXR(newIsInXR);
    })

    const onXRButtonClicked = () => {
        if (isInXR) {
            store.getState().session?.end();
        } else {
            store.enterVR();
        }
    }

    return (
        <div className='w-full h-full min-h-screen bg-black absolute flex items-center'>
            <Canvas
                gl={{ toneMapping: THREE.LinearToneMapping }}>
                <PerspectiveCamera
                    makeDefault={true}
                    ref={cameraRef}
                    fov={DEFAULT_FOV}
                    position={DEFAULT_CAMERA_POSITION_M}
                    layers={cameraLayers} />
                <XR store={store}>
                    <XROrigin position={XR_ORIGIN_POSITION_M} />
                    <ambientLight intensity={Math.PI} />
                    <ImmersiveImageMesh imageSrc={imageSrc} />
                </XR>
            </Canvas>

            <div className='fixed left-1/2 -translate-x-1/2 bottom-0 bg-white/80 flex justify-center gap-4 p-4 rounded-t-md'>
                <div className='flex flex-col gap-1'>
                    <p className='font-semibold'>Select an Apple Spatial Photo <span className='font-mono'>(.heic)</span></p>
                    <input type="file" accept=".heic" onChange={processBrowsedFile} />
                    <p className='text-xs italic'>Your photo is processed on your device.</p>
                </div>

                <button className='bg-amber-600 border-0 hover:border-2 active:border-4 focus:border-2 border-solid text-white px-8 py-1 font-semibold text-xl rounded-md transition-all duration-[25ms]' onClick={onXRButtonClicked}>{isInXR ? 'Exit' : 'Enter'} VR</button>
            </div>
        </div>
    )
}