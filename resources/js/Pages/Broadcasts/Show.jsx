import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

const RECIPIENT_STYLES = {
    pending: 'bg-gray-100 text-gray-600 ring-gray-200',
    sent: 'bg-sky-50 text-sky-700 ring-sky-200',
    delivered: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    read: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    replied: 'bg-teal-50 text-teal-700 ring-teal-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
};

const RECIPIENT_DOT = {
    pending: 'bg-gray-400',
    sent: 'bg-sky-500',
    delivered: 'bg-indigo-500',
    read: 'bg-emerald-500',
    replied: 'bg-teal-500',
    failed: 'bg-red-500',
};

function StatCard({ label, value, gradient, iconPath, subtitle }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg mb-3`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}

export default function Show({ broadcast, recipients }) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (!['sending', 'scheduled'].includes(broadcast.status)) return;
        const t = setInterval(() => router.reload({ only: ['broadcast', 'recipients'] }), 5000);
        return () => clearInterval(t);
    }, [broadcast.status]);

    const pct = broadcast.total_recipients > 0
        ? Math.round((broadcast.sent_count / broadcast.total_recipients) * 100)
        : 0;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">{broadcast.name}</h2>}>
            <Head title={broadcast.name} />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link href={route('broadcasts.index')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Volver a broadcasts
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{broadcast.name}</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Plantilla{' '}
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">{broadcast.template_name}</span>
                            {' · '}Idioma <span className="font-medium text-gray-600">{broadcast.template_language}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Progreso general</p>
                        <p className="text-3xl font-extrabold text-gray-900 tabular-nums">{pct}%</p>
                        <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
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

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
                    <StatCard
                        label="Destinatarios"
                        value={broadcast.total_recipients}
                        gradient="from-[#045474] to-[#1c486c] shadow-[#045474]/20"
                        iconPath="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                    />
                    <StatCard
                        label="Enviados"
                        value={broadcast.sent_count}
                        gradient="from-sky-500 to-blue-600 shadow-sky-500/20"
                        iconPath="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                    <StatCard
                        label="Entregados"
                        value={broadcast.delivered_count}
                        gradient="from-indigo-500 to-purple-600 shadow-indigo-500/20"
                        iconPath="M4.5 12.75l6 6 9-13.5"
                    />
                    <StatCard
                        label="Leídos"
                        value={broadcast.read_count}
                        gradient="from-emerald-500 to-teal-600 shadow-emerald-500/20"
                        iconPath="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <StatCard
                        label="Respondidos"
                        value={broadcast.replied_count}
                        gradient="from-teal-500 to-cyan-600 shadow-teal-500/20"
                        iconPath="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                    <StatCard
                        label="Fallidos"
                        value={broadcast.failed_count}
                        gradient="from-rose-500 to-red-600 shadow-rose-500/20"
                        iconPath="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Destinatarios</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Estado de entrega por contacto</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Teléfono</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Enviado</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recipients.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 sm:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#045474] to-[#1c486c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                    {(r.contact?.name || r.contact?.phone || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-900">{r.contact?.name || <span className="italic text-gray-400">Sin nombre</span>}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-gray-500 font-mono text-xs hidden sm:table-cell">{r.contact?.phone || '—'}</td>
                                        <td className="px-5 sm:px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${RECIPIENT_STYLES[r.status]}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${RECIPIENT_DOT[r.status]}`} />
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-xs text-gray-400 hidden md:table-cell">
                                            {r.sent_at ? new Date(r.sent_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td className="max-w-xs truncate px-5 sm:px-6 py-4 text-xs text-red-500 hidden lg:table-cell">{r.error_message || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {(recipients.prev_page_url || recipients.next_page_url) && (
                        <div className="px-5 sm:px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 text-sm">
                            {recipients.prev_page_url && (
                                <Link href={recipients.prev_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">
                                    ← Anterior
                                </Link>
                            )}
                            {recipients.next_page_url && (
                                <Link href={recipients.next_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">
                                    Siguiente →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
