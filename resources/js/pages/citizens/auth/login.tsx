import { Head, useForm } from '@inertiajs/react';
import { ChevronDown, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import type { FormEvent, JSX } from 'react';
import { useEffect, useState } from 'react';

type CitizenLoginData = {
    email: string;
    mobile_number: string;
};

type LoginProps = {
    testAccounts: string[];
};

export default function Login({ testAccounts }: LoginProps): JSX.Element {
    const { data, setData, post, processing, errors, clearErrors } = useForm<CitizenLoginData>({
        email: '',
        mobile_number: '',
    });
    const [isMobileFallback, setIsMobileFallback] = useState(false);

    useEffect(() => {
        if (errors.email !== undefined) {
            setIsMobileFallback(true);
        }
    }, [errors.email]);

    function submitLogin(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if ((isMobileFallback ? !hasValidMobileNumber(data.mobile_number) : data.email === '') || processing) {
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
                            Choose a hackathon test account to access the citizen safety module.
                        </p>
                    </div>

                    <div className="relative -mt-12 p-5 sm:p-6">
                        <form
                            onSubmit={submitLogin}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.10)]"
                        >
                            <span className="grid size-12 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                                <Mail className="size-5" aria-hidden="true" />
                            </span>
                            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Select a test account</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                The matching exchange code stays secured on the server and is sent directly to eGov.
                            </p>

                            <label className="mt-6 block text-xs font-extrabold text-slate-700" htmlFor="citizen-email">
                                Citizen email
                            </label>
                            <div className="relative mt-2">
                                <Mail
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden="true"
                                />
                                <select
                                    id="citizen-email"
                                    value={data.email}
                                    onChange={(event) => {
                                        clearErrors('email');
                                        setData('email', event.target.value);
                                        setData('mobile_number', '');
                                        setIsMobileFallback(false);
                                    }}
                                    autoFocus
                                    aria-invalid={errors.email !== undefined}
                                    aria-describedby={errors.email === undefined ? undefined : 'citizen-email-error'}
                                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-sm font-semibold text-slate-800 transition outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                >
                                    <option value="">Choose an email account</option>
                                    {testAccounts.map((email) => (
                                        <option key={email} value={email}>
                                            {email}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden="true"
                                />
                            </div>
                            {errors.email !== undefined && (
                                <p id="citizen-email-error" className="mt-2 text-xs font-semibold text-red-600">
                                    {errors.email}
                                </p>
                            )}

                            {isMobileFallback && (
                                <div className="mt-5 border-t border-slate-200 pt-5">
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                        <p className="text-xs font-extrabold text-amber-800">eGov sign-in unavailable</p>
                                        <p className="mt-1 text-xs leading-5 text-amber-700">
                                            Use a mobile number already saved on your citizen account.
                                        </p>
                                    </div>

                                    <label className="mt-4 block text-xs font-extrabold text-slate-700" htmlFor="citizen-mobile-number">
                                        Mobile number
                                    </label>
                                    <div className="relative mt-2">
                                        <Smartphone
                                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                                            aria-hidden="true"
                                        />
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
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={(isMobileFallback ? !hasValidMobileNumber(data.mobile_number) : data.email === '') || processing}
                                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-extrabold text-white transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                                {processing ? 'Signing in...' : isMobileFallback ? 'Sign in with mobile number' : 'Continue with eGov'}
                            </button>
                        </form>

                        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
                            <LockKeyhole className="size-3" aria-hidden="true" />
                            Exchange codes are never exposed to the browser
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

function hasValidMobileNumber(value: string): boolean {
    const digitCount = value.replace(/\D/g, '').length;

    return digitCount === 10 || digitCount === 11 || digitCount === 12;
}
