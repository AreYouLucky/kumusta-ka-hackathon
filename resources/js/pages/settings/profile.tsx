import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        username: auth.user.username ?? '',
        fname: auth.user.fname ?? '',
        mname: auth.user.mname ?? '',
        lname: auth.user.lname ?? '',
        suffix: auth.user.suffix ?? '',
        sex: auth.user.sex ?? '',
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your citizen account information" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>

                            <Input
                                id="username"
                                className="mt-1 block w-full"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Username"
                            />

                            <InputError className="mt-2" message={errors.username} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="fname">First name</Label>
                                <Input
                                    id="fname"
                                    value={data.fname}
                                    onChange={(event) => setData('fname', event.target.value)}
                                    required
                                    autoComplete="given-name"
                                />
                                <InputError message={errors.fname} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lname">Last name</Label>
                                <Input
                                    id="lname"
                                    value={data.lname}
                                    onChange={(event) => setData('lname', event.target.value)}
                                    required
                                    autoComplete="family-name"
                                />
                                <InputError message={errors.lname} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mname">Middle name</Label>
                                <Input
                                    id="mname"
                                    value={data.mname}
                                    onChange={(event) => setData('mname', event.target.value)}
                                    autoComplete="additional-name"
                                />
                                <InputError message={errors.mname} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="suffix">Suffix</Label>
                                <Input id="suffix" value={data.suffix} onChange={(event) => setData('suffix', event.target.value)} />
                                <InputError message={errors.suffix} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="sex">Sex</Label>
                            <select
                                id="sex"
                                value={data.sex}
                                onChange={(event) => setData('sex', event.target.value)}
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            >
                                <option value="">Prefer not to say</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="other">Other</option>
                            </select>
                            <InputError message={errors.sex} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="mt-2 text-sm text-neutral-800">
                                    Your email address is unverified.
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="rounded-md text-sm text-neutral-600 underline hover:text-neutral-900 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                                    >
                                        Click here to re-send the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
