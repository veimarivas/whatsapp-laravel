<?php

namespace App\Http\Controllers;

use App\Models\CustomField;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CustomFieldController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'field_name' => 'required|string|max:60',
            'field_type' => 'required|in:text,number,date,select',
            'field_options' => 'nullable|array', // opciones para type=select
            'field_options.*' => 'string|max:100',
        ]);

        CustomField::create([...$validated, 'account_id' => $request->user()->account_id]);

        return back()->with('success', 'Campo creado.');
    }

    public function destroy(Request $request, CustomField $customField): RedirectResponse
    {
        abort_if($customField->account_id !== $request->user()->account_id, 403);

        $customField->delete(); // los valores caen por FK cascade

        return back()->with('success', 'Campo eliminado.');
    }
}
