import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginForm = {
    username: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm<LoginForm>({
        username: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onError: () => {
                if (errors) {
                    errors.username = 'An error occurred. Please try again.';
                }
            },
        });
    };

    return (
        <>
            <Head title="Log in" />

            <div className="flex min-h-svh w-full flex-col items-center justify-center">
                <div className="rounded-2xl border bg-white p-8">
                    <h1 className="text-2xl font-bold">SECURITY LOGIN</h1>
                    <p className="text-muted-foreground text-sm">Please sign in to your account</p>

                    <form className="mt-6 flex w-lg flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    //autoComplete="email"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="e.g. juan"
                                />
                                <InputError message={errors.username} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((visible) => !visible)}
                                        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Remember me</Label>
                            </div> */}

                            <Button
                                type="submit"
                                className="mt-4 w-full bg-blue-400 hover:bg-blue-500 focus:bg-blue-500 disabled:bg-blue-400"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Log in
                            </Button>
                        </div>

                        {/* <div className="text-muted-foreground text-center text-sm">
                            Don't have an account?{' '}
                            <TextLink href={route('register')} tabIndex={5}>
                                Sign up
                            </TextLink>
                        </div> */}
                    </form>
                </div>
            </div>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </>
    );
}
