import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Building2, HeartPulse, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import type { JSX } from 'react';

export default function Welcome(): JSX.Element {
    return (
        <>
            <Head title="Welcome to Kumusta Ka" />

            <main className="relative min-h-dvh overflow-hidden bg-slate-50 text-slate-950">
                <div
                    className="pointer-events-none absolute inset-0 opacity-60"
                    aria-hidden="true"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 18% 12%, rgba(14, 165, 233, 0.16), transparent 30%), radial-gradient(circle at 88% 82%, rgba(249, 115, 22, 0.13), transparent 30%)',
                    }}
                />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.035]"
                    aria-hidden="true"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgb(15 23 42) 1px, transparent 1px), linear-gradient(90deg, rgb(15 23 42) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="grid size-12 place-items-center overflow-hidden rounded-2xl border border-white bg-white shadow-sm sm:size-14">
                                <img src="/images/kumusta-app-logo.png" alt="Kumusta Ka logo" className="size-11 object-contain sm:size-13" />
                            </span>
                            <div>
                                <p className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Kumusta Ka</p>
                                <p className="text-[10px] font-extrabold tracking-[0.18em] text-sky-700 uppercase">Dahil mahalaga ka</p>
                            </div>
                        </div>

                        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm backdrop-blur sm:flex">
                            <ShieldCheck className="size-4 text-sky-600" aria-hidden="true" />
                            Secure access portal
                        </div>
                    </header>

                    <section className="flex flex-1 items-center py-12 lg:py-16">
                        <div className="grid w-full items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-extrabold text-sky-700">
                                    <HeartPulse className="size-3.5" aria-hidden="true" />
                                    Community safety, connected
                                </div>

                                <h1 className="mt-6 text-4xl leading-[1.05] font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                                    Help starts with knowing you&apos;re safe.
                                </h1>
                                <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                                    Access the right Kumusta Ka portal to check in with your loved ones, coordinate emergency response, and support
                                    your community when it matters most.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
                                    <span className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        Family safety updates
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-orange-500" />
                                        Coordinated response
                                    </span>
                                </div>
                            </div>

                            <div>
                                <div className="mb-5">
                                    <p className="text-sm font-extrabold tracking-wide text-sky-700 uppercase">Get started</p>
                                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                        Choose how you&apos;re signing in
                                    </h2>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Link
                                        href={route('citizen.login')}
                                        className="group relative flex min-h-72 flex-col overflow-hidden rounded-[1.75rem] border border-sky-200 bg-white p-6 shadow-[0_18px_50px_rgba(14,116,144,0.10)] transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_24px_60px_rgba(14,116,144,0.16)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-500"
                                    >
                                        <div className="absolute top-0 right-0 size-32 translate-x-10 -translate-y-10 rounded-full bg-sky-100 transition-transform duration-500 group-hover:scale-125" />
                                        <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-200">
                                            <UserRound className="size-7" aria-hidden="true" />
                                        </span>
                                        <div className="relative mt-8">
                                            <p className="text-xs font-extrabold tracking-[0.16em] text-sky-600 uppercase">For the community</p>
                                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Resident</h3>
                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                Check in, view family safety updates, and request assistance.
                                            </p>
                                        </div>
                                        <span className="relative mt-auto flex items-center gap-2 pt-6 text-sm font-extrabold text-sky-700">
                                            Resident login
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                        </span>
                                    </Link>

                                    <Link
                                        href={route('login')}
                                        className="group relative flex min-h-72 flex-col overflow-hidden rounded-[1.75rem] border border-orange-200 bg-white p-6 shadow-[0_18px_50px_rgba(154,52,18,0.08)] transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_24px_60px_rgba(154,52,18,0.14)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-500"
                                    >
                                        <div className="absolute top-0 right-0 size-32 translate-x-10 -translate-y-10 rounded-full bg-orange-100 transition-transform duration-500 group-hover:scale-125" />
                                        <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-200">
                                            <UsersRound className="size-7" aria-hidden="true" />
                                        </span>
                                        <div className="relative mt-8">
                                            <p className="text-xs font-extrabold tracking-[0.16em] text-orange-600 uppercase">For response teams</p>
                                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Responder / GCC</h3>
                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                Manage incidents, coordinate teams, and monitor affected residents.
                                            </p>
                                        </div>
                                        <span className="relative mt-auto flex items-center gap-2 pt-6 text-sm font-extrabold text-orange-700">
                                            Staff login
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                        </span>
                                    </Link>
                                </div>

                                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3.5 backdrop-blur">
                                    <Building2 className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                                    <p className="text-xs leading-5 text-slate-500">
                                        GCC personnel and emergency responders use the shared staff portal. Your assigned role determines the
                                        dashboard you can access.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="flex flex-col gap-2 border-t border-slate-200/80 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <p>&copy; {new Date().getFullYear()} Kumusta Ka. Community disaster response platform.</p>
                        <p className="font-semibold">Built for safer, more connected communities.</p>
                    </footer>
                </div>
            </main>
        </>
    );
}
