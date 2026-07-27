import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react';
import type { FormEvent, JSX } from 'react';

type CitizenLoginData = {
    mobile_number: string;
};

function hasValidMobileLength(value: string): boolean {
    const digitCount = value.replace(/\D/g, '').length;

    return digitCount === 10 || digitCount === 11 || digitCount === 12;
}

export default function Login(): JSX.Element {
    const { data, setData, post, processing, errors, clearErrors } = useForm<CitizenLoginData>({
        mobile_number: '',
    });

    function submitLogin(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (!hasValidMobileLength(data.mobile_number) || processing) {
            return;
        }

        post(route('citizen.login.store'), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Citizen Login" />

            <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-sky-50 px-4 py-6 text-black">
                <div className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full bg-sky-200/60 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-blue-100/70 blur-3xl" />

                <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_24px_70px_rgba(14,116,144,0.14)]">
                    <div className="bg-gradient-to-br from-sky-500 to-blue-600 px-6 pt-8 pb-20 text-white">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg">
                                    <img src="/storage/images/kumusta.png" alt="Kumusta Ka logo" className="size-10 object-contain" />
                                </span>
                                <div>
                                    <p className="text-lg font-black tracking-tight">Kumusta Ka</p>
                                    <p className="text-[10px] font-bold tracking-[0.14em] text-sky-100 uppercase">Dahil mahalaga ka</p>
                                </div>
                            </div>
                            <ShieldCheck className="size-6 text-sky-100" aria-hidden="true" />
                        </div>

                        <h1 className="mt-8 text-3xl leading-tight font-black tracking-tight">Citizen sign in</h1>
                        <p className="mt-3 max-w-xs text-sm leading-6 text-sky-50">
                            Access your safety circles and emergency tools using your registered mobile number.
                        </p>
                    </div>

                    <div className="relative -mt-12 p-5 sm:p-6">
                        <form
                            onSubmit={submitLogin}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.10)]"
                        >
                            <span className="grid size-12 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                                <Smartphone className="size-5" aria-hidden="true" />
                            </span>
                            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Enter your mobile number</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">We’ll find your registered citizen account and sign you in.</p>

                            <label className="mt-6 block text-xs font-extrabold text-slate-700" htmlFor="citizen-mobile-number">
                                Mobile number
                            </label>
                            <div className="relative mt-2">
                                <Smartphone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                <input
                                    id="citizen-mobile-number"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={data.mobile_number}
                                    onChange={(event) => {
                                        clearErrors('mobile_number');
                                        setData('mobile_number', event.target.value);
                                    }}
                                    placeholder="0917 123 4567"
                                    autoFocus
                                    aria-invalid={errors.mobile_number !== undefined}
                                    aria-describedby={errors.mobile_number === undefined ? undefined : 'citizen-mobile-number-error'}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm font-semibold text-slate-800 transition outline-none placeholder:text-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                            {errors.mobile_number !== undefined && (
                                <p id="citizen-mobile-number-error" className="mt-2 text-xs font-semibold text-red-600">
                                    {errors.mobile_number}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={!hasValidMobileLength(data.mobile_number) || processing}
                                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-extrabold text-white transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                                {processing ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
                            <LockKeyhole className="size-3" aria-hidden="true" />
                            Registered citizen accounts only
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
