import EmergencyAlertModal from "@/Components/EmergencyAlertModal";
import ResponderModal from "@/Components/ResponderModal";
import { Head, router } from "@inertiajs/react";
import { FaArrowRight } from "react-icons/fa6";
import React, { useState } from "react";

const Home = () => {
    const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
    const [showResponder, setShowResponder] = useState(false);
    const [residentStatus, setResidentStatus] = useState("pending");
    const dummyVictims = [
        {
            id: "DV-001",
            name: "Juan Dela Cruz",
            location: "Purok Mabuhay",
            priority: "High Priority",
        },
        {
            id: "DV-002",
            name: "Maria Santos",
            location: "Barangay San Isidro",
            priority: "For Verification",
        },
        {
            id: "DV-003",
            name: "Pedro Reyes",
            location: "Riverside Evacuation Zone",
            priority: "Medical Check",
        },
        {
            id: "DV-004",
            name: "Ana Flores",
            location: "Sitio Pag-asa",
            priority: "Awaiting Pickup",
        },
    ];
    const statusMeta = {
        pending: {
            label: "Monitoring",
            className: "border-slate-200 bg-white text-black",
        },
        safe: {
            label: "Marked Safe",
            className: "border-slate-200 bg-white text-black",
        },
        call: {
            label: "Callback Requested",
            className: "border-slate-200 bg-white text-black",
        },
        needs: {
            label: "Needs Assistance",
            className: "border-slate-200 bg-white text-black",
        },
        help: {
            label: "Urgent Help",
            className: "border-red-500 bg-white text-red-500",
        },
    };
    const currentStatus = statusMeta[residentStatus] ?? statusMeta.pending;

    return (
        <>
            <Head title="Home" />

            <div className="min-h-screen overflow-auto bg-white px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl space-y-8">
                    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-200 bg-gray-300 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black">
                                    Rescue Records
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold text-black">
                                    Victim List
                                </h2>
                            </div>
                            <div
                                className={`inline-flex rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${currentStatus.className}`}
                            >
                                {currentStatus.label}
                            </div>
                        </div>

                        <div className="px-3 pb-3 pt-2 sm:px-6 sm:pb-6">
                            <table className="min-w-full border-separate border-spacing-y-3">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                            Victim Information
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dummyVictims.map((victim) => (
                                        <tr key={victim.id}>
                                            <td className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-base font-semibold text-black">
                                                                {victim.name}
                                                            </h3>
                                                            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-black">
                                                                {victim.id}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-black">
                                                            {victim.location}
                                                        </p>
                                                        <span className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-black">
                                                            {victim.priority}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowResponder(
                                                                true,
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-500 bg-sky-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-sm transition duration-200 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
                                                    >
                                                        <FaArrowRight className="h-3.5 w-3.5" />
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            <ResponderModal
                show={showResponder}
                onClose={() => setShowResponder(false)}
                onAccept={() => {
                    setShowResponder(false);
                    router.visit(route("responder.status"));
                }}
            />

            <EmergencyAlertModal
                show={showEmergencyAlert}
                onClose={() => setShowEmergencyAlert(false)}
                onMarkSafe={() => {
                    setResidentStatus("safe");
                    setShowEmergencyAlert(false);
                }}
                onRequestCall={() => {
                    setResidentStatus("call");
                    setShowEmergencyAlert(false);
                }}
                onNeedAssistance={() => {
                    setResidentStatus("needs");
                    setShowEmergencyAlert(false);
                }}
                onUrgentHelp={() => {
                    setResidentStatus("help");
                    setShowEmergencyAlert(false);
                }}
            />
        </>
    );
};

export default Home;
