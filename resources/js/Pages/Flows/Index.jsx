import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_STYLES = {
    draft: 'bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200',
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
    archived: 'bg-gray-100 text-gray-500 ring-gray-200',
};

const STATUS_DOT = {
    draft: 'bg-gray-400',
    active: 'bg-emerald-500',
    archived: 'bg-gray-400',
};

const TRIGGER_META = {
    keyword: { label: 'Palabra clave', gradient: 'from-amber-500 to-orange-600' },
    first_inbound_message: { label: 'Primer mensaje', gradient: 'from-emerald-500 to-teal-600' },
    manual: { label: 'Manual', gradient: 'from-purple-500 to-violet-600' },
};

export default function Index({ flows }) {
    const { flash, errors } = usePage().props;
    const [showNew, setShowNew] = useState(false);
    const form = useForm({ name: '' });

    const create = (e) => {
        e.preventDefault();
        form.post(route('flows.store'));
    };

    const activeCount = flows.filter((f) => f.status === 'active').length;
    const totalRuns = flows.reduce((sum, f) => sum + f.runs_count, 0);

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Flows</h2>}>
            <Head title="Flows" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Flows (chatbot)</h1>
                        <p className="text-sm text-gray-400 mt-1">Chatbots conversacionales con estado — menús, capturas, ramas</p>
                    </div>
                    <button
                        onClick={() => setShowNew(true)}
                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 w-fit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nuevo flow
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Activos</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{activeCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{flows.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Conversaciones</p>
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
                {errors?.flow && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{errors.flow}</div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Todos los flows</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Cada flow arranca con una plantilla de menú funcional</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Disparador</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Nodos</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Runs</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {flows.map((flow) => {
                                    const trigger = TRIGGER_META[flow.trigger_type] ?? TRIGGER_META.keyword;
                                    return (
                                        <tr key={flow.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-5 sm:px-6 py-4">
                                                <Link href={route('flows.edit', flow.id)} className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${trigger.gradient} flex items-center justify-center text-white shadow-lg`}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{flow.name}</span>
                                                </Link>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4">
                                                <span className="text-gray-700 font-medium text-xs">{trigger.label}</span>
                                                {flow.trigger_type === 'keyword' && (
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                                                        {(flow.trigger_config?.keywords ?? []).join(', ')}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-right text-gray-600 font-bold tabular-nums hidden md:table-cell">{flow.nodes_count}</td>
                                            <td className="px-5 sm:px-6 py-4 text-right text-gray-600 font-bold tabular-nums hidden md:table-cell">{flow.runs_count}</td>
                                            <td className="px-5 sm:px-6 py-4">
                                                <button
                                                    onClick={() => router.post(route('flows.toggle', flow.id), {}, { preserveScroll: true })}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 transition-all ${STATUS_STYLES[flow.status]}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[flow.status]}`} />
                                                    {flow.status === 'active' ? 'Activo' : 'Borrador'}
                                                </button>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={route('flows.runs', flow.id)} className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Runs">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 019-9m9 9a9 9 0 01-9 9m9-9H3m18 0a9 9 0 00-9-9m0 18a9 9 0 01-9-9" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Eliminar este flow y su historial?')) {
                                                                router.delete(route('flows.destroy', flow.id));
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
                                {flows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 sm:px-6 py-16 text-center">
                                            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Sin flows todavía</p>
                                            <p className="text-xs text-gray-400 mt-1">Crea uno — arranca con una plantilla de menú funcional</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={showNew} onClose={() => setShowNew(false)}>
                <form onSubmit={create}>
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Nuevo flow</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Se creará con una plantilla de menú funcional</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <label htmlFor="flow-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                        <input
                            id="flow-name"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            required
                            placeholder="ej. Bienvenida y menú principal"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
                                form.errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                            }`}
                        />
                        {form.errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{form.errors.name}</p>}
                    </div>
                    <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
                        <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Crear flow
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
