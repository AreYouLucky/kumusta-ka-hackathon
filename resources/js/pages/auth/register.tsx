import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEventHandler, JSX } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    [key: string]: string;
    username: string;
    fname: string;
    mname: string;
    lname: string;
    suffix: string;
    sex: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register(): JSX.Element {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        username: '',
        fname: '',
        mname: '',
        lname: '',
        suffix: '',
        sex: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your citizen account details below">
            <Head title="Register" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            required
                            autoFocus
                            autoComplete="username"
                            value={data.username}
                            onChange={(event) => setData('username', event.target.value)}
                            disabled={processing}
                            placeholder="Username"
                        />
                        <InputError message={errors.username} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="fname">First name</Label>
                            <Input
                                id="fname"
                                required
                                autoComplete="given-name"
                                value={data.fname}
                                onChange={(event) => setData('fname', event.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.fname} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lname">Last name</Label>
                            <Input
                                id="lname"
                                required
                                autoComplete="family-name"
                                value={data.lname}
                                onChange={(event) => setData('lname', event.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.lname} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="mname">Middle name</Label>
                            <Input
                                id="mname"
                                autoComplete="additional-name"
                                value={data.mname}
                                onChange={(event) => setData('mname', event.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.mname} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="suffix">Suffix</Label>
                            <Input
                                id="suffix"
                                value={data.suffix}
                                onChange={(event) => setData('suffix', event.target.value)}
                                disabled={processing}
                                placeholder="Jr., Sr., III"
                            />
                            <InputError message={errors.suffix} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sex">Sex</Label>
                        <select
                            id="sex"
                            value={data.sex}
                            onChange={(event) => setData('sex', event.target.value)}
                            disabled={processing}
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
                            required
                            autoComplete="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>
                    </div>

                    <Button type="submit" className="mt-1 w-full" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        Create account
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account? <TextLink href={route('login')}>Log in</TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
