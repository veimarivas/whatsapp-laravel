import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

const ROLE_LABELS = { admin: 'Admin', agent: 'Agente', viewer: 'Solo lectura' };

export default function Accept({ invalid, token, accountName, role, isLoggedIn }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    if (invalid) {
        return (
            <GuestLayout>
                <Head title="Invitación" />
                <p className="text-center text-sm text-gray-600">
                    Esta invitación no es válida o ya expiró. Pide un link nuevo a quien te invitó.
                </p>
            </GuestLayout>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        post(route('invitations.redeem', token));
    };

    return (
        <GuestLayout>
            <Head title="Unirse al equipo" />

            <div className="mb-4 text-center">
                <h1 className="text-lg font-semibold text-gray-900">
                    Te invitaron a <span className="text-emerald-700">{accountName}</span>
                </h1>
                <p className="text-sm text-gray-500">Rol: {ROLE_LABELS[role] ?? role}</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {!isLoggedIn && (
                    <>
                        <div>
                            <InputLabel htmlFor="name" value="Tu nombre" />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="password" value="Contraseña" />
                            <TextInput
                                id="password"
                                type="password"
                                className="mt-1 block w-full"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Confirmar contraseña" />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                className="mt-1 block w-full"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                        </div>
                    </>
                )}

                <InputError message={errors.invite} />

                <PrimaryButton className="w-full justify-center" disabled={processing}>
                    {isLoggedIn ? `Unirme a ${accountName}` : 'Crear cuenta y unirme'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
