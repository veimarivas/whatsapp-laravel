import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS_STYLES = {
    success: { style: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    partial: { style: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
    failed: { style: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

const RESULT_STYLES = {
    ok: 'bg-emerald-50 text-emerald-700',
    yes: 'bg-emerald-50 text-emerald-700',
    no: 'bg-gray-100 text-gray-600',
    wait_scheduled: 'bg-sky-50 text-sky-700',
};

export default function Logs({ automation, logs }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Logs</h2>}>
            <Head title={`Logs — ${automation.name}`} />

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <Link href={route('automations.index')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver a automatizaciones
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{automation.name}</h1>
                    <p className="text-sm text-gray-400 mt-1">Historial de ejecuciones — {logs.total} en total</p>
                </div>

                <div className="space-y-3">
                    {logs.data.map((log) => {
                        const status = STATUS_STYLES[log.status] ?? STATUS_STYLES.success;
                        return (
                            <div key={log.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#045474] to-[#1c486c] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {(log.contact?.name || log.contact?.phone || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {log.contact?.name || log.contact?.phone || <span className="italic text-gray-400">Contacto eliminado</span>}
                                            </p>
                                            <p className="text-xs text-gray-400">{log.contact?.phone || ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${status.style}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                            {log.status}
                                        </span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                {log.error_message && (
                                    <div className="mb-3 rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-700 font-mono">
                                        {log.error_message}
                                    </div>
                                )}

                                <ol className="space-y-1.5">
                                    {(log.steps_executed ?? []).map((step, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs">
                                            <span className="shrink-0 w-5 h-5 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                            <code className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px]">{step.type}</code>
                                            <span className="text-gray-400">→</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${RESULT_STYLES[step.result] ?? 'bg-red-50 text-red-700'}`}>
                                                {step.result}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        );
                    })}
                    {logs.data.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Esta automatización aún no se ha ejecutado</p>
                        </div>
                    )}
                </div>

                {(logs.prev_page_url || logs.next_page_url) && (
                    <div className="flex justify-end gap-3 text-sm">
                        {logs.prev_page_url && <Link href={logs.prev_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">← Anterior</Link>}
                        {logs.next_page_url && <Link href={logs.next_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">Siguiente →</Link>}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
