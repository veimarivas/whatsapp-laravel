import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const NODE_META = {
    send_message: { label: 'Mensaje', gradient: 'from-emerald-500 to-teal-600', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    send_buttons: { label: 'Botones', gradient: 'from-blue-500 to-indigo-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    send_list: { label: 'Lista', gradient: 'from-purple-500 to-violet-600', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    collect_input: { label: 'Capturar dato', gradient: 'from-amber-500 to-orange-600', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    condition: { label: 'Condición', gradient: 'from-pink-500 to-rose-600', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
    set_tag: { label: 'Etiquetar', gradient: 'from-sky-500 to-blue-600', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
    http_fetch: { label: 'HTTP', gradient: 'from-cyan-500 to-teal-600', icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' },
    handoff: { label: 'Pasar a agente', gradient: 'from-indigo-500 to-purple-600', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' },
    end: { label: 'Fin', gradient: 'from-gray-500 to-gray-700', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

const inputBase = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all';
const smallInput = 'px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all';

function NextSelect({ value, onChange, nodeKeys, label = 'Siguiente' }) {
    return (
        <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <span className="font-medium">{label}:</span>
            <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className={smallInput}>
                <option value="">— fin —</option>
                {nodeKeys.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
        </label>
    );
}

function OptionsEditor({ options, onChange, nodeKeys, max, label }) {
    const update = (i, patch) => onChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
    return (
        <div className="mt-3 space-y-1.5 rounded-xl bg-gray-50 border border-gray-200 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
            {options.map((opt, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5">
                    <input placeholder="id" value={opt.id ?? ''} onChange={(e) => update(i, { id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={`w-24 ${smallInput} font-mono`} />
                    <input placeholder="Texto del botón" value={opt.title ?? ''} onChange={(e) => update(i, { title: e.target.value })} className={`flex-1 ${smallInput}`} />
                    <NextSelect label="→" value={opt.next} onChange={(next) => update(i, { next })} nodeKeys={nodeKeys} />
                    <button type="button" onClick={() => onChange(options.filter((_, idx) => idx !== i))} className="p-1 text-gray-400 hover:text-red-500 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            {options.length < max && (
                <button type="button" onClick={() => onChange([...options, { id: '', title: '', next: null }])} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Añadir opción
                </button>
            )}
        </div>
    );
}

function NodeCard({ node, onChange, onRemove, nodeKeys, tags, isEntry }) {
    const config = node.config ?? {};
    const setConfig = (patch) => onChange({ ...node, config: { ...config, ...patch } });
    const meta = NODE_META[node.node_type] ?? NODE_META.send_message;

    return (
        <div className={`rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-all ${
            isEntry ? 'border-emerald-300 ring-2 ring-emerald-500/20' : 'border-gray-200'
        }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-sm`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                    {isEntry && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold ring-1 ring-emerald-200">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            ENTRADA
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <input value={node.node_key} onChange={(e) => onChange({ ...node, node_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={`w-36 ${smallInput} font-mono`} />
                    <button type="button" onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166" />
                        </svg>
                    </button>
                </div>
            </div>

            {['send_message', 'send_buttons', 'send_list', 'collect_input'].includes(node.node_type) && (
                <textarea rows={2} placeholder="Texto — admite {name} y {variables} capturadas" value={config.text ?? ''} onChange={(e) => setConfig({ text: e.target.value })} className={inputBase} />
            )}

            {node.node_type === 'send_message' && (
                <div className="mt-2"><NextSelect value={config.next} onChange={(next) => setConfig({ next })} nodeKeys={nodeKeys} /></div>
            )}

            {node.node_type === 'send_buttons' && (
                <OptionsEditor options={config.buttons ?? []} onChange={(buttons) => setConfig({ buttons })} nodeKeys={nodeKeys} max={3} label="Botones (máx. 3)" />
            )}

            {node.node_type === 'send_list' && (
                <>
                    <input placeholder="Etiqueta del botón de lista" value={config.button_label ?? ''} onChange={(e) => setConfig({ button_label: e.target.value })} className={`mt-2 w-64 ${smallInput}`} />
                    <OptionsEditor options={config.rows ?? []} onChange={(rows) => setConfig({ rows })} nodeKeys={nodeKeys} max={10} label="Filas (máx. 10)" />
                </>
            )}

            {node.node_type === 'collect_input' && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="font-medium">Variable:</span>
                        <input value={config.var ?? ''} onChange={(e) => setConfig({ var: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={`w-28 ${smallInput} font-mono`} />
                    </label>
                    <NextSelect value={config.next} onChange={(next) => setConfig({ next })} nodeKeys={nodeKeys} />
                </div>
            )}

            {node.node_type === 'condition' && (
                <div className="mt-2 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-gray-600 font-medium">Si la variable</span>
                        <input value={config.var ?? ''} onChange={(e) => setConfig({ var: e.target.value })} className={`w-28 ${smallInput} font-mono`} />
                        <select value={config.operator ?? 'equals'} onChange={(e) => setConfig({ operator: e.target.value })} className={smallInput}>
                            <option value="equals">es igual a</option>
                            <option value="contains">contiene</option>
                            <option value="not_empty">no está vacía</option>
                        </select>
                        {config.operator !== 'not_empty' && (
                            <input value={config.value ?? ''} onChange={(e) => setConfig({ value: e.target.value })} className={`w-32 ${smallInput}`} />
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
                        <NextSelect label="✓ Sí →" value={config.next_yes} onChange={(next_yes) => setConfig({ next_yes })} nodeKeys={nodeKeys} />
                        <NextSelect label="✗ No →" value={config.next_no} onChange={(next_no) => setConfig({ next_no })} nodeKeys={nodeKeys} />
                    </div>
                </div>
            )}

            {node.node_type === 'set_tag' && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <select value={config.tag_id ?? ''} onChange={(e) => setConfig({ tag_id: e.target.value })} className={smallInput}>
                        <option value="">Selecciona etiqueta…</option>
                        {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <NextSelect value={config.next} onChange={(next) => setConfig({ next })} nodeKeys={nodeKeys} />
                </div>
            )}

            {node.node_type === 'http_fetch' && (
                <div className="mt-2 space-y-2">
                    <input type="url" placeholder="https://api.ejemplo.com/dato" value={config.url ?? ''} onChange={(e) => setConfig({ url: e.target.value })} className={smallInput + ' w-full'} />
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="font-medium">Guardar en variable:</span>
                            <input value={config.var ?? ''} onChange={(e) => setConfig({ var: e.target.value })} className={`w-28 ${smallInput} font-mono`} />
                        </label>
                        <NextSelect value={config.next} onChange={(next) => setConfig({ next })} nodeKeys={nodeKeys} />
                    </div>
                </div>
            )}

            {['handoff', 'end'].includes(node.node_type) && (
                <textarea rows={2} placeholder="Mensaje final (opcional)" value={config.message ?? ''} onChange={(e) => setConfig({ message: e.target.value })} className={inputBase} />
            )}
        </div>
    );
}

export default function Edit({ flow, nodes, tags }) {
    const { flash } = usePage().props;

    const { data, setData, patch, processing, errors } = useForm({
        name: flow.name,
        trigger_type: flow.trigger_type,
        trigger_config: flow.trigger_config ?? {},
        entry_node_id: flow.entry_node_id ?? '',
        fallback_policy: flow.fallback_policy ?? {},
        nodes: nodes ?? [],
    });

    const nodeKeys = data.nodes.map((n) => n.node_key).filter(Boolean);

    const addNode = (type) => {
        let base = `${type}_${data.nodes.length + 1}`.replace(/[^a-z0-9_]/g, '_');
        while (nodeKeys.includes(base)) base += '_x';
        setData('nodes', [...data.nodes, { node_key: base, node_type: type, config: {} }]);
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('flows.update', flow.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Editar flow</h2>}>
            <Head title={`Flow — ${flow.name}`} />

            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <Link href={route('flows.index')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver a flows
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{flow.name}</h1>
                    <p className="text-sm text-gray-400 mt-1">Construye el grafo del chatbot con nodos y edges</p>
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
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Configuración</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Disparador y política de fallbacks</p>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                                    <input value={data.name} onChange={(e) => setData('name', e.target.value)} required className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Disparador</label>
                                    <select value={data.trigger_type} onChange={(e) => setData('trigger_type', e.target.value)} className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')}>
                                        <option value="keyword">Palabra clave</option>
                                        <option value="first_inbound_message">Primer mensaje del contacto</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nodo de entrada</label>
                                    <select value={data.entry_node_id} onChange={(e) => setData('entry_node_id', e.target.value)} className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')}>
                                        {nodeKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                    {errors.entry_node_id && <p className="mt-1 text-xs text-red-500 font-medium">{errors.entry_node_id}</p>}
                                </div>
                            </div>

                            {data.trigger_type === 'keyword' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Palabras clave <span className="text-gray-400 font-normal">(separadas por coma)</span></label>
                                    <input
                                        value={(data.trigger_config.keywords ?? []).join(', ')}
                                        onChange={(e) => setData('trigger_config', { keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                                        className={inputBase.replace('bg-white', 'bg-gray-50 hover:bg-white focus:bg-white')}
                                    />
                                    {errors['trigger_config.keywords'] && <p className="mt-1 text-xs text-red-500 font-medium">{errors['trigger_config.keywords']}</p>}
                                </div>
                            )}

                            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex flex-wrap items-center gap-4 text-sm">
                                <label className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Reintentos máx.:</span>
                                    <input type="number" min="0" max="5" value={data.fallback_policy.max_reprompts ?? 2} onChange={(e) => setData('fallback_policy', { ...data.fallback_policy, max_reprompts: Number(e.target.value) })} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center bg-white" />
                                </label>
                                <label className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Timeout (h):</span>
                                    <input type="number" min="1" max="168" value={data.fallback_policy.on_timeout_hours ?? 24} onChange={(e) => setData('fallback_policy', { ...data.fallback_policy, on_timeout_hours: Number(e.target.value) })} className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center bg-white" />
                                </label>
                                <label className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Al agotar:</span>
                                    <select value={data.fallback_policy.on_exhaust ?? 'handoff'} onChange={(e) => setData('fallback_policy', { ...data.fallback_policy, on_exhaust: e.target.value })} className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white">
                                        <option value="handoff">Pasar a agente</option>
                                        <option value="end">Terminar</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Nodos */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Nodos del grafo</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Los edges (next, next_yes, next_no, botones) apuntan a claves de otros nodos</p>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6 bg-gray-50/30 space-y-3">
                            {errors.nodes && <div className="mb-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">{errors.nodes}</div>}
                            {data.nodes.map((node, i) => (
                                <NodeCard
                                    key={i}
                                    node={node}
                                    nodeKeys={nodeKeys}
                                    tags={tags}
                                    isEntry={node.node_key === data.entry_node_id}
                                    onChange={(n) => setData('nodes', data.nodes.map((x, idx) => (idx === i ? n : x)))}
                                    onRemove={() => setData('nodes', data.nodes.filter((_, idx) => idx !== i))}
                                />
                            ))}

                            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white/50 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Añadir nodo</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(NODE_META).map(([type, meta]) => (
                                        <button key={type} type="button" onClick={() => addNode(type)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            {meta.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href={route('flows.index')} className="text-sm font-semibold text-gray-600 hover:text-gray-800">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                            Guardar flow
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
