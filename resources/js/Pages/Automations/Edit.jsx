import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const STEP_META = {
    send_message: { label: 'Enviar mensaje', gradient: 'from-emerald-500 to-teal-600', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    add_tag: { label: 'Añadir etiqueta', gradient: 'from-blue-500 to-indigo-600', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
    remove_tag: { label: 'Quitar etiqueta', gradient: 'from-gray-400 to-gray-500', icon: 'M6 18L18 6M6 6l12 12' },
    condition: { label: 'Condición (sí/no)', gradient: 'from-purple-500 to-violet-600', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
    wait: { label: 'Esperar', gradient: 'from-amber-400 to-orange-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    webhook: { label: 'Webhook', gradient: 'from-sky-500 to-blue-600', icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' },
};

const CONDITION_FIELDS = {
    message_text: 'Texto del mensaje',
    contact_name: 'Nombre del contacto',
    contact_email: 'Email del contacto',
    contact_company: 'Empresa del contacto',
    has_tag: 'Tiene la etiqueta',
};

const OPERATORS = {
    contains: 'contiene',
    equals: 'es igual a',
    not_equals: 'es distinto de',
    empty: 'está vacío',
    not_empty: 'no está vacío',
};

function newStep(type) {
    const base = { type, config: {}, children_yes: [], children_no: [] };
    if (type === 'wait') base.config = { minutes: 60 };
    if (type === 'condition') base.config = { field: 'message_text', operator: 'contains', value: '' };
    return base;
}

const inputBase = 'w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all';

function StepConfig({ step, onChange, tags }) {
    const config = step.config ?? {};
    const set = (patch) => onChange({ ...step, config: { ...config, ...patch } });

    switch (step.type) {
        case 'send_message':
            return (
                <textarea rows={2} placeholder="Texto — admite {name}, {phone}, {email}, {company}" value={config.text ?? ''} onChange={(e) => set({ text: e.target.value })} className={inputBase} />
            );
        case 'add_tag':
        case 'remove_tag':
            return (
                <select value={config.tag_id ?? ''} onChange={(e) => set({ tag_id: e.target.value })} className={inputBase}>
                    <option value="">Selecciona etiqueta…</option>
                    {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            );
        case 'wait':
            return (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Esperar</span>
                    <input type="number" min="1" value={config.minutes ?? 60} onChange={(e) => set({ minutes: Number(e.target.value) })} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                    <span>minutos y continuar</span>
                </div>
            );
        case 'webhook':
            return (
                <input type="url" placeholder="https://tu-servidor.com/hook" value={config.url ?? ''} onChange={(e) => set({ url: e.target.value })} className={inputBase} />
            );
        case 'condition':
            return (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <select value={config.field ?? 'message_text'} onChange={(e) => set({ field: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
                        {Object.entries(CONDITION_FIELDS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    {config.field === 'has_tag' ? (
                        <select value={config.tag_id ?? ''} onChange={(e) => set({ tag_id: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
                            <option value="">Selecciona etiqueta…</option>
                            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    ) : (
                        <>
                            <select value={config.operator ?? 'contains'} onChange={(e) => set({ operator: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
                                {Object.entries(OPERATORS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            {!['empty', 'not_empty'].includes(config.operator) && (
                                <input placeholder="valor" value={config.value ?? ''} onChange={(e) => set({ value: e.target.value })} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
                            )}
                        </>
                    )}
                </div>
            );
        default:
            return null;
    }
}

function AddStepButtons({ onAdd, compact }) {
    return (
        <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-3'}`}>
            {Object.entries(STEP_META).map(([type, meta]) => (
                <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(newStep(type))}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-xs font-medium transition-all ${
                        compact ? 'border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50' : 'border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-white'
                    }`}
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {meta.label}
                </button>
            ))}
        </div>
    );
}

function StepList({ steps, onChange, tags, depth = 0 }) {
    const update = (i, step) => onChange(steps.map((s, idx) => (idx === i ? step : s)));
    const remove = (i) => onChange(steps.filter((_, idx) => idx !== i));
    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= steps.length) return;
        const next = [...steps];
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            {steps.map((step, i) => {
                const meta = STEP_META[step.type] ?? STEP_META.send_message;
                return (
                    <div key={i} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-sm`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button type="button" onClick={() => move(i, -1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                    </svg>
                                </button>
                                <button type="button" onClick={() => move(i, 1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                <button type="button" onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <StepConfig step={step} onChange={(s) => update(i, s)} tags={tags} />

                        {step.type === 'condition' && depth < 3 && (
                            <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                                {['children_yes', 'children_no'].map((branch) => (
                                    <div key={branch} className={`rounded-xl border-2 border-dashed p-2.5 ${
                                        branch === 'children_yes' ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'
                                    }`}>
                                        <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                            branch === 'children_yes' ? 'text-emerald-700' : 'text-red-700'
                                        }`}>
                                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-white text-[8px] ${
                                                branch === 'children_yes' ? 'bg-emerald-500' : 'bg-red-500'
                                            }`}>{branch === 'children_yes' ? '✓' : '✗'}</span>
                                            {branch === 'children_yes' ? 'Sí' : 'No'}
                                        </p>
                                        <StepList steps={step[branch]} onChange={(children) => update(i, { ...step, [branch]: children })} tags={tags} depth={depth + 1} />
                                        <AddStepButtons compact onAdd={(s) => update(i, { ...step, [branch]: [...step[branch], s] })} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function Edit({ automation, steps, tags }) {
    const { flash } = usePage().props;
    const isEdit = !!automation;

    const { data, setData, post, patch, processing, errors } = useForm({
        name: automation?.name ?? '',
        description: automation?.description ?? '',
        trigger_type: automation?.trigger_type ?? 'inbound_message',
        trigger_config: automation?.trigger_config ?? {},
        steps: steps ?? [],
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit ? patch(route('automations.update', automation.id), { preserveScroll: true }) : post(route('automations.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Editar' : 'Nueva'} automatización</h2>}>
            <Head title="Automatización" />

            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <Link href={route('automations.index')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver a automatizaciones
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{isEdit ? automation.name : 'Nueva automatización'}</h1>
                    <p className="text-sm text-gray-400 mt-1">Define cuándo se dispara y qué pasos ejecuta</p>
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

                <form onSubmit={submit} className="space-y-5">
                    {/* Configuración */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Configuración</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Cuándo se dispara esta automatización</p>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                                    <input value={data.name} onChange={(e) => setData('name', e.target.value)} required className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')} />
                                    {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Disparador</label>
                                    <select value={data.trigger_type} onChange={(e) => setData('trigger_type', e.target.value)} className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')}>
                                        <option value="inbound_message">Cada mensaje entrante</option>
                                        <option value="new_contact">Contacto nuevo</option>
                                        <option value="keyword">Mensaje con palabra clave</option>
                                    </select>
                                </div>
                            </div>

                            {data.trigger_type === 'keyword' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Palabras clave <span className="text-gray-400 font-normal">(separadas por coma)</span></label>
                                    <input
                                        placeholder="precio, catálogo, info"
                                        value={(data.trigger_config.keywords ?? []).join(', ')}
                                        onChange={(e) => setData('trigger_config', { keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                                        className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')}
                                    />
                                    {errors['trigger_config.keywords'] && <p className="mt-1 text-xs text-red-500 font-medium">{errors['trigger_config.keywords']}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                                <input value={data.description} onChange={(e) => setData('description', e.target.value)} className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')} />
                            </div>
                        </div>
                    </div>

                    {/* Pasos */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Pasos</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Se ejecutan en orden. Las condiciones pueden anidarse hasta 3 niveles</p>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6 bg-gray-50/30">
                            {errors.steps && (
                                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">{errors.steps}</div>
                            )}
                            <StepList steps={data.steps} onChange={(s) => setData('steps', s)} tags={tags} />
                            <AddStepButtons onAdd={(s) => setData('steps', [...data.steps, s])} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href={route('automations.index')} className="text-sm font-semibold text-gray-600 hover:text-gray-800">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                            {isEdit ? 'Guardar cambios' : 'Crear automatización'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
