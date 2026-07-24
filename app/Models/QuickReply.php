<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['account_id', 'user_id', 'shortcut', 'content'])]
class QuickReply extends Model
{
    use BelongsToAccount, HasUuids;

    /** Substituye variables del contacto en el contenido. */
    public function render(Contact $contact): string
    {
        return strtr($this->content, [
            '{name}' => $contact->name ?? '',
            '{phone}' => $contact->phone ?? '',
            '{email}' => $contact->email ?? '',
            '{company}' => $contact->company ?? '',
        ]);
    }
}
