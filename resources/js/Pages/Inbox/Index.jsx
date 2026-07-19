import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Con Reverb activo los eventos llegan por WebSocket; el polling queda
// como respaldo lento por si el servidor de WebSockets no está corriendo.
const POLL_MS = 30000;

function csrf() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf(),
            Accept: 'application/json',
        },
        credentials: 'same-origin',
        ...options,
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? res.statusText);
    return res.json();
}

function timeAgo(iso) {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return new Date(iso).toLocaleDateString();
}

const STATUS_LABELS = { open: 'Abierta', pending: 'Pendiente', closed: 'Cerrada' };
const TICKS = { sending: '🕓', sent: '✓', delivered: '✓✓', read: '✓✓', failed: '⚠' };

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'];

function MessageBubble({ msg, onReply, onReact }) {
    const isCustomer = msg.sender_type === 'customer';
    const [showEmojis, setShowEmojis] = useState(false);
    return (
        <div className={`group flex items-center gap-1 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
            {!isCustomer && msg.message_id && (
                <BubbleActions
                    onReply={() => onReply(msg)}
                    showEmojis={showEmojis}
                    setShowEmojis={setShowEmojis}
                    onReact={(e) => onReact(msg, e)}
                />
            )}
            <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                    isCustomer ? 'bg-white text-gray-900' : 'bg-emerald-600 text-white'
                }`}
            >
                {msg.reply_to && (
                    <div
                        className={`mb-1 rounded border-l-2 px-2 py-1 text-xs ${
                            isCustomer
                                ? 'border-emerald-500 bg-gray-50 text-gray-500'
                                : 'border-white/60 bg-emerald-700/60 text-emerald-50'
                        }`}
                    >
                        {msg.reply_to.content_text || `[${msg.reply_to.content_type}]`}
                    </div>
                )}
                {msg.content_type === 'image' && msg.media_url && (
                    <img
                        src={`/whatsapp/media/${msg.media_url}`}
                        alt=""
                        className="mb-1 max-h-64 rounded"
                    />
                )}
                {msg.content_type === 'audio' && msg.media_url && (
                    <audio controls src={`/whatsapp/media/${msg.media_url}`} className="mb-1" />
                )}
                {msg.content_type === 'document' && msg.media_url && (
                    <a
                        href={`/whatsapp/media/${msg.media_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-1 block underline"
                    >
                        📄 {msg.content_text || 'Documento'}
                    </a>
                )}
                {msg.content_text && msg.content_type !== 'document' && (
                    <p className="whitespace-pre-wrap break-words">{msg.content_text}</p>
                )}
                <div
                    className={`mt-1 flex items-center gap-1 text-[10px] ${
                        isCustomer ? 'text-gray-400' : 'text-emerald-100'
                    }`}
                >
                    <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                    {!isCustomer && (
                        <span className={msg.status === 'read' ? 'text-sky-200' : ''}>
                            {TICKS[msg.status] ?? ''}
                        </span>
                    )}
                    {msg.reactions?.length > 0 && (
                        <span className="text-sm">{msg.reactions.map((r) => r.emoji).join('')}</span>
                    )}
                </div>
            </div>
            {isCustomer && msg.message_id && (
                <BubbleActions
                    onReply={() => onReply(msg)}
                    showEmojis={showEmojis}
                    setShowEmojis={setShowEmojis}
                    onReact={(e) => onReact(msg, e)}
                />
            )}
        </div>
    );
}

function BubbleActions({ onReply, showEmojis, setShowEmojis, onReact }) {
    return (
        <div className="relative flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
                type="button"
                onClick={onReply}
                title="Responder citando"
                className="rounded-full bg-white p-1 text-xs text-gray-500 shadow hover:text-gray-800"
            >
                ↩
            </button>
            <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                title="Reaccionar"
                className="rounded-full bg-white p-1 text-xs text-gray-500 shadow hover:text-gray-800"
            >
                🙂
            </button>
            {showEmojis && (
                <div className="absolute bottom-7 right-0 z-10 flex gap-1 rounded-full bg-white px-2 py-1 shadow-lg">
                    {QUICK_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                                onReact(emoji);
                                setShowEmojis(false);
                            }}
                            className="text-base hover:scale-125"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Index({ hasWhatsappConfig, hasAi, members }) {
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const selectedRef = useRef(null);
    selectedRef.current = selectedId;

    const selected = conversations.find((c) => c.id === selectedId);

    const loadConversations = useCallback(async () => {
        try {
            setConversations(await api(route('inbox.conversations')));
        } catch {
            /* siguiente poll */
        }
    }, []);

    const loadMessages = useCallback(async (id) => {
        try {
            const data = await api(route('inbox.messages', id));
            if (selectedRef.current === id) setMessages(data);
        } catch {
            /* siguiente poll */
        }
    }, []);

    const accountId = usePage().props.auth.user?.account_id;

    useEffect(() => {
        loadConversations();
        const t = setInterval(() => {
            loadConversations();
            if (selectedRef.current) loadMessages(selectedRef.current);
        }, POLL_MS);
        return () => clearInterval(t);
    }, [loadConversations, loadMessages]);

    // Tiempo real: cualquier evento del inbox de la cuenta refresca la
    // lista, y el hilo abierto solo si es la conversación afectada.
    useEffect(() => {
        if (!window.Echo || !accountId) return;
        const channel = window.Echo.private(`account.${accountId}`).listen(
            'InboxUpdated',
            (e) => {
                loadConversations();
                if (selectedRef.current && (!e.conversation_id || e.conversation_id === selectedRef.current)) {
                    loadMessages(selectedRef.current);
                }
            },
        );
        return () => {
            window.Echo.leave(`account.${accountId}`);
        };
    }, [accountId, loadConversations, loadMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const openConversation = async (conv) => {
        setSelectedId(conv.id);
        setMessages([]);
        setReplyTo(null);
        setShowNotes(false);
        await loadMessages(conv.id);
        loadNotes(conv.id);
        if (conv.unread_count > 0) {
            api(route('inbox.read', conv.id), { method: 'POST' }).then(loadConversations);
        }
    };

    const send = async (e) => {
        e.preventDefault();
        if (!draft.trim() || sending || !selectedId) return;
        setSending(true);
        setError(null);
        try {
            await api(route('inbox.send', selectedId), {
                method: 'POST',
                body: JSON.stringify({
                    text: draft.trim(),
                    reply_to_message_id: replyTo?.id ?? null,
                }),
            });
            setDraft('');
            setReplyTo(null);
            await loadMessages(selectedId);
            await loadConversations();
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    const setStatus = async (status) => {
        if (!selectedId) return;
        await api(route('inbox.status', selectedId), {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        loadConversations();
    };

    const assign = async (agentId) => {
        if (!selectedId) return;
        await api(route('inbox.assign', selectedId), {
            method: 'PATCH',
            body: JSON.stringify({ agent_id: agentId || null }),
        });
        loadConversations();
    };

    const [replyTo, setReplyTo] = useState(null);
    const reactTo = async (msg, emoji) => {
        try {
            await api(route('inbox.react', msg.id), {
                method: 'POST',
                body: JSON.stringify({ emoji }),
            });
            await loadMessages(selectedId);
        } catch (err) {
            setError(err.message);
        }
    };

    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState([]);
    const [noteDraft, setNoteDraft] = useState('');
    const loadNotes = async (id) => {
        try {
            setNotes(await api(route('inbox.notes', id)));
        } catch {
            /* silencioso */
        }
    };
    const addNote = async (e) => {
        e.preventDefault();
        if (!noteDraft.trim() || !selectedId) return;
        try {
            await api(route('inbox.notes.add', selectedId), {
                method: 'POST',
                body: JSON.stringify({ text: noteDraft.trim() }),
            });
            setNoteDraft('');
            await loadNotes(selectedId);
        } catch (err) {
            setError(err.message);
        }
    };

    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const sendFile = async (file) => {
        if (!file || !selectedId || uploading) return;
        setUploading(true);
        setError(null);
        try {
            const body = new FormData();
            body.append('file', file);
            const res = await fetch(route('inbox.send-media', selectedId), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' },
                credentials: 'same-origin',
                body,
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message ?? res.statusText);
            await loadMessages(selectedId);
            await loadConversations();
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const [drafting, setDrafting] = useState(false);
    const aiDraft = async () => {
        if (!selectedId || drafting) return;
        setDrafting(true);
        setError(null);
        try {
            const res = await api(route('inbox.ai-draft', selectedId), { method: 'POST' });
            setDraft(res.draft ?? '');
        } catch (err) {
            setError(err.message);
        } finally {
            setDrafting(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">Inbox</h2>
            }
        >
            <Head title="Inbox" />

            <div className="mx-auto max-w-7xl px-4 py-6">
                {!hasWhatsappConfig && (
                    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                        WhatsApp no está conectado.{' '}
                        <Link href={route('settings.whatsapp')} className="font-semibold underline">
                            Configura tu número
                        </Link>{' '}
                        para enviar y recibir mensajes.
                    </div>
                )}

                <div className="flex h-[calc(100vh-14rem)] overflow-hidden rounded-lg bg-white shadow">
                    {/* Lista de conversaciones */}
                    <div className="w-80 shrink-0 overflow-y-auto border-r">
                        {conversations.length === 0 && (
                            <p className="p-4 text-sm text-gray-500">
                                Sin conversaciones todavía. Llegarán aquí cuando un cliente te
                                escriba.
                            </p>
                        )}
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => openConversation(conv)}
                                className={`block w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${
                                    selectedId === conv.id ? 'bg-emerald-50' : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="truncate font-medium text-gray-900">
                                        {conv.contact?.name || conv.contact?.phone || 'Desconocido'}
                                    </span>
                                    <span className="ml-2 shrink-0 text-xs text-gray-400">
                                        {timeAgo(conv.last_message_at)}
                                    </span>
                                </div>
                                <div className="mt-0.5 flex items-center justify-between">
                                    <span className="truncate text-sm text-gray-500">
                                        {conv.last_message_text || '—'}
                                    </span>
                                    {conv.unread_count > 0 && (
                                        <span className="ml-2 shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Hilo de mensajes */}
                    <div className="flex min-w-0 flex-1 flex-col bg-gray-100">
                        {!selected ? (
                            <div className="flex flex-1 items-center justify-center text-gray-400">
                                Selecciona una conversación
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between border-b bg-white px-4 py-3">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {selected.contact?.name || selected.contact?.phone}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selected.contact?.phone} ·{' '}
                                            {STATUS_LABELS[selected.status] ?? selected.status}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowNotes(!showNotes)}
                                            title="Notas del contacto"
                                            className={`rounded-md border px-2 py-1.5 text-sm ${
                                                showNotes
                                                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            📝 {notes.length > 0 && notes.length}
                                        </button>
                                        <select
                                            value={selected.assigned_agent_id ?? ''}
                                            onChange={(e) => assign(e.target.value)}
                                            className="rounded-md border-gray-300 text-sm"
                                            title="Asignar agente"
                                        >
                                            <option value="">Sin asignar</option>
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={selected.status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="rounded-md border-gray-300 text-sm"
                                        >
                                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                                <option key={v} value={v}>
                                                    {l}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex min-h-0 flex-1">
                                    <div className="flex-1 space-y-2 overflow-y-auto p-4">
                                        {messages.map((msg) => (
                                            <MessageBubble
                                                key={msg.id}
                                                msg={msg}
                                                onReply={setReplyTo}
                                                onReact={reactTo}
                                            />
                                        ))}
                                        <div ref={bottomRef} />
                                    </div>

                                    {showNotes && (
                                        <div className="flex w-64 shrink-0 flex-col border-l bg-amber-50/50">
                                            <p className="border-b bg-white px-3 py-2 text-xs font-semibold uppercase text-gray-500">
                                                Notas internas
                                            </p>
                                            <div className="flex-1 space-y-2 overflow-y-auto p-3">
                                                {notes.map((note) => (
                                                    <div
                                                        key={note.id}
                                                        className="rounded-md bg-white p-2 text-xs shadow-sm"
                                                    >
                                                        <p className="whitespace-pre-wrap text-gray-700">
                                                            {note.note_text}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-gray-400">
                                                            {note.author?.name ?? '—'} ·{' '}
                                                            {new Date(note.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                ))}
                                                {notes.length === 0 && (
                                                    <p className="text-xs text-gray-400">
                                                        Sin notas. Solo las ve tu equipo.
                                                    </p>
                                                )}
                                            </div>
                                            <form onSubmit={addNote} className="border-t bg-white p-2">
                                                <textarea
                                                    rows={2}
                                                    value={noteDraft}
                                                    onChange={(e) => setNoteDraft(e.target.value)}
                                                    placeholder="Añadir nota…"
                                                    className="block w-full rounded-md border-gray-300 text-xs"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!noteDraft.trim()}
                                                    className="mt-1 w-full rounded-md bg-amber-500 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                                                >
                                                    Guardar nota
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={send} className="border-t bg-white p-3">
                                    {error && (
                                        <p className="mb-2 text-sm text-red-600">{error}</p>
                                    )}
                                    {replyTo && (
                                        <div className="mb-2 flex items-center justify-between rounded-md border-l-4 border-emerald-500 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                                            <span className="truncate">
                                                ↩ Respondiendo a: {replyTo.content_text || `[${replyTo.content_type}]`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setReplyTo(null)}
                                                className="ml-2 shrink-0 text-gray-400 hover:text-gray-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                            onChange={(e) => sendFile(e.target.files[0])}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!hasWhatsappConfig || uploading}
                                            title="Adjuntar archivo"
                                            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {uploading ? '…' : '📎'}
                                        </button>
                                        <input
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            placeholder="Escribe un mensaje…"
                                            className="flex-1 rounded-md border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                            disabled={!hasWhatsappConfig || sending}
                                        />
                                        {hasAi && (
                                            <button
                                                type="button"
                                                onClick={aiDraft}
                                                disabled={drafting}
                                                title="Generar borrador con IA"
                                                className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                                            >
                                                {drafting ? '…' : '✨ IA'}
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={!hasWhatsappConfig || sending || !draft.trim()}
                                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
