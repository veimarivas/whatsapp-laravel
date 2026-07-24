<?php

namespace App\Console\Commands;

use App\Models\Conversation;
use Illuminate\Console\Command;

/**
 * Cierra automáticamente las conversaciones "open" que no tuvieron
 * actividad en X días (default 7). El próximo mensaje del cliente las
 * reabre naturalmente (InboundProcessor pone status=open al recibir).
 *
 * Se agenda diario en el Schedule para mantener el Inbox limpio.
 * Uso manual: `php artisan wacrm:auto-close-inactive [--days=7] [--dry-run]`
 */
class AutoCloseInactive extends Command
{
    protected $signature = 'wacrm:auto-close-inactive {--days=7} {--dry-run}';
    protected $description = 'Cierra conversaciones abiertas sin actividad en N días';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $query = Conversation::where('status', 'open')
            ->where(function ($q) use ($cutoff) {
                $q->where('last_message_at', '<', $cutoff)
                  ->orWhere(function ($qq) use ($cutoff) {
                      $qq->whereNull('last_message_at')->where('created_at', '<', $cutoff);
                  });
            });

        $count = $query->count();
        $this->info("Conversaciones a cerrar (sin actividad >{$days}d): {$count}");

        if ($this->option('dry-run') || $count === 0) {
            return self::SUCCESS;
        }

        $updated = $query->update(['status' => 'closed']);
        $this->info("✅ {$updated} conversaciones cerradas.");

        return self::SUCCESS;
    }
}
