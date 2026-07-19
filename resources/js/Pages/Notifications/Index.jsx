import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

function timeAgo(iso) {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export default function Index({ notifications }) {
    const unread = notifications.data.filter((n) => !n.read_at).length;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>}>
            <Head title="Notificaciones" />

            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notificaciones</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {unread > 0 ? `Tienes ${unread} sin leer` : 'Todo al día'}
                        </p>
                    </div>
                    {unread > 0 && (
                        <button
                            onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}
                            className="px-3.5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-1.5 w-fit"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Marcar todas como leídas
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {notifications.data.map((n) => (
                        <div
                            key={n.id}
                            className={`rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
                                n.read_at
                                    ? 'bg-white border-gray-100'
                                    : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-lg ${
                                    n.read_at
                                        ? 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/20'
                                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                                }`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-semibold text-gray-900">{n.title}</p>
                                        <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                                    </div>
                                    {n.body && <p className="mt-1 text-sm text-gray-600">{n.body}</p>}
                                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                                        {n.actor && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-4 h-4 rounded-full bg-gradient-to-br from-[#045474] to-[#1c486c] text-white text-[8px] font-bold flex items-center justify-center">
                                                    {n.actor.name.charAt(0).toUpperCase()}
                                                </span>
                                                {n.actor.name}
                                            </span>
                                        )}
                                        {n.conversation_id && (
                                            <Link href={route('inbox')} className="text-emerald-600 font-medium hover:text-emerald-700">
                                                Ir a la conversación →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                {!n.read_at && (
                                    <span className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 mt-2" />
                                )}
                            </div>
                        </div>
                    ))}
                    {notifications.data.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Sin notificaciones</p>
                            <p className="text-xs text-gray-400 mt-1">Aparecerán aquí cuando te asignen conversaciones o pasen eventos</p>
                        </div>
                    )}
                </div>

                {(notifications.prev_page_url || notifications.next_page_url) && (
                    <div className="flex justify-end gap-3 text-sm">
                        {notifications.prev_page_url && (
                            <Link href={notifications.prev_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">
                                ← Anterior
                            </Link>
                        )}
                        {notifications.next_page_url && (
                            <Link href={notifications.next_page_url} className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Siguiente →
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
