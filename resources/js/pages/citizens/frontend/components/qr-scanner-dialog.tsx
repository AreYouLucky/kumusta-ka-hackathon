import { Camera, CameraOff, LoaderCircle, QrCode, X } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

type QrScannerDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onMemberDetected: () => void;
};

type CameraState = 'starting' | 'ready' | 'unavailable';

export function QrScannerDialog({ isOpen, onClose }: QrScannerDialogProps): JSX.Element | null {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraState, setCameraState] = useState<CameraState>('starting');

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isActive = true;
        let cameraStream: MediaStream | null = null;
        const videoElement = videoRef.current;

        async function startCamera(): Promise<void> {
            setCameraState('starting');

            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraState('unavailable');
                return;
            }

            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: { ideal: 'environment' } },
                });

                if (!isActive) {
                    cameraStream.getTracks().forEach((track) => track.stop());
                    return;
                }

                if (videoElement) {
                    videoElement.srcObject = cameraStream;
                    await videoElement.play();
                }

                setCameraState('ready');
            } catch {
                if (isActive) {
                    setCameraState('unavailable');
                }
            }
        }

        void startCamera();

        return () => {
            isActive = false;
            cameraStream?.getTracks().forEach((track) => track.stop());

            if (videoElement) {
                videoElement.srcObject = null;
            }
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="qr-dialog-title"
                className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                <div className="flex items-start gap-3 p-5 pb-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
                        <Camera className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 id="qr-dialog-title" className="text-lg font-black text-black">
                            Scan member QR code
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Align another user's Kumusta Ka QR code inside the frame.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close QR scanner"
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 size-full object-cover"
                        aria-label="Camera preview"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_38%,rgba(2,6,23,0.58)_39%)]" />

                    <div className="pointer-events-none absolute inset-x-[13%] top-1/2 aspect-square -translate-y-1/2 rounded-3xl border border-white/40">
                        <span className="absolute -top-0.5 -left-0.5 size-12 rounded-tl-3xl border-t-4 border-l-4 border-sky-400" />
                        <span className="absolute -top-0.5 -right-0.5 size-12 rounded-tr-3xl border-t-4 border-r-4 border-sky-400" />
                        <span className="absolute -bottom-0.5 -left-0.5 size-12 rounded-bl-3xl border-b-4 border-l-4 border-sky-400" />
                        <span className="absolute -right-0.5 -bottom-0.5 size-12 rounded-br-3xl border-r-4 border-b-4 border-sky-400" />
                        {cameraState === 'ready' && (
                            <span className="absolute inset-x-5 top-1/2 h-0.5 animate-pulse bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.95)]" />
                        )}
                    </div>

                    <div className="absolute inset-x-0 top-5 flex justify-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
                            {cameraState === 'starting' && <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />}
                            {cameraState === 'ready' && <span className="size-2 animate-pulse rounded-full bg-green-400" />}
                            {cameraState === 'unavailable' && <CameraOff className="size-3.5" aria-hidden="true" />}
                            {cameraState === 'starting'
                                ? 'Opening camera...'
                                : cameraState === 'ready'
                                  ? 'Scanning for QR code'
                                  : 'Camera unavailable'}
                        </span>
                    </div>

                    {cameraState === 'unavailable' && (
                        <div className="absolute inset-0 grid place-items-center px-8 text-center">
                            <div>
                                <QrCode className="mx-auto size-14 text-white/40" aria-hidden="true" />
                                <p className="mt-3 text-sm font-bold text-white">Allow camera access to scan a QR code.</p>
                                <p className="mt-1 text-xs leading-5 text-slate-300">Camera access requires permission and a secure connection.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
