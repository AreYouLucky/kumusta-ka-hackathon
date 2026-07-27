import { BadgeCheck, LoaderCircle, ScanLine, X } from 'lucide-react';
import QRCode from 'qrcode';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { CitizenProfile } from '../types';

type PersonalQrDialogProps = {
    isOpen: boolean;
    profile: CitizenProfile;
    onClose: () => void;
};

function formatFullName(profile: CitizenProfile): string {
    return [profile.first_name, profile.middle_name, profile.last_name, profile.suffix]
        .filter((namePart): namePart is string => Boolean(namePart))
        .join(' ');
}

function getInitials(profile: CitizenProfile): string {
    return [profile.first_name, profile.last_name]
        .filter(Boolean)
        .map((namePart) => namePart.charAt(0).toUpperCase())
        .join('');
}

export function PersonalQrDialog({ isOpen, profile, onClose }: PersonalQrDialogProps): JSX.Element | null {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isActive = true;
        setQrDataUrl(null);

        void QRCode.toDataURL(`KUMUSTAKA_MEMBER:${profile.id}`, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 320,
            color: {
                dark: '#075985',
                light: '#ffffff',
            },
        }).then((dataUrl) => {
            if (isActive) {
                setQrDataUrl(dataUrl);
            }
        });

        return () => {
            isActive = false;
        };
    }, [isOpen, profile.id]);

    if (!isOpen) {
        return null;
    }

    const fullName = formatFullName(profile);

    return createPortal(
        <div
            className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="personal-qr-title"
                className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
            >
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold tracking-[0.16em] text-sky-600 uppercase">My member code</p>
                        <h2 id="personal-qr-title" className="mt-1 text-xl font-black text-black">
                            Share your profile
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close member code"
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-sky-50 p-3 text-left">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-600 text-xs font-black text-white">
                        {getInitials(profile) || 'KA'}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-extrabold text-black">{fullName}</p>
                            <BadgeCheck className="size-4 shrink-0 text-sky-500" aria-hidden="true" />
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[10px] font-bold text-slate-500">@{profile.username}</p>
                    </div>
                </div>

                <div className="mt-4 grid min-h-52 place-items-center rounded-2xl border border-sky-200 bg-sky-50/60 p-5 text-center">
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt={`Member QR code for ${fullName}`} className="size-52 rounded-xl bg-white p-2 shadow-sm" />
                    ) : (
                        <LoaderCircle className="size-10 animate-spin text-sky-500" aria-label="Generating member QR code" />
                    )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-sky-700">
                    <ScanLine className="size-4" aria-hidden="true" />
                    Scan this code to add me to a circle
                </div>
            </div>
        </div>,
        document.body,
    );
}
