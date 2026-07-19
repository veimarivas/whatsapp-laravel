<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['contact_id', 'custom_field_id', 'value'])]
class ContactCustomValue extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function customField(): BelongsTo
    {
        return $this->belongsTo(CustomField::class);
    }
}
