import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_STYLES = {
    DRAFT: 'bg-gray-100 text-gray-700 ring-gray-200',
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 ring-red-200',
    PAUSED: 'bg-orange-50 text-orange-700 ring-orange-200',
    DISABLED: 'bg-gray-100 text-gray-500 ring-gray-200',
};

const STATUS_DOT = {
    DRAFT: 'bg-gray-400',
    PENDING: 'bg-amber-500',
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-red-500',
    PAUSED: 'bg-orange-500',
    DISABLED: 'bg-gray-400',
};

const CATEGORY_STYLES = {
    Marketing: 'from-purple-500 to-violet-600 shadow-purple-500/20',
    Utility: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
    Authentication: 'from-amber-500 to-orange-600 shadow-amber-500/20',
};

function TemplateFormModal({ open, onClose, template }) {
    const isEdit = !!template;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: template?.name ?? '',
        category: template?.category ?? 'Marketing',
        language: template?.language ?? 'es',
        header_type: template?.header_type ?? '',
        header_content: template?.header_content ?? '',
        body_text: template?.body_text ?? '',
        footer_text: template?.footer_text ?? '',
    });

    const close = () => {
        reset();
        clearErrors();
        onClose();
    };

    const submit = (e) => {
        e.preventDefault();
        const payload = { ...data, header_type: data.header_type || null };
        const opts = { preserveScroll: true, onSuccess: close };
        isEdit
            ? patch(route('templates.update', template.id), opts)
            : post(route('templates.store'), opts);
    };

    return (
        <Modal show={open} onClose={close} maxWidth="lg">
            <form onSubmit={submit}>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    {isEdit ? 'Editar plantilla' : 'Nueva plantilla'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Las plantillas aprobadas por Meta se usan en broadcasts
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={close} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Nombre <span className="text-gray-400 font-normal">(a-z, 0-9, _)</span>
                            </label>
                            <input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                required
                                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
                                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 focus:bg-white'
                                }`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Idioma <span className="text-gray-400 font-normal">(es, es_MX, en_US…)</span>
                            </label>
                            <input
                                id="language"
                                value={data.language}
                                onChange={(e) => setData('language', e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría</label>
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all"
                            >
                                <option>Marketing</option>
                                <option>Utility</option>
                                <option>Authentication</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Encabezado</label>
                            <select
                                value={data.header_type}
                                onChange={(e) => setData('header_type', e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all"
                            >
                                <option value="">Sin encabezado</option>
                                <option value="text">Texto</option>
                            </select>
                        </div>
                    </div>

                    {data.header_type === 'text' && (
                        <div>
                            <label htmlFor="header_content" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Texto del encabezado
                            </label>
                            <input
                                id="header_content"
                                maxLength={60}
                                value={data.header_content}
                                onChange={(e) => setData('header_content', e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="body_text" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Cuerpo <span className="text-gray-400 font-normal">— usa {'{{1}}, {{2}}'}… para variables</span>
                        </label>
                        <textarea
                            id="body_text"
                            rows={5}
                            maxLength={1024}
                            required
                            value={data.body_text}
                            onChange={(e) => setData('body_text', e.target.value)}
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
                                errors.body_text ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 focus:bg-white'
                            }`}
                        />
                        <p className="mt-1 text-xs text-gray-400">{data.body_text.length}/1024 caracteres</p>
                    </div>

                    <div>
                        <label htmlFor="footer_text" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Pie <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            id="footer_text"
                            maxLength={60}
                            value={data.footer_text}
                            onChange={(e) => setData('footer_text', e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
                    <button type="button" onClick={close} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {isEdit ? 'Guardar' : 'Crear borrador'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function Index({ templates, canSync }) {
    const { flash, errors } = usePage().props;
    const [modal, setModal] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const sync = () =>
        router.post(
            route('templates.sync'),
            {},
            {
                preserveScroll: true,
                onStart: () => setSyncing(true),
                onFinish: () => setSyncing(false),
            },
        );

    const approvedCount = templates.filter((t) => t.status === 'APPROVED').length;
    const pendingCount = templates.filter((t) => t.status === 'PENDING').length;
    const draftCount = templates.filter((t) => t.status === 'DRAFT').length;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Plantillas</h2>}>
            <Head title="Plantillas" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Plantillas de mensaje</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Mensajes pre-aprobados por Meta para iniciar conversaciones y broadcasts
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Aprobadas</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{approvedCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">En revisión</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{pendingCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Borradores</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{draftCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#045474] to-[#1c486c] flex items-center justify-center text-white shadow-lg shadow-[#045474]/20 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tabular-nums">{templates.length}</p>
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
                {errors?.sync && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        {errors.sync}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Todas las plantillas</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Meta es la fuente de verdad — sincroniza para tener el estado real</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {canSync && (
                                <button
                                    onClick={sync}
                                    disabled={syncing}
                                    className="px-3.5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    {syncing ? 'Sincronizando…' : 'Sincronizar con Meta'}
                                </button>
                            )}
                            <button
                                onClick={() => setModal('create')}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Nueva plantilla
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Idioma</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cuerpo</th>
                                    <th className="text-left px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-right px-5 sm:px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {templates.map((tpl) => (
                                    <tr key={tpl.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-5 sm:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg ${CATEGORY_STYLES[tpl.category] ?? CATEGORY_STYLES.Marketing}`}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                                    </svg>
                                                </div>
                                                <span className="font-mono text-xs font-semibold text-gray-900">{tpl.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-gray-500 hidden md:table-cell">
                                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-600">{tpl.language}</span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-gray-600 font-medium">{tpl.category}</td>
                                        <td className="max-w-xs truncate px-5 sm:px-6 py-4 text-gray-500 hidden lg:table-cell">{tpl.body_text}</td>
                                        <td className="px-5 sm:px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${STATUS_STYLES[tpl.status] ?? STATUS_STYLES.DRAFT}`}
                                                title={tpl.rejection_reason ?? tpl.submission_error ?? ''}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[tpl.status] ?? STATUS_DOT.DRAFT}`} />
                                                {tpl.status}
                                            </span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {['DRAFT', 'REJECTED'].includes(tpl.status) && (
                                                    <>
                                                        <button
                                                            onClick={() => setModal(tpl)}
                                                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        {canSync && (
                                                            <button
                                                                onClick={() => router.post(route('templates.submit', tpl.id), {}, { preserveScroll: true })}
                                                                className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                                                title="Enviar a Meta"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm('¿Eliminar esta plantilla (solo local)?')) {
                                                            router.delete(route('templates.destroy', tpl.id), { preserveScroll: true });
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
                                ))}
                                {templates.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 sm:px-6 py-16 text-center">
                                            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Sin plantillas todavía</p>
                                            <p className="text-xs text-gray-400 mt-1">Crea una o sincroniza las aprobadas desde Meta</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <TemplateFormModal
                key={modal && typeof modal === 'object' ? modal.id : String(modal)}
                open={modal === 'create' || (modal && typeof modal === 'object')}
                onClose={() => setModal(null)}
                template={typeof modal === 'object' ? modal : null}
            />
        </AuthenticatedLayout>
    );
}
