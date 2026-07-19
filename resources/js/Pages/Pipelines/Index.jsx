import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function money(value, currency) {
    return new Intl.NumberFormat('es', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

const STATUS_BADGES = {
    won: { label: 'Ganado', style: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    lost: { label: 'Perdido', style: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

function DealCard({ deal, onEdit, currency }) {
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('text/deal-id', deal.id);
                e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onEdit(deal)}
            className={`group cursor-grab active:cursor-grabbing rounded-xl border bg-white p-3.5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all ${
                deal.status !== 'open' ? 'opacity-60' : 'border-gray-100'
            }`}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2">{deal.title}</p>
                {STATUS_BADGES[deal.status] && (
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${STATUS_BADGES[deal.status].style}`}>
                        <span className={`w-1 h-1 rounded-full ${STATUS_BADGES[deal.status].dot}`} />
                        {STATUS_BADGES[deal.status].label}
                    </span>
                )}
            </div>

            <p className="text-lg font-extrabold text-gray-900 tabular-nums mb-2">
                {money(deal.value, deal.currency || currency)}
            </p>

            {deal.contact && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#045474] to-[#1c486c] flex items-center justify-center text-white text-[10px] font-bold">
                        {(deal.contact.name || deal.contact.phone || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-600 truncate">{deal.contact.name || deal.contact.phone}</span>
                </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                {deal.assignee ? (
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {deal.assignee.name}
                    </span>
                ) : <span />}
                {deal.expected_close_date && (
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {new Date(deal.expected_close_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>
        </div>
    );
}

function DealFormModal({ open, onClose, deal, pipeline, contacts, members, currency }) {
    const isEdit = !!deal;

    const { data, setData, reset, clearErrors, errors, processing } = useForm({
        pipeline_id: pipeline?.id ?? '',
        stage_id: deal?.stage_id ?? pipeline?.stages?.[0]?.id ?? '',
        contact_id: deal?.contact_id ?? '',
        assigned_to: deal?.assigned_to ?? '',
        title: deal?.title ?? '',
        value: deal?.value ?? '',
        currency: deal?.currency ?? currency ?? 'USD',
        notes: deal?.notes ?? '',
        expected_close_date: deal?.expected_close_date?.slice(0, 10) ?? '',
        status: deal?.status ?? 'open',
    });

    const close = () => {
        reset();
        clearErrors();
        onClose();
    };

    const submit = (e) => {
        e.preventDefault();
        const transform = (d) => ({
            ...d,
            contact_id: d.contact_id || null,
            assigned_to: d.assigned_to || null,
            value: d.value === '' ? 0 : d.value,
            expected_close_date: d.expected_close_date || null,
        });
        const opts = { preserveScroll: true, onSuccess: close };
        if (isEdit) router.patch(route('deals.update', deal.id), transform(data), opts);
        else router.post(route('deals.store'), transform(data), opts);
    };

    const remove = () => {
        if (confirm('¿Eliminar este deal?')) {
            router.delete(route('deals.destroy', deal.id), { preserveScroll: true, onSuccess: close });
        }
    };

    const inputClass = (field) => `w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
        errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
    }`;

    return (
        <Modal show={open} onClose={close} maxWidth="lg">
            <form onSubmit={submit}>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Editar deal' : 'Nuevo deal'}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Oportunidad de venta en el pipeline</p>
                        </div>
                    </div>
                    <button type="button" onClick={close} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título <span className="text-red-500">*</span></label>
                        <input value={data.title} onChange={(e) => setData('title', e.target.value)} required className={inputClass('title')} />
                        {errors.title && <p className="mt-1 text-xs text-red-500 font-medium">{errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor ({data.currency})</label>
                            <input type="number" step="0.01" min="0" value={data.value} onChange={(e) => setData('value', e.target.value)} className={inputClass('value')} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Etapa</label>
                            <select value={data.stage_id} onChange={(e) => setData('stage_id', e.target.value)} className={inputClass('stage_id')}>
                                {pipeline?.stages?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contacto</label>
                            <select value={data.contact_id} onChange={(e) => setData('contact_id', e.target.value)} className={inputClass('contact_id')}>
                                <option value="">— Sin contacto —</option>
                                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name || c.phone}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Asignado a</label>
                            <select value={data.assigned_to} onChange={(e) => setData('assigned_to', e.target.value)} className={inputClass('assigned_to')}>
                                <option value="">— Nadie —</option>
                                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha estimada de cierre</label>
                            <input type="date" value={data.expected_close_date} onChange={(e) => setData('expected_close_date', e.target.value)} className={inputClass('expected_close_date')} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado</label>
                            <select value={data.status} onChange={(e) => setData('status', e.target.value)} className={inputClass('status')}>
                                <option value="open">Abierto</option>
                                <option value="won">Ganado</option>
                                <option value="lost">Perdido</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notas</label>
                        <textarea rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} className={inputClass('notes')} />
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
                    {isEdit ? (
                        <button type="button" onClick={remove} className="text-sm font-medium text-red-600 hover:text-red-700">
                            Eliminar deal
                        </button>
                    ) : <span />}
                    <div className="flex gap-2">
                        <button type="button" onClick={close} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                            {isEdit ? 'Guardar' : 'Crear deal'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

function StageManagerModal({ open, onClose, pipeline }) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', color: '#10b981' });
    const { errors: pageErrors } = usePage().props;

    const submit = (e) => {
        e.preventDefault();
        post(route('stages.store', pipeline.id), { preserveScroll: true, onSuccess: () => reset('name') });
    };

    return (
        <Modal show={open} onClose={onClose}>
            <div>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Etapas de {pipeline?.name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Reordena, edita colores o elimina etapas</p>
                    </div>
                </div>

                <div className="px-6 py-5">
                    {pageErrors?.stage && (
                        <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pageErrors.stage}</p>
                    )}

                    <ul className="space-y-2 mb-4">
                        {pipeline?.stages?.map((stage, i) => (
                            <li key={stage.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                                <span className="flex-1 text-sm font-medium text-gray-700">{stage.name}</span>
                                <button
                                    disabled={i === 0}
                                    onClick={() => router.patch(route('stages.move', stage.id), { direction: 'up' }, { preserveScroll: true })}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                    title="Subir"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                    </svg>
                                </button>
                                <button
                                    disabled={i === pipeline.stages.length - 1}
                                    onClick={() => router.patch(route('stages.move', stage.id), { direction: 'down' }, { preserveScroll: true })}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                    title="Bajar"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => router.delete(route('stages.destroy', stage.id), { preserveScroll: true })}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Eliminar"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={submit} className="flex items-end gap-2 pt-4 border-t border-gray-100">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Nueva etapa</label>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} required className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all" />
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>
                        <input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)} className="h-10 w-12 cursor-pointer rounded-xl border border-gray-200 bg-gray-50" />
                        <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                            Añadir
                        </button>
                    </form>
                </div>

                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default function Index({ pipelines, pipeline, deals, members, contacts, currency }) {
    const { flash } = usePage().props;
    const [modal, setModal] = useState(null);
    const [dragOver, setDragOver] = useState(null);
    const newPipelineForm = useForm({ name: '' });

    const openDeals = deals.filter((d) => d.status === 'open');
    const wonDeals = deals.filter((d) => d.status === 'won');
    const totalOpen = openDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const totalWon = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

    const dropOnStage = (e, stageId) => {
        e.preventDefault();
        setDragOver(null);
        const dealId = e.dataTransfer.getData('text/deal-id');
        const deal = deals.find((d) => d.id === dealId);
        if (deal && deal.stage_id !== stageId) {
            router.patch(route('deals.update', dealId), { stage_id: stageId }, { preserveScroll: true });
        }
    };

    const createPipeline = (e) => {
        e.preventDefault();
        newPipelineForm.post(route('pipelines.store'), {
            onSuccess: () => {
                newPipelineForm.reset();
                setModal(null);
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Pipelines</h2>}>
            <Head title="Pipelines" />

            <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pipelines de ventas</h1>
                        <p className="text-sm text-gray-400 mt-1">Arrastra las tarjetas entre etapas para mover deals</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={pipeline?.id ?? ''}
                            onChange={(e) => router.get(route('pipelines.index'), { pipeline: e.target.value })}
                            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
                        >
                            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={() => setModal('new-pipeline')} className="px-3.5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Pipeline
                        </button>
                        {pipeline && (
                            <>
                                <button onClick={() => setModal('stages')} className="px-3.5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                    Etapas
                                </button>
                                <button onClick={() => setModal('new-deal')} className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Nuevo deal
                                </button>
                            </>
                        )}
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

                {pipeline && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                                </svg>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Deals abiertos</p>
                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{openDeals.length}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4" />
                                </svg>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Valor en juego</p>
                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{money(totalOpen, currency)}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ganados</p>
                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{wonDeals.length}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ingresos ganados</p>
                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{money(totalWon, currency)}</p>
                        </div>
                    </div>
                )}

                {!pipeline ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600">No tienes pipelines todavía</p>
                        <p className="text-xs text-gray-400 mt-1">Crea el primero — se siembra con 5 etapas típicas de venta</p>
                        <button onClick={() => setModal('new-pipeline')} className="mt-4 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20">
                            Crear pipeline
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {pipeline.stages.map((stage) => {
                            const stageDeals = deals.filter((d) => d.stage_id === stage.id);
                            const stageTotal = stageDeals.filter((d) => d.status === 'open').reduce((sum, d) => sum + Number(d.value || 0), 0);

                            return (
                                <div
                                    key={stage.id}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
                                    onDragLeave={() => setDragOver(null)}
                                    onDrop={(e) => dropOnStage(e, stage.id)}
                                    className={`flex w-80 shrink-0 flex-col rounded-2xl bg-gray-50 border-2 transition-all ${
                                        dragOver === stage.id ? 'border-emerald-400 bg-emerald-50/50 scale-[1.02]' : 'border-transparent'
                                    }`}
                                >
                                    <div className="rounded-t-2xl px-4 py-3 text-white" style={{ background: `linear-gradient(135deg, ${stage.color} 0%, ${stage.color}dd 100%)` }}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm">{stage.name}</span>
                                            <span className="text-[10px] font-bold bg-white/25 rounded-full px-2 py-0.5 backdrop-blur-sm">{stageDeals.length}</span>
                                        </div>
                                        <p className="text-xs font-medium text-white/80 mt-1 tabular-nums">{money(stageTotal, currency)}</p>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 p-2.5 min-h-[200px]">
                                        {stageDeals.map((deal) => <DealCard key={deal.id} deal={deal} onEdit={setModal} currency={currency} />)}
                                        {stageDeals.length === 0 && (
                                            <p className="py-8 text-center text-xs text-gray-400 font-medium">Arrastra deals aquí</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {pipeline && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                if (confirm('¿Eliminar este pipeline con todos sus deals?')) {
                                    router.delete(route('pipelines.destroy', pipeline.id));
                                }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            Eliminar pipeline
                        </button>
                    </div>
                )}
            </div>

            <Modal show={modal === 'new-pipeline'} onClose={() => setModal(null)}>
                <form onSubmit={createPipeline}>
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Nuevo pipeline</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Se creará con 5 etapas típicas de venta</p>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                        <input
                            value={newPipelineForm.data.name}
                            onChange={(e) => newPipelineForm.setData('name', e.target.value)}
                            required
                            placeholder="ej. Ventas B2B"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
                                newPipelineForm.errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                            }`}
                        />
                        {newPipelineForm.errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{newPipelineForm.errors.name}</p>}
                    </div>
                    <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
                        <button type="button" onClick={() => setModal(null)} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={newPipelineForm.processing} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                            Crear pipeline
                        </button>
                    </div>
                </form>
            </Modal>

            <StageManagerModal open={modal === 'stages'} onClose={() => setModal(null)} pipeline={pipeline} />

            <DealFormModal
                key={modal && typeof modal === 'object' ? modal.id : String(modal)}
                open={modal === 'new-deal' || (modal && typeof modal === 'object')}
                onClose={() => setModal(null)}
                deal={typeof modal === 'object' ? modal : null}
                pipeline={pipeline}
                contacts={contacts}
                members={members}
                currency={currency}
            />
        </AuthenticatedLayout>
    );
}
