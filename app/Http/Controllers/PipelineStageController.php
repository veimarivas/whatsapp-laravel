<?php

namespace App\Http\Controllers;

use App\Models\Pipeline;
use App\Models\PipelineStage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PipelineStageController extends Controller
{
    public function store(Request $request, Pipeline $pipeline): RedirectResponse
    {
        abort_if($pipeline->account_id !== $request->user()->account_id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:60',
            'color' => 'nullable|string|max:20',
        ]);

        PipelineStage::create([
            'pipeline_id' => $pipeline->id,
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#3b82f6',
            'position' => ($pipeline->stages()->max('position') ?? -1) + 1,
        ]);

        return back()->with('success', 'Etapa creada.');
    }

    public function update(Request $request, PipelineStage $stage): RedirectResponse
    {
        $this->authorizeStage($request, $stage);

        $stage->update($request->validate([
            'name' => 'required|string|max:60',
            'color' => 'nullable|string|max:20',
        ]));

        return back()->with('success', 'Etapa actualizada.');
    }

    /** Sube o baja la etapa una posición (intercambia con la vecina). */
    public function move(Request $request, PipelineStage $stage): RedirectResponse
    {
        $this->authorizeStage($request, $stage);

        $direction = $request->validate(['direction' => 'required|in:up,down'])['direction'];

        $neighbor = $stage->pipeline->stages()
            ->where('position', $direction === 'up' ? '<' : '>', $stage->position)
            ->orderBy('position', $direction === 'up' ? 'desc' : 'asc')
            ->first();

        if ($neighbor) {
            [$a, $b] = [$stage->position, $neighbor->position];
            $stage->update(['position' => $b]);
            $neighbor->update(['position' => $a]);
        }

        return back();
    }

    public function destroy(Request $request, PipelineStage $stage): RedirectResponse
    {
        $this->authorizeStage($request, $stage);

        if ($stage->deals()->exists()) {
            return back()->withErrors(['stage' => 'Mueve o elimina los deals de la etapa antes de borrarla.']);
        }

        $stage->delete();

        return back()->with('success', 'Etapa eliminada.');
    }

    private function authorizeStage(Request $request, PipelineStage $stage): void
    {
        abort_if($stage->pipeline->account_id !== $request->user()->account_id, 403);
    }
}
