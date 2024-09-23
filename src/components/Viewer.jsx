import { Canvas } from '@react-three/fiber';
import { XR, XROrigin, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import ImmersiveImageMesh from './ImmersiveImageMesh';
import { useEffect, useRef, useState } from 'react';
import { PerspectiveCamera } from '@react-three/drei';

const store = createXRStore();
const DEFAULT_FOV = 75;
const DEFAULT_CAMERA_ROTATION = [0, 0, 0];
const DEFAULT_CAMERA_POSITION_M = [0, 0, 0];
const XR_ORIGIN_POSITION_M = [0, -1.25, 0];
const cameraLayers = new THREE.Layers();
cameraLayers.enable(0);
cameraLayers.enable(1);

const clamp = (val, min, max) => {
    return Math.min(Math.max(val, min), max);
}

const linearScale = (factor, minInput, maxInput, minOutput, maxOutput, shouldClamp = true) => {
    if (shouldClamp) {
        factor = clamp(factor, minInput, maxInput);
    }

    return minOutput + (maxOutput - minOutput) *
        (factor - minInput) / (maxInput - minInput);
}

export default function Viewer() {
    const [imageSrc, setImageSrc] = useState("");
    const [isInXR, setIsInXR] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const cameraRef = useRef();

    const resetFOV = () => {
        // Experimentally determined values
        cameraRef.current.fov = linearScale(window.innerWidth / window.innerHeight, 0.30, 2.5, 120, 70, true);
        cameraRef.current.updateProjectionMatrix();
    }

    const handleResize = () => {
        if (!isInXR && cameraRef.current) {
            resetFOV();
        }
    };

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
            resetFOV();
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

    const handleDrop = (e) => {
        e.preventDefault();

        setIsDraggingOver(false);

        if (!(e.dataTransfer.files && e.dataTransfer.files.length)) return;

        setImageSrc(URL.createObjectURL(e.dataTransfer.files[0]));
    }

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        setIsDraggingOver(false);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className='w-full h-full min-h-screen bg-black absolute flex items-center' onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
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

            <div className='fixed w-full flex justify-center bottom-0'>
                <div className='absolute mx-4 bottom-4 bg-white/80 flex justify-center items-stretch flex-wrap gap-y-4 gap-x-8 p-2 md:p-4 rounded-md'>
                    <div className='flex flex-col gap-1'>
                        <p className='font-semibold'>Drop or select an Apple Spatial Photo <span className='font-mono'>(.heic)</span></p>
                        <input className='cursor-pointer' type="file" accept=".heic" onChange={processBrowsedFile} />
                        <p className='text-xs italic'>Your photo is processed on your device.</p>
                    </div>

                    <button className='bg-amber-600 outline-double outline-0 hover:outline-2 active:outline-4 focus:outline-2 outline-white text-white px-8 py-2 font-semibold text-xl rounded-md transition-all duration-[25ms]' onClick={onXRButtonClicked}>{isInXR ? 'Exit' : 'Enter'} VR</button>
                </div>
            </div>

            <div className={`absolute inset-0 rounded-md border-dashed border-2 border-white bg-neutral-800/90 text-amber-500 font-semibold text-xl md:text-2xl flex-col gap-2 justify-center items-center ${isDraggingOver ? "flex" : "hidden"} pointer-events-none`}>
                <p className='pointer-events-none select-none'>Drop your Apple Spatial Photo</p>
                <p className='font-mono text-sm pointer-events-none select-none'>.heic</p>
            </div>
        </div>
    )
}