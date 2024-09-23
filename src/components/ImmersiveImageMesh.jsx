import { useThree } from "@react-three/fiber";
import heic2any from "heic2any";
import { useEffect, useState } from "react";
import * as THREE from 'three';
import LoadingMesh from "./LoadingMesh";
import NoImageMesh from "./NoImageMesh";

const MESH_POSITION_Z_M = -2;
const MESH_DEPTH_M = 0.01;
const MAX_HEIGHT_M = 2;
const SPATIAL_PHOTO_ASPECT_RATIO = 4 / 3;
const SCALED_WIDTH_M = SPATIAL_PHOTO_ASPECT_RATIO * MAX_HEIGHT_M;
const SCALED_HEIGHT_M = 1 / SPATIAL_PHOTO_ASPECT_RATIO * SCALED_WIDTH_M;
const loader = new THREE.TextureLoader();

export default function ImmersiveImageMesh({ imageSrc }) {
    const { gl } = useThree();
    const [spatialPhotoBlob, setSpatialPhotoBlob] = useState(null);
    const [immersiveImageTextureL, setImmersiveImageTextureL] = useState(null);
    const [immersiveImageTextureR, setImmersiveImageTextureR] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!imageSrc) return;

        setIsLoading(true);

        console.log(`Fetching HEIC at \`${imageSrc}\`...`);

        fetch(imageSrc)
            .catch((e) => {
                console.error(`Error fetching \`${imageSrc}\`:\n${JSON.stringify(e)}`);
                return;
            })
            .then((res) => {
                console.log(`Converting HEIC to blob...`);
                return res.blob();
            })
            .catch((e) => {
                console.error(`Error converting fetch response to blob:\n${JSON.stringify(e)}`);
                return;
            })
            .then((blob) => {
                if (!blob) return;
                console.log(`Converting HEIC blob to array of PNG images...`);
                return heic2any({
                    blob,
                    toType: "image/png",
                    multiple: true
                })
            })
            .catch((e) => {
                console.error(`Error converting HEIC to PNG:\n${JSON.stringify(e)}`);
                return;
            })
            .then((pngs) => {
                if (!pngs) return;
                console.log(`Loading PNG images into new \`img\` objects...`);

                if (pngs.length === 1) {
                    throw `Input image only contains one layer. Are you sure it's a Spatial Photo?`;
                }

                // Apple Spatial Photos contain three layers. Layer 1 can be discarded.
                // Layer 2 is the right eye image. Layer 3 is the left eye image.
                pngs.shift();

                const loadImages = (blobs) => {
                    const imgPromises = blobs.map(blob => {
                        return new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => resolve(img);
                            img.onerror = reject;
                            img.src = URL.createObjectURL(blob);
                        });
                    });

                    return Promise.all(imgPromises);
                }

                return loadImages(pngs);
            })
            .catch((e) => {
                console.error(`Error loading PNGs into \`img\` objects:\n${JSON.stringify(e)}`);
                return;
            })
            .then((imgs) => {
                if (!imgs) return;

                console.log(`Drawing PNG \`img\` objects onto a 3D SBS canvas...`);
                const [img1, img2] = imgs;

                const minWidth = Math.min(img1.width, img2.width);
                const minHeight = Math.min(img1.height, img2.height);

                // Create an offscreen canvas
                const offscreenCanvas = document.createElement('canvas');
                const ctx = offscreenCanvas.getContext('2d');

                if (!ctx) return;

                offscreenCanvas.width = minWidth * 2;
                offscreenCanvas.height = minHeight;

                // Draw the first image at the right of the canvas
                ctx.drawImage(img1, minWidth, 0, minWidth, minHeight);

                // Draw the second image to the left of the first image
                ctx.drawImage(img2, 0, 0, minWidth, minHeight);

                // Convert the canvas to a blob for display
                console.log(`Converting the 3D image canvas to a blob...`);
                offscreenCanvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(`Failed to create blob from canvas`);
                    }

                    const url = URL.createObjectURL(blob);
                    setSpatialPhotoBlob(url);
                });
            })
            .catch((e) => {
                console.error(`Error drawing images to canvas:\n${JSON.stringify(e)}`);
                return;
            })
    }, [imageSrc])

    useEffect(() => {
        if (!spatialPhotoBlob) return;

        loader.load(spatialPhotoBlob,
            (loadedTexture) => {
                loadedTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
                loadedTexture.generateMipmaps = false;

                loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
                loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
                loadedTexture.repeat.set(0.5, 1);
                loadedTexture.offset.set(0, 0);
                setImmersiveImageTextureL(loadedTexture);

                const clonedTexture = loadedTexture.clone();
                clonedTexture.wrapS = THREE.ClampToEdgeWrapping;
                clonedTexture.wrapT = THREE.ClampToEdgeWrapping;
                clonedTexture.repeat.set(0.5, 1);
                clonedTexture.offset.set(0.5, 0);
                setImmersiveImageTextureR(clonedTexture);

                setIsLoading(false);
                console.log(`Loaded texture at \`${imageSrc}\`!`);
            },
            undefined,
            () => {
                setIsLoading(false);
            });
    }, [spatialPhotoBlob])

    useEffect(() => {
        return () => {
            if (immersiveImageTextureL) {
                immersiveImageTextureL.dispose();
            }
        }
    }, [immersiveImageTextureL])

    useEffect(() => {
        return () => {
            if (immersiveImageTextureR) {
                immersiveImageTextureR.dispose();
            }
        }
    }, [immersiveImageTextureR])

    if (!imageSrc) {
        return <NoImageMesh />
    }
    
    if (isLoading) {
        return <LoadingMesh />;
    }

    return (
        <group
            position={[0, 0, MESH_POSITION_Z_M]}>
            <mesh
                layers={1}>
                <boxGeometry args={[SCALED_WIDTH_M, SCALED_HEIGHT_M, MESH_DEPTH_M]} />
                <meshStandardMaterial
                    map={immersiveImageTextureL}
                />
            </mesh>

            <mesh
                layers={2}>
                <boxGeometry args={[SCALED_WIDTH_M, SCALED_HEIGHT_M, MESH_DEPTH_M]} />
                <meshStandardMaterial
                    map={immersiveImageTextureR}
                />
            </mesh>
        </group>
    )
}