import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS_META = {
    active: { label: 'Activo', style: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500 animate-pulse' },
    completed: { label: 'Completado', style: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    handed_off: { label: 'Pasado a agente', style: 'bg-teal-50 text-teal-700 ring-teal-200', dot: 'bg-teal-500' },
    timed_out: { label: 'Timeout', style: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
    paused_by_agent: { label: 'Pausado por agente', style: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500' },
    failed: { label: 'Fallido', style: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

export default function Runs({ flow, runs }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Runs</h2>}>
            <Head title={`Runs — ${flow.name}`} />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <Link href={route('flows.index')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver a flows
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{flow.name}</h1>
                    <p className="text-sm text-gray-400 mt-1">Conversaciones del chatbot con contactos — {runs.total} en total</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Nodo actual</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Variables</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Inicio</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {runs.data.map((run) => {
                                    const meta = STATUS_META[run.status] ?? STATUS_META.completed;
                                    return (
                                        <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 sm:px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#045474] to-[#1c486c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                        {(run.contact?.name || run.contact?.phone || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{run.contact?.name || run.contact?.phone || <span className="italic text-gray-400">—</span>}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${meta.style}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 hidden md:table-cell">
                                                {run.current_node_key
                                                    ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{run.current_node_key}</span>
                                                    : <span className="text-gray-300">—</span>
                                                }
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-xs text-gray-600 hidden lg:table-cell max-w-xs">
                                                {Object.entries(run.vars ?? {}).length > 0
                                                    ? <div className="flex flex-wrap gap-1">{Object.entries(run.vars).map(([k, v]) => (
                                                        <span key={k} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">
                                                            <code className="font-mono text-gray-500">{k}:</code>
                                                            <span className="text-gray-700">{v}</span>
                                                        </span>
                                                    ))}</div>
                                                    : <span className="text-gray-300">—</span>
                                                }
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                                                {new Date(run.started_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-5 sm:px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                                                {run.ended_at ? new Date(run.ended_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : <span className="text-gray-300">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {runs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 sm:px-6 py-16 text-center">
                                            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 019-9m9 9a9 9 0 01-9 9m9-9H3m18 0a9 9 0 00-9-9m0 18a9 9 0 01-9-9" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Este flow aún no tiene ejecuciones</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {(runs.prev_page_url || runs.next_page_url) && (
                        <div className="px-5 sm:px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 text-sm">
                            {runs.prev_page_url && <Link href={runs.prev_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">← Anterior</Link>}
                            {runs.next_page_url && <Link href={runs.next_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">Siguiente →</Link>}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
