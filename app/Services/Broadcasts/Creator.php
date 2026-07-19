<?php

namespace App\Services\Broadcasts;

use App\Jobs\SendBroadcastJob;
use App\Models\Broadcast;
use App\Models\Contact;
use App\Models\MessageTemplate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Creación de broadcasts (resolución de audiencia + destinatarios +
 * encolado). Compartido por la UI web y la API pública para que las
 * reglas no diverjan.
 *
 * @throws InvalidArgumentException con mensaje apto para el usuario.
 */
class Creator
{
    /**
     * @param  array{name:string, template_name:string, template_language:string,
     *               template_variables?:array, header_media_url?:?string,
     *               audience:string, tag_ids?:array, scheduled_at?:?string}  $data
     */
    public function create(string $accountId, array $data): Broadcast
    {
        $templateOk = MessageTemplate::forAccount($accountId)
            ->where('name', $data['template_name'])
            ->where('language', $data['template_language'])
            ->where('status', 'APPROVED')
            ->exists();

        if (! $templateOk) {
            throw new InvalidArgumentException('La plantilla no existe o no está aprobada.');
        }

        $contactIds = Contact::forAccount($accountId)
            ->when($data['audience'] === 'tags', function ($query) use ($data) {
                $query->whereHas('tags', fn ($w) => $w->whereIn('tags.id', $data['tag_ids'] ?? []));
            })
            ->pluck('id');

        if ($contactIds->isEmpty()) {
            throw new InvalidArgumentException('La audiencia seleccionada no tiene contactos.');
        }

        $scheduledAt = $data['scheduled_at'] ?? null;

        $broadcast = DB::transaction(function () use ($accountId, $data, $contactIds, $scheduledAt) {
            $broadcast = Broadcast::create([
                'account_id' => $accountId,
                'name' => $data['name'],
                'template_name' => $data['template_name'],
                'template_language' => $data['template_language'],
                'template_variables' => array_values($data['template_variables'] ?? []),
                'header_media_url' => $data['header_media_url'] ?? null,
                'audience_filter' => [
                    'type' => $data['audience'],
                    'tag_ids' => $data['tag_ids'] ?? [],
                ],
                'scheduled_at' => $scheduledAt,
                'status' => $scheduledAt ? 'scheduled' : 'sending',
                'total_recipients' => $contactIds->count(),
            ]);

            $now = now();
            $rows = $contactIds->map(fn ($id) => [
                'id' => (string) Str::uuid(),
                'broadcast_id' => $broadcast->id,
                'contact_id' => $id,
                'status' => 'pending',
                'created_at' => $now,
            ])->all();

            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('broadcast_recipients')->insert($chunk);
            }

            return $broadcast;
        });

        if (! $broadcast->scheduled_at) {
            SendBroadcastJob::dispatch($broadcast->id);
        }

        return $broadcast;
    }
}
