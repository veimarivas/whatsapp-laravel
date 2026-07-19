<?php

namespace App\Http\Controllers;

use App\Models\MessageTemplate;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\MetaApi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $accountId = $request->user()->account_id;

        return Inertia::render('Templates/Index', [
            'templates' => MessageTemplate::forAccount($accountId)
                ->orderByDesc('updated_at')
                ->get(),
            'canSync' => WhatsappConfig::forAccount($accountId)
                ->where('status', 'connected')
                ->whereNotNull('waba_id')
                ->exists(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateTemplate($request);

        $exists = MessageTemplate::forAccount($request->user()->account_id)
            ->where('name', $validated['name'])
            ->where('language', $validated['language'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'Ya existe una plantilla con ese nombre e idioma.']);
        }

        MessageTemplate::create([
            ...$validated,
            'account_id' => $request->user()->account_id,
            'status' => 'DRAFT',
        ]);

        return back()->with('success', 'Plantilla creada (borrador).');
    }

    public function update(Request $request, MessageTemplate $template): RedirectResponse
    {
        $this->authorizeTemplate($request, $template);

        // Las plantillas ya aprobadas/en revisión no se editan localmente:
        // Meta es la fuente de verdad de su contenido.
        if (! in_array($template->status, ['DRAFT', 'REJECTED'], true)) {
            return back()->withErrors(['name' => 'Solo se pueden editar borradores o plantillas rechazadas.']);
        }

        $template->update([...$this->validateTemplate($request), 'status' => 'DRAFT']);

        return back()->with('success', 'Plantilla actualizada.');
    }

    public function destroy(Request $request, MessageTemplate $template): RedirectResponse
    {
        $this->authorizeTemplate($request, $template);
        $template->delete();

        return back()->with('success', 'Plantilla eliminada.');
    }

    /** Envía un borrador a revisión de Meta. */
    public function submit(Request $request, MessageTemplate $template): RedirectResponse
    {
        $this->authorizeTemplate($request, $template);

        $config = WhatsappConfig::forAccount($request->user()->account_id)
            ->where('status', 'connected')
            ->first();

        if (! $config?->waba_id) {
            return back()->withErrors(['sync' => 'Conecta WhatsApp y configura el WABA ID primero.']);
        }

        $components = [['type' => 'BODY', 'text' => $template->body_text]];

        if ($template->header_type === 'text' && $template->header_content) {
            $components[] = ['type' => 'HEADER', 'format' => 'TEXT', 'text' => $template->header_content];
        }

        if ($template->footer_text) {
            $components[] = ['type' => 'FOOTER', 'text' => $template->footer_text];
        }

        try {
            $result = MetaApi::for($config)->createTemplate([
                'name' => $template->name,
                'language' => $template->language,
                'category' => strtoupper($template->category),
                'components' => $components,
            ]);

            $template->update([
                'status' => 'PENDING',
                'meta_template_id' => $result['id'] ?? null,
                'last_submitted_at' => now(),
                'submission_error' => null,
            ]);

            return back()->with('success', 'Plantilla enviada a revisión de Meta.');
        } catch (\RuntimeException $e) {
            $template->update(['submission_error' => $e->getMessage()]);

            return back()->withErrors(['sync' => 'Meta rechazó el envío: '.$e->getMessage()]);
        }
    }

    /** Trae desde Meta el estado y contenido de todas las plantillas del WABA. */
    public function sync(Request $request): RedirectResponse
    {
        $accountId = $request->user()->account_id;
        $config = WhatsappConfig::forAccount($accountId)->where('status', 'connected')->first();

        if (! $config?->waba_id) {
            return back()->withErrors(['sync' => 'Conecta WhatsApp y configura el WABA ID primero.']);
        }

        try {
            $remote = MetaApi::for($config)->listTemplates();
        } catch (\RuntimeException $e) {
            return back()->withErrors(['sync' => $e->getMessage()]);
        }

        $synced = 0;

        foreach ($remote as $tpl) {
            $components = collect($tpl['components'] ?? []);
            $body = $components->firstWhere('type', 'BODY');
            $header = $components->firstWhere('type', 'HEADER');
            $footer = $components->firstWhere('type', 'FOOTER');
            $buttons = $components->firstWhere('type', 'BUTTONS');

            MessageTemplate::updateOrCreate(
                [
                    'account_id' => $accountId,
                    'name' => $tpl['name'],
                    'language' => $tpl['language'],
                ],
                [
                    'category' => ucfirst(strtolower($tpl['category'] ?? 'Marketing')),
                    'status' => strtoupper($tpl['status'] ?? 'PENDING'),
                    'meta_template_id' => $tpl['id'] ?? null,
                    'body_text' => $body['text'] ?? '',
                    'header_type' => $header ? strtolower($header['format'] ?? 'text') : null,
                    'header_content' => $header['text'] ?? null,
                    'footer_text' => $footer['text'] ?? null,
                    'buttons' => $buttons['buttons'] ?? null,
                    'rejection_reason' => $tpl['rejected_reason'] ?? null,
                ],
            );

            $synced++;
        }

        return back()->with('success', "Sincronizadas {$synced} plantillas desde Meta.");
    }

    private function validateTemplate(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:512', 'regex:/^[a-z0-9_]+$/'],
            'category' => 'required|in:Marketing,Utility,Authentication',
            'language' => 'required|string|max:10',
            'header_type' => 'nullable|in:text',
            'header_content' => 'nullable|required_with:header_type|string|max:60',
            'body_text' => 'required|string|max:1024',
            'footer_text' => 'nullable|string|max:60',
        ]);
    }

    private function authorizeTemplate(Request $request, MessageTemplate $template): void
    {
        abort_if($template->account_id !== $request->user()->account_id, 403);
    }
}
