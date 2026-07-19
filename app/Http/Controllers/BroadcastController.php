<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Contact;
use App\Models\MessageTemplate;
use App\Models\Tag;
use App\Models\WhatsappConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BroadcastController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Broadcasts/Index', [
            'broadcasts' => Broadcast::forAccount($request->user()->account_id)
                ->orderByDesc('created_at')
                ->paginate(20),
        ]);
    }

    public function create(Request $request): Response
    {
        $accountId = $request->user()->account_id;

        return Inertia::render('Broadcasts/Create', [
            'templates' => MessageTemplate::forAccount($accountId)
                ->where('status', 'APPROVED')
                ->orderBy('name')
                ->get(['id', 'name', 'language', 'body_text', 'header_type']),
            'tags' => Tag::forAccount($accountId)->orderBy('name')->get(['id', 'name', 'color']),
            'contactCount' => Contact::forAccount($accountId)->count(),
            'hasWhatsapp' => WhatsappConfig::forAccount($accountId)->where('status', 'connected')->exists(),
        ]);
    }

    public function store(Request $request, \App\Services\Broadcasts\Creator $creator): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'template_name' => 'required|string',
            'template_language' => 'required|string|max:10',
            'template_variables' => 'nullable|array',
            'template_variables.*' => 'string|max:500',
            'header_media_url' => 'nullable|url|max:2048',
            'audience' => 'required|in:all,tags',
            'tag_ids' => 'required_if:audience,tags|array',
            'tag_ids.*' => 'uuid',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        try {
            $broadcast = $creator->create($request->user()->account_id, $validated);
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['audience' => $e->getMessage()]);
        }

        return redirect()->route('broadcasts.show', $broadcast)
            ->with('success', $broadcast->scheduled_at ? 'Broadcast programado.' : 'Broadcast en cola de envío.');
    }

    public function show(Request $request, Broadcast $broadcast): Response
    {
        abort_if($broadcast->account_id !== $request->user()->account_id, 403);

        return Inertia::render('Broadcasts/Show', [
            'broadcast' => $broadcast,
            'recipients' => $broadcast->recipients()
                ->with('contact:id,name,phone')
                ->orderBy('created_at')
                ->paginate(50),
        ]);
    }

    public function destroy(Request $request, Broadcast $broadcast): RedirectResponse
    {
        abort_if($broadcast->account_id !== $request->user()->account_id, 403);

        // Solo borradores/programados: un envío en curso o terminado es histórico.
        if (! in_array($broadcast->status, ['draft', 'scheduled'], true)) {
            return back()->withErrors(['broadcast' => 'Solo se pueden eliminar broadcasts programados o en borrador.']);
        }

        $broadcast->delete();

        return redirect()->route('broadcasts.index')->with('success', 'Broadcast eliminado.');
    }
}
