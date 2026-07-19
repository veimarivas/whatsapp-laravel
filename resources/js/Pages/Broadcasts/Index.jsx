import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const STATUS_STYLES = {
    draft: 'bg-gray-100 text-gray-700 ring-gray-200',
    scheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
    sending: 'bg-amber-50 text-amber-700 ring-amber-200',
    sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
};

const STATUS_DOT = {
    draft: 'bg-gray-400',
    scheduled: 'bg-sky-500',
    sending: 'bg-amber-500 animate-pulse',
    sent: 'bg-emerald-500',
    failed: 'bg-red-500',
};

const STATUS_LABELS = {
    draft: 'Borrador',
    scheduled: 'Programado',
    sending: 'Enviando',
    sent: 'Enviado',
    failed: 'Fallido',
};

function Progress({ sent, total }) {
    const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 mb-1">
                <span className="tabular-nums">{sent}/{total}</span>
                <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function Index({ broadcasts }) {
    const { flash } = usePage().props;

    const totalRecipients = broadcasts.data.reduce((sum, b) => sum + b.total_recipients, 0);
    const totalSent = broadcasts.data.reduce((sum, b) => sum + b.sent_count, 0);
    const totalRead = broadcasts.data.reduce((sum, b) => sum + b.read_count, 0);
    const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Broadcasts</h2>}>
            <Head title="Broadcasts" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Broadcasts</h1>
                        <p className="text-sm text-gray-400 mt-1">Envíos masivos a audiencias segmentadas con plantillas aprobadas</p>
                    </div>
                    <Link
                        href={route('broadcasts.create')}
                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 w-fit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nuevo broadcast
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total broadcasts</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{broadcasts.total ?? broadcasts.data.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Destinatarios</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{totalRecipients}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Enviados</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{totalSent}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tasa de lectura</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{readRate}%</p>
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Historial de broadcasts</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Toca un broadcast para ver estadísticas por destinatario</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Plantilla</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-48">Progreso</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Leídos</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Respondidos</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fallidos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {broadcasts.data.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-5 sm:px-6 py-4">
                                            <Link href={route('broadcasts.show', b.id)} className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{b.name}</span>
                                                    {b.scheduled_at && b.status === 'scheduled' && (
                                                        <p className="text-[11px] text-sky-600 mt-0.5 font-medium">
                                                            📅 {new Date(b.scheduled_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 hidden md:table-cell">
                                            <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{b.template_name}</span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${STATUS_STYLES[b.status]}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status]}`} />
                                                {STATUS_LABELS[b.status]}
                                            </span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4">
                                            <Progress sent={b.sent_count} total={b.total_recipients} />
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-right text-emerald-600 font-bold tabular-nums hidden sm:table-cell">{b.read_count}</td>
                                        <td className="px-5 sm:px-6 py-4 text-right text-teal-600 font-bold tabular-nums hidden lg:table-cell">{b.replied_count}</td>
                                        <td className="px-5 sm:px-6 py-4 text-right text-red-500 font-bold tabular-nums hidden lg:table-cell">{b.failed_count}</td>
                                    </tr>
                                ))}
                                {broadcasts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 sm:px-6 py-16 text-center">
                                            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Sin broadcasts todavía</p>
                                            <p className="text-xs text-gray-400 mt-1">Crea tu primer envío masivo con una plantilla aprobada</p>
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
