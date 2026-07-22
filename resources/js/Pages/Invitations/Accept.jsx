import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

const ROLE_LABELS = { admin: 'Admin', agent: 'Agente', viewer: 'Solo lectura' };
const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#045474]/30 focus:border-[#045474] focus:bg-white transition-colors placeholder:text-gray-400';

export default function Accept({ invalid, token, accountName, role, isLoggedIn }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('invitations.redeem', token));
    };

    return (
        <GuestLayout>
            <Head title={invalid ? 'Invitación' : 'Unirse al equipo'} />

            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden">
                    <div className="p-8 sm:p-10">
                        {invalid ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-bold text-[#042048]">Invitación inválida</h4>
                                <p className="text-sm text-gray-500 mt-2">
                                    Este link no es válido o ya expiró. Pídele a quien te invitó que genere uno nuevo.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e6dd5e]/10 mb-4">
                                        <svg className="w-8 h-8 text-[#e6dd5e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-2xl font-bold text-[#042048]">Te invitaron a</h4>
                                    <p className="text-lg font-semibold text-[#045474] mt-1">{accountName}</p>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-3 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Rol: {ROLE_LABELS[role] ?? role}
                                    </span>
                                </div>

                                <form onSubmit={submit} className="space-y-4">
                                    {!isLoggedIn && (
                                        <>
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Tu nombre <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Nombre completo"
                                                    autoFocus
                                                    required
                                                />
                                                {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="tu@email.com"
                                                    required
                                                />
                                                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Contraseña <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Mínimo 8 caracteres"
                                                    required
                                                />
                                                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Confirmar contraseña <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="password_confirmation"
                                                    type="password"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Repite la contraseña"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    {errors.invite && <p className="text-sm text-red-500 font-medium">{errors.invite}</p>}

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#042048] to-[#045474] text-white text-sm font-semibold rounded-lg hover:from-[#1c486c] hover:to-[#045474] focus:outline-none focus:ring-2 focus:ring-[#045474] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#042048]/25"
                                    >
                                        {processing ? 'Procesando…' : isLoggedIn ? `Unirme a ${accountName}` : 'Crear cuenta y unirme'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
