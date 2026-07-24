import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function QuickReplies({ replies }) {
    const { flash, auth } = usePage().props;
    const isAdmin = auth?.user?.account_role === 'owner' || auth?.user?.account_role === 'admin';
    const [editingId, setEditingId] = useState(null);

    const form = useForm({ shortcut: '', content: '', shared: false });
    const editForm = useForm({ shortcut: '', content: '', shared: false });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('quick-replies.store'), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const startEdit = (r) => {
        editForm.setData({ shortcut: r.shortcut, content: r.content, shared: r.user_id === null });
        setEditingId(r.id);
    };

    const saveEdit = (e, id) => {
        e.preventDefault();
        editForm.patch(route('quick-replies.update', id), {
            preserveScroll: true,
            onSuccess: () => { setEditingId(null); editForm.reset(); },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Plantillas rápidas</h2>}>
            <Head title="Plantillas rápidas" />

            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Plantillas rápidas</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Respuestas frecuentes para el Inbox. Escribe <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/atajo</code> en el composer o toca el botón 📋.
                        Variables disponibles: <code className="bg-gray-100 px-1 rounded text-xs">{'{name}'}</code> <code className="bg-gray-100 px-1 rounded text-xs">{'{phone}'}</code> <code className="bg-gray-100 px-1 rounded text-xs">{'{email}'}</code> <code className="bg-gray-100 px-1 rounded text-xs">{'{company}'}</code>
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
                        {flash.success}
                    </div>
                )}

                {/* Formulario crear */}
                <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">Nueva plantilla</h3>
                    <div className="grid sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Atajo</label>
                            <input
                                value={form.data.shortcut}
                                onChange={(e) => form.setData('shortcut', e.target.value)}
                                placeholder="precios"
                                required
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#045474]/20 focus:border-[#045474] focus:bg-white"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Contenido</label>
                            <textarea
                                rows={2}
                                value={form.data.content}
                                onChange={(e) => form.setData('content', e.target.value)}
                                placeholder="Hola {name}! Nuestros precios son…"
                                required
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#045474]/20 focus:border-[#045474] focus:bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        {isAdmin ? (
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.shared}
                                    onChange={(e) => form.setData('shared', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#045474] focus:ring-[#045474]"
                                />
                                Compartir con todo el equipo
                            </label>
                        ) : <span />}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#045474] to-[#1c486c] rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#045474]/20"
                        >
                            {form.processing ? 'Guardando…' : 'Añadir plantilla'}
                        </button>
                    </div>
                </form>

                {/* Lista */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Mis plantillas + compartidas</h3>
                    </div>
                    <ul className="divide-y divide-gray-50">
                        {replies.map((r) => (
                            <li key={r.id} className={`p-5 ${editingId === r.id ? 'bg-amber-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                                {editingId === r.id ? (
                                    <form onSubmit={(e) => saveEdit(e, r.id)} className="space-y-3">
                                        <div className="grid sm:grid-cols-4 gap-3">
                                            <input
                                                value={editForm.data.shortcut}
                                                onChange={(e) => editForm.setData('shortcut', e.target.value)}
                                                required
                                                className="px-3.5 py-2.5 border border-amber-300 rounded-xl text-sm font-mono bg-white focus:ring-2 focus:ring-amber-500/30"
                                            />
                                            <textarea
                                                rows={2}
                                                value={editForm.data.content}
                                                onChange={(e) => editForm.setData('content', e.target.value)}
                                                required
                                                className="sm:col-span-3 px-3.5 py-2.5 border border-amber-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500/30"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            {isAdmin && (
                                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.data.shared}
                                                        onChange={(e) => editForm.setData('shared', e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-300 text-amber-600"
                                                    />
                                                    Compartida
                                                </label>
                                            )}
                                            <div className="flex gap-2 ml-auto">
                                                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                                                <button type="submit" disabled={editForm.processing} className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-sm">Guardar</button>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <code className="px-2 py-0.5 rounded-lg bg-[#045474]/10 text-[#045474] font-mono text-xs font-bold">/{r.shortcut}</code>
                                                {r.user_id === null ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ring-1 ring-emerald-200">Compartida</span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">Mía</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => startEdit(r)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                                            </button>
                                            <button onClick={() => { if (confirm('¿Eliminar plantilla?')) router.delete(route('quick-replies.destroy', r.id), { preserveScroll: true }); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                        {replies.length === 0 && (
                            <li className="p-8 text-center text-sm text-gray-400">Sin plantillas todavía. Añadí la primera arriba.</li>
                        )}
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
