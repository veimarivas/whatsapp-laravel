<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DealController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $accountId = $request->user()->account_id;
        $validated = $this->validateDeal($request);

        $pipeline = Pipeline::forAccount($accountId)->findOrFail($validated['pipeline_id']);
        $this->assertStageBelongsToPipeline($validated['stage_id'], $pipeline);
        $this->assertContactBelongsToAccount($validated['contact_id'] ?? null, $accountId);

        Deal::create([...$validated, 'account_id' => $accountId]);

        return back()->with('success', 'Deal creado.');
    }

    public function update(Request $request, Deal $deal): RedirectResponse
    {
        abort_if($deal->account_id !== $request->user()->account_id, 403);

        // Movimiento rápido de columna (drag & drop): solo stage_id.
        if ($request->has('stage_id') && count($request->all()) === 1) {
            $this->assertStageBelongsToPipeline($request->input('stage_id'), $deal->pipeline);
            $deal->update(['stage_id' => $request->input('stage_id')]);

            return back();
        }

        $validated = $this->validateDeal($request, $deal);
        $this->assertStageBelongsToPipeline($validated['stage_id'], $deal->pipeline);
        $this->assertContactBelongsToAccount($validated['contact_id'] ?? null, $deal->account_id);

        unset($validated['pipeline_id']); // un deal no cambia de pipeline

        $deal->update($validated);

        return back()->with('success', 'Deal actualizado.');
    }

    public function destroy(Request $request, Deal $deal): RedirectResponse
    {
        abort_if($deal->account_id !== $request->user()->account_id, 403);

        $deal->delete();

        return back()->with('success', 'Deal eliminado.');
    }

    private function validateDeal(Request $request, ?Deal $deal = null): array
    {
        return $request->validate([
            'pipeline_id' => $deal ? 'nullable|uuid' : 'required|uuid',
            'stage_id' => 'required|uuid',
            'contact_id' => 'nullable|uuid',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'title' => 'required|string|max:255',
            'value' => 'nullable|numeric|min:0|max:9999999999.99',
            'currency' => 'nullable|string|size:3',
            'notes' => 'nullable|string|max:5000',
            'expected_close_date' => 'nullable|date',
            'status' => 'nullable|in:open,won,lost',
        ]);
    }

    private function assertStageBelongsToPipeline(string $stageId, Pipeline $pipeline): void
    {
        $ok = PipelineStage::where('id', $stageId)
            ->where('pipeline_id', $pipeline->id)
            ->exists();

        if (! $ok) {
            throw ValidationException::withMessages(['stage_id' => 'La etapa no pertenece al pipeline.']);
        }
    }

    private function assertContactBelongsToAccount(?string $contactId, string $accountId): void
    {
        if ($contactId === null) {
            return;
        }

        $ok = Contact::forAccount($accountId)->where('id', $contactId)->exists();

        if (! $ok) {
            throw ValidationException::withMessages(['contact_id' => 'Contacto inválido.']);
        }
    }
}
