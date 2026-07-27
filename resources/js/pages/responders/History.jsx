import { Head, Link } from "@inertiajs/react";
import { FaArrowLeft } from "react-icons/fa6";

const rescuedVictims = [
    {
        name: "Juan Dela Cruz",
        remarks: "Resolved",
    },
    {
        name: "Maria Santos",
        remarks: "Resolved",
    },
    {
        name: "Pedro Reyes",
        remarks: "Resolved",
    },
];

export default function History() {
    return (
        <>
            <Head title="History" />

            <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                Responder Module
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold text-black">
                                History
                            </h1>
                        </div>

                        <Link
                            href={route("responder.status")}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-50"
                        >
                            <FaArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                    </div>

                    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                Rescued Victims
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold text-black">
                                Rescue History List
                            </h2>
                        </div>

                        <div className="px-3 pb-3 pt-2 sm:px-6 sm:pb-6">
                            <table className="min-w-full border-separate border-spacing-y-3">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                            Name
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-black">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rescuedVictims.map((victim) => (
                                        <tr key={victim.name}>
                                            <td className="rounded-l-lg border border-r-0 border-slate-200 bg-white px-4 py-4 text-sm font-medium text-black shadow-sm">
                                                {victim.name}
                                            </td>
                                            <td className="rounded-r-lg border border-slate-200 bg-white px-4 py-4 text-sm text-black shadow-sm">
                                                <span className="inline-flex rounded-lg border border-emerald-500 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
                                                    {victim.remarks}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
