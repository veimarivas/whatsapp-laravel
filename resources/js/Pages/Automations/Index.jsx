import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const TRIGGER_META = {
    inbound_message: { label: 'Mensaje entrante', gradient: 'from-blue-500 to-indigo-600', iconPath: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' },
    new_contact: { label: 'Contacto nuevo', gradient: 'from-emerald-500 to-teal-600', iconPath: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z' },
    keyword: { label: 'Palabra clave', gradient: 'from-amber-500 to-orange-600', iconPath: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z' },
};

export default function Index({ automations }) {
    const { flash, errors } = usePage().props;

    const activeCount = automations.filter((a) => a.is_active).length;
    const totalRuns = automations.reduce((sum, a) => sum + a.execution_count, 0);

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Automatizaciones</h2>}>
            <Head title="Automatizaciones" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Automatizaciones</h1>
                        <p className="text-sm text-gray-400 mt-1">Dispara acciones automáticas cuando pasan eventos en tu CRM</p>
                    </div>
                    <Link
                        href={route('automations.create')}
                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 w-fit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nueva automatización
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Activas</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{activeCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{automations.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ejecuciones</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{totalRuns}</p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        {flash.success}
                    </div>
                )}
                {errors?.steps && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{errors.steps}</div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Todas las automatizaciones</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Toca el interruptor de estado para activar o desactivar</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Disparador</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pasos</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Ejecuciones</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {automations.map((a) => {
                                    const trigger = TRIGGER_META[a.trigger_type] ?? TRIGGER_META.inbound_message;
                                    return (
                                        <tr key={a.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-5 sm:px-6 py-4">
                                                <Link href={route('automations.edit', a.id)} className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${trigger.gradient} flex items-center justify-center text-white shadow-lg`}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{a.name}</span>
                                                        {a.description && <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4">
                                                <div>
                                                    <span className="text-gray-700 font-medium text-xs">{trigger.label}</span>
                                                    {a.trigger_type === 'keyword' && (
                                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                                                            {(a.trigger_config?.keywords ?? []).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-right text-gray-600 font-bold tabular-nums hidden md:table-cell">{a.steps_count}</td>
                                            <td className="px-5 sm:px-6 py-4 text-right text-gray-600 font-bold tabular-nums hidden md:table-cell">{a.execution_count}</td>
                                            <td className="px-5 sm:px-6 py-4">
                                                <button
                                                    onClick={() => router.post(route('automations.toggle', a.id), {}, { preserveScroll: true })}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 transition-all ${
                                                        a.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                    {a.is_active ? 'Activa' : 'Inactiva'}
                                                </button>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={route('automations.logs', a.id)}
                                                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                                        title="Ver logs"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Eliminar esta automatización?')) {
                                                                router.delete(route('automations.destroy', a.id));
                                                            }
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {automations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 sm:px-6 py-16 text-center">
                                            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Sin automatizaciones todavía</p>
                                            <p className="text-xs text-gray-400 mt-1">Crea la primera — por ejemplo, una bienvenida automática al primer mensaje</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
