import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Duplicates({ groups }) {
    const { flash } = usePage().props;

    // Por cada grupo, el primer contacto es el "primary" por defecto.
    // El user puede cambiarlo con los radio buttons.
    const [primaries, setPrimaries] = useState(
        Object.fromEntries(groups.map((g, i) => [i, g.contacts[0]?.id]))
    );

    const mergeForm = useForm({ primary_id: null, duplicate_ids: [] });

    const mergeGroup = (groupIdx) => {
        const group = groups[groupIdx];
        const primaryId = primaries[groupIdx];
        if (!primaryId) return;
        if (!confirm(`Fusionar ${group.contacts.length - 1} contacto(s) en el principal? Se moverán todas las conversaciones, tags y notas al principal, y los duplicados se eliminarán. Esta acción no se puede deshacer.`)) return;

        const duplicateIds = group.contacts.filter((c) => c.id !== primaryId).map((c) => c.id);
        mergeForm.setData({ primary_id: primaryId, duplicate_ids: duplicateIds });
        mergeForm.transform((data) => ({ ...data, primary_id: primaryId, duplicate_ids: duplicateIds }))
            .post(route('contacts.merge'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Contactos duplicados</h2>}>
            <Head title="Duplicados" />

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contactos duplicados</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Detectados automáticamente por email o nombre idéntico. Elegí cuál queda como principal (radio) y fusioná el resto.
                        Todas las conversaciones, tags, notas y deals de los duplicados se mueven al principal.
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">{flash.success}</div>
                )}

                {groups.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No hay duplicados detectados 🎉</p>
                        <p className="text-xs text-gray-400 mt-1">Tu base de contactos está limpia.</p>
                    </div>
                )}

                {groups.map((group, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Coincidencia por {group.reason === 'email' ? '📧 email' : '👤 nombre'}
                                </p>
                                <p className="text-sm font-mono text-gray-800 mt-0.5">{group.label}</p>
                            </div>
                            <button
                                onClick={() => mergeGroup(idx)}
                                disabled={mergeForm.processing}
                                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                Fusionar {group.contacts.length}
                            </button>
                        </div>
                        <ul className="divide-y divide-gray-50">
                            {group.contacts.map((c) => {
                                const isPrimary = primaries[idx] === c.id;
                                return (
                                    <li
                                        key={c.id}
                                        onClick={() => setPrimaries({ ...primaries, [idx]: c.id })}
                                        className={`p-4 cursor-pointer transition-all flex items-center gap-3 ${
                                            isPrimary ? 'bg-emerald-50/60 border-l-4 border-emerald-500' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            checked={isPrimary}
                                            onChange={() => setPrimaries({ ...primaries, [idx]: c.id })}
                                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900">{c.name || 'Sin nombre'}</span>
                                                {isPrimary && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded ring-1 ring-emerald-200">Principal</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap font-mono">
                                                <span>📱 {c.phone}</span>
                                                {c.email && <span>✉ {c.email}</span>}
                                                {c.company && <span>🏢 {c.company}</span>}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-3">
                                                <span>{c.tags_count ?? 0} tags</span>
                                                <span>{c.notes_count ?? 0} notas</span>
                                                <span>creado {new Date(c.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
