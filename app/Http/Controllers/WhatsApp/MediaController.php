<?php

namespace App\Http\Controllers\WhatsApp;

use App\Http\Controllers\Controller;
use App\Models\WhatsappConfig;
use App\Services\WhatsApp\MetaApi;
use Illuminate\Http\Request;

/**
 * Proxy de media: las URLs de descarga de Meta exigen el access token
 * y expiran, así que el navegador nunca las toca directamente.
 * Equivalente a /api/whatsapp/media/[mediaId] del original.
 */
class MediaController extends Controller
{
    public function show(Request $request, string $mediaId)
    {
        $config = WhatsappConfig::forAccount($request->user()->account_id)->firstOrFail();
        $api = MetaApi::for($config);

        $url = $api->getMediaUrl($mediaId);
        abort_if(! $url, 404);

        $media = $api->downloadMedia($url);
        abort_if($media->failed(), 502);

        return response($media->body(), 200)
            ->header('Content-Type', $media->header('Content-Type') ?: 'application/octet-stream')
            ->header('Cache-Control', 'private, max-age=3600');
    }
}
