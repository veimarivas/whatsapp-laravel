<?php

namespace App\Http\Controllers;

use App\Models\AutoTagRule;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AutoTagController extends Controller
{
    public function index(Request $request): Response
    {
        $accountId = $request->user()->account_id;

        return Inertia::render('Settings/AutoTags', [
            'rules' => AutoTagRule::forAccount($accountId)
                ->with('tag:id,name,color')
                ->orderByDesc('created_at')
                ->get(),
            'tags' => Tag::forAccount($accountId)->orderBy('name')->get(['id', 'name', 'color']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'keyword' => 'required|string|max:60',
            'tag_id' => 'required|uuid',
            'first_message_only' => 'boolean',
        ]);

        // Verificar que el tag pertenece a la misma cuenta
        abort_unless(
            Tag::where('id', $validated['tag_id'])->where('account_id', $request->user()->account_id)->exists(),
            422
        );

        AutoTagRule::create([
            'account_id' => $request->user()->account_id,
            'tag_id' => $validated['tag_id'],
            'keyword' => trim($validated['keyword']),
            'first_message_only' => $validated['first_message_only'] ?? false,
            'is_active' => true,
        ]);

        return back()->with('success', 'Regla creada.');
    }

    public function toggle(Request $request, AutoTagRule $rule): RedirectResponse
    {
        abort_if($rule->account_id !== $request->user()->account_id, 403);
        $rule->update(['is_active' => ! $rule->is_active]);

        return back();
    }

    public function destroy(Request $request, AutoTagRule $rule): RedirectResponse
    {
        abort_if($rule->account_id !== $request->user()->account_id, 403);
        $rule->delete();

        return back()->with('success', 'Regla eliminada.');
    }
}
