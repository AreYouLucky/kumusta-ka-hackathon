import NeedBackupModal from "@/Components/NeedBackupModal";
import NotFoundModal from "@/Components/NotFoundModal";
import RescuedConfirmModal from "@/Components/RescuedConfirmModal";
import { Head, Link, router } from "@inertiajs/react";
import {
    FaArrowLeft,
    FaCircleCheck,
    FaLocationDot,
    FaRadio,
    FaUserGroup,
} from "react-icons/fa6";
import { useState } from "react";

const statusTimeline = [
    {
        label: "Dispatch Accepted",
        detail: "Responder team acknowledged the request and is preparing equipment.",
    },
    {
        label: "En Route",
        detail: "Field unit is moving toward Purok Mabuhay Covered Court.",
    },
    {
        label: "Site Assessment",
        detail: "Initial flood and accessibility check will be performed on arrival.",
    },
];

export default function ResponderStatus() {
    const [showRescuedModal, setShowRescuedModal] = useState(false);
    const [showNotFoundModal, setShowNotFoundModal] = useState(false);
    const [showNeedBackupModal, setShowNeedBackupModal] = useState(false);

    return (
        <>
            <Head title="Responder Status" />

            <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                Responder Module
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold text-black">
                                Responder Status
                            </h1>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-50"
                        >
                            <FaArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                    </div>

                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                        Current Dispatch
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold text-black">
                                        Juan Dela Cruz Rescue Response
                                    </h2>
                                </div>

                                <div className="inline-flex rounded-lg border border-sky-500 bg-sky-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                                    In-Progress
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-2 text-black">
                                    <FaLocationDot className="h-4 w-4 text-sky-500" />
                                    <p className="text-sm font-semibold">
                                        Location
                                    </p>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-black">
                                    Purok Mabuhay Covered Court, Barangay San
                                    Isidro
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-2 text-black">
                                    <FaUserGroup className="h-4 w-4 text-sky-500" />
                                    <p className="text-sm font-semibold">
                                        Affected Group
                                    </p>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-black">
                                    2 adults, 1 child, 1 senior citizen with
                                    limited mobility
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-2 text-black">
                                    <FaRadio className="h-4 w-4 text-red-500" />
                                    <p className="text-sm font-semibold">
                                        Field Alert
                                    </p>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-black">
                                    Floodwater remains active. Boat access and
                                    medical support are recommended.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                Status Update
                            </p>
                            <h2 className="mt-1 text-xl font-semibold text-black">
                                Update Dispatch Outcome
                            </h2>
                        </div>

                        <div className="grid gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
                            <button
                                type="button"
                                onClick={() => setShowRescuedModal(true)}
                                className="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600"
                            >
                                Rescued
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowNotFoundModal(true)}
                                className="rounded-lg border border-slate-300 bg-yellow-200 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-slate-50"
                            >
                                Not Found
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowNeedBackupModal(true)}
                                className="rounded-lg border border-red-400 bg-red-400 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-amber-500"
                            >
                                Need Backup
                            </button>
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                Response Timeline
                            </p>
                        </div>

                        <div className="space-y-4 px-6 py-6">
                            {statusTimeline.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4"
                                >
                                    <div className="mt-0.5">
                                        <FaCircleCheck className="h-5 w-5 text-sky-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-black">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-black">
                                            {item.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <NotFoundModal
                show={showNotFoundModal}
                onClose={() => setShowNotFoundModal(false)}
            />

            <RescuedConfirmModal
                show={showRescuedModal}
                onClose={() => setShowRescuedModal(false)}
                onConfirm={() => {
                    setShowRescuedModal(false);
                    router.visit(route("history"));
                }}
            />

            <NeedBackupModal
                show={showNeedBackupModal}
                onClose={() => setShowNeedBackupModal(false)}
            />
        </>
    );
}
