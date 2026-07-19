import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

export default function Create({ templates, tags, contactCount, hasWhatsapp }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        template_name: '',
        template_language: '',
        template_variables: [],
        header_media_url: '',
        audience: 'all',
        tag_ids: [],
        scheduled_at: '',
    });

    const selectedTemplate = useMemo(
        () => templates.find((t) => t.name === data.template_name && t.language === data.template_language),
        [templates, data.template_name, data.template_language],
    );

    const variableCount = useMemo(() => {
        const matches = selectedTemplate?.body_text?.match(/\{\{\d+\}\}/g) ?? [];
        return new Set(matches).size;
    }, [selectedTemplate]);

    const pickTemplate = (value) => {
        const [name, language] = value.split('|');
        const tpl = templates.find((t) => t.name === name && t.language === language);
        const count = new Set(tpl?.body_text?.match(/\{\{\d+\}\}/g) ?? []).size;
        setData((prev) => ({
            ...prev,
            template_name: name ?? '',
            template_language: language ?? '',
            template_variables: Array(count).fill(''),
        }));
    };

    const toggleTag = (id) =>
        setData('tag_ids', data.tag_ids.includes(id) ? data.tag_ids.filter((t) => t !== id) : [...data.tag_ids, id]);

    const submit = (e) => {
        e.preventDefault();
        post(route('broadcasts.store'));
    };

    const inputClass = (field) => `w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
        errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
    }`;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-gray-900">Nuevo broadcast</h2>}>
            <Head title="Nuevo broadcast" />

            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div>
                    <Link href={route('broadcasts.index')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver a broadcasts
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Nuevo broadcast</h1>
                    <p className="text-sm text-gray-400 mt-1">Envía una plantilla aprobada a una audiencia segmentada</p>
                </div>

                {!hasWhatsapp && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3 shadow-sm">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        WhatsApp no está conectado — el broadcast fallará al enviarse.
                    </div>
                )}
                {templates.length === 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3 shadow-sm">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <span>
                            No tienes plantillas aprobadas.{' '}
                            <Link href={route('templates.index')} className="font-bold underline">Sincroniza o crea una plantilla</Link>
                            {' '}primero — Meta solo permite iniciar conversaciones con plantillas aprobadas.
                        </span>
                    </div>
                )}

                <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 sm:p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre interno</label>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} required placeholder="ej. Promo Black Friday" className={inputClass('name')} />
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plantilla aprobada</label>
                            <select
                                value={data.template_name ? `${data.template_name}|${data.template_language}` : ''}
                                onChange={(e) => pickTemplate(e.target.value)}
                                required
                                className={inputClass('template_name')}
                            >
                                <option value="">Selecciona una plantilla…</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={`${t.name}|${t.language}`}>
                                        {t.name} ({t.language})
                                    </option>
                                ))}
                            </select>
                            {errors.template_name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.template_name}</p>}
                            {selectedTemplate && (
                                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Vista previa del cuerpo</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTemplate.body_text}</p>
                                </div>
                            )}
                        </div>

                        {['image', 'video', 'document'].includes(selectedTemplate?.header_type) && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    URL pública del {selectedTemplate.header_type === 'image' ? 'imagen' : selectedTemplate.header_type === 'video' ? 'video' : 'documento'} del encabezado
                                </label>
                                <input
                                    type="url"
                                    value={data.header_media_url}
                                    onChange={(e) => setData('header_media_url', e.target.value)}
                                    placeholder="https://tu-sitio.com/promo.jpg"
                                    required
                                    className={inputClass('header_media_url')}
                                />
                                {errors.header_media_url && <p className="mt-1 text-xs text-red-500 font-medium">{errors.header_media_url}</p>}
                                <p className="mt-1.5 text-xs text-gray-400">Esta plantilla tiene encabezado multimedia — Meta descarga el archivo desde esta URL al enviar cada mensaje</p>
                            </div>
                        )}

                        {variableCount > 0 && (
                            <div className="space-y-2 rounded-xl bg-purple-50/50 border border-purple-100 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Variables de la plantilla</p>
                                <p className="text-xs text-purple-600">Admite <code className="bg-white/60 px-1.5 py-0.5 rounded">{'{name}'}</code>, <code className="bg-white/60 px-1.5 py-0.5 rounded">{'{phone}'}</code>, <code className="bg-white/60 px-1.5 py-0.5 rounded">{'{email}'}</code>, <code className="bg-white/60 px-1.5 py-0.5 rounded">{'{company}'}</code></p>
                                {Array.from({ length: variableCount }).map((_, i) => (
                                    <input
                                        key={i}
                                        value={data.template_variables[i] ?? ''}
                                        onChange={(e) => {
                                            const next = [...data.template_variables];
                                            next[i] = e.target.value;
                                            setData('template_variables', next);
                                        }}
                                        placeholder={`Valor para {{${i + 1}}} — ej. Hola {name}`}
                                        required
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                    />
                                ))}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Audiencia</label>
                            <div className="space-y-2">
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    data.audience === 'all' ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}>
                                    <input type="radio" checked={data.audience === 'all'} onChange={() => setData('audience', 'all')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">Todos los contactos</p>
                                        <p className="text-xs text-gray-500">{contactCount} contactos en total</p>
                                    </div>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    data.audience === 'tags' ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}>
                                    <input type="radio" checked={data.audience === 'tags'} onChange={() => setData('audience', 'tags')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">Contactos con alguna de estas etiquetas</p>
                                        <p className="text-xs text-gray-500">Segmenta por etiqueta</p>
                                    </div>
                                </label>
                            </div>
                            {data.audience === 'tags' && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleTag(tag.id)}
                                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                                data.tag_ids.includes(tag.id) ? 'text-white shadow-md scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                            style={data.tag_ids.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                    {tags.length === 0 && <p className="text-xs text-gray-400">No hay etiquetas creadas</p>}
                                </div>
                            )}
                            {errors.audience && <p className="mt-1 text-xs text-red-500 font-medium">{errors.audience}</p>}
                            {errors.tag_ids && <p className="mt-1 text-xs text-red-500 font-medium">{errors.tag_ids}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Programar <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <input type="datetime-local" value={data.scheduled_at} onChange={(e) => setData('scheduled_at', e.target.value)} className={inputClass('scheduled_at')} />
                            {errors.scheduled_at && <p className="mt-1 text-xs text-red-500 font-medium">{errors.scheduled_at}</p>}
                            <p className="mt-1.5 text-xs text-gray-400">Vacío = enviar inmediatamente al guardar</p>
                        </div>
                    </div>

                    <div className="px-5 sm:px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                        <Link href={route('broadcasts.index')} className="text-sm font-semibold text-gray-600 hover:text-gray-800">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing || templates.length === 0} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
                            {data.scheduled_at ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Programar broadcast
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                    Enviar broadcast
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
