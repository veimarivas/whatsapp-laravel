<?php

namespace App\Jobs;

use App\Models\Message;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\MetaApi;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Transcribe un mensaje de audio del cliente usando whisper.cpp en el servidor.
 *
 * Flujo:
 * 1. Descarga el archivo de audio desde Meta usando el media_id guardado.
 * 2. Lo guarda temporalmente en disco.
 * 3. Ejecuta whisper.cpp con el modelo configurado en `services.whisper.model`.
 * 4. Parsea el texto de salida y lo guarda en `messages.transcript`.
 * 5. Borra el archivo temporal.
 *
 * Requiere whisper.cpp instalado en el servidor. Ver docs para el setup.
 */
class TranscribeAudioJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;
    public int $timeout = 180; // audios largos pueden tardar

    public function __construct(public readonly string $messageId)
    {
    }

    public function handle(): void
    {
        $message = Message::find($this->messageId);

        if (! $message || $message->content_type !== 'audio' || $message->transcript || ! $message->media_url) {
            return; // no aplica o ya fue transcrito
        }

        $binary = config('services.whisper.binary');
        $model = config('services.whisper.model');
        $language = config('services.whisper.language', 'es');

        if (! $binary || ! is_executable($binary)) {
            Log::info('TranscribeAudioJob: whisper.cpp no configurado, skip', ['message_id' => $message->id]);
            return; // silencioso si no está instalado
        }

        $config = WhatsappConfig::forAccount($message->conversation->account_id)
            ->where('status', 'connected')
            ->first();

        if (! $config) {
            return;
        }

        // 1. Descargar el audio desde Meta
        try {
            $api = MetaApi::for($config);
            $url = $api->getMediaUrl($message->media_url);
            if (! $url) {
                Log::warning('TranscribeAudioJob: no se pudo obtener URL del media', ['message_id' => $message->id]);
                return;
            }

            $contents = $api->downloadMedia($url)->body();
        } catch (\Throwable $e) {
            Log::warning('TranscribeAudioJob: falló descarga', ['message_id' => $message->id, 'error' => $e->getMessage()]);
            return;
        }

        // 2. Guardar temporal (whisper.cpp requiere archivo en disco)
        $tempDir = storage_path('app/transcribe');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0775, true);
        }
        $tempFile = $tempDir.'/'.$message->id.'.ogg';
        file_put_contents($tempFile, $contents);

        try {
            // 3. Ejecutar whisper.cpp. Flags:
            //    -m modelo, -f archivo, -l idioma, -otxt salida como .txt
            //    --no-timestamps para transcripción limpia sin marcas de tiempo
            $outputPrefix = $tempDir.'/'.$message->id;
            $cmd = sprintf(
                '%s -m %s -f %s -l %s -otxt -nt --output-file %s 2>&1',
                escapeshellcmd($binary),
                escapeshellarg($model),
                escapeshellarg($tempFile),
                escapeshellarg($language),
                escapeshellarg($outputPrefix)
            );

            exec($cmd, $output, $returnCode);

            if ($returnCode !== 0) {
                Log::warning('TranscribeAudioJob: whisper.cpp falló', [
                    'message_id' => $message->id,
                    'return_code' => $returnCode,
                    'output' => implode("\n", array_slice($output, -10)),
                ]);
                return;
            }

            // 4. Leer archivo .txt de salida
            $txtFile = $outputPrefix.'.txt';
            $transcript = is_file($txtFile) ? trim(file_get_contents($txtFile)) : '';

            if ($transcript !== '') {
                $message->update(['transcript' => $transcript]);
            }

            // 5. Limpiar
            @unlink($txtFile);
        } finally {
            @unlink($tempFile);
        }
    }
}
