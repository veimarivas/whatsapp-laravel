<?php

namespace App\Services\Ai;

use App\Models\AiConfig;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Cliente BYO-key para OpenAI y Anthropic. Equivalente a
 * src/lib/ai/providers del original: la clave vive cifrada en la
 * cuenta y las llamadas salen directo al proveedor elegido.
 */
class Client
{
    public function __construct(private readonly AiConfig $config)
    {
    }

    public static function for(AiConfig $config): self
    {
        return new self($config);
    }

    /**
     * @param  array<int, array{role: 'user'|'assistant', content: string}>  $messages
     */
    public function chat(array $messages, ?string $system = null, int $maxTokens = 500): string
    {
        return $this->config->provider === 'anthropic'
            ? $this->anthropic($messages, $system, $maxTokens)
            : $this->openai($messages, $system, $maxTokens);
    }

    private function openai(array $messages, ?string $system, int $maxTokens): string
    {
        $payload = [
            'model' => $this->config->model,
            'max_tokens' => $maxTokens,
            'messages' => [
                ...($system ? [['role' => 'system', 'content' => $system]] : []),
                ...$messages,
            ],
        ];

        $response = Http::withToken($this->config->api_key)
            ->timeout(30)
            ->post('https://api.openai.com/v1/chat/completions', $payload);

        if ($response->failed()) {
            throw new RuntimeException('OpenAI: '.($response->json('error.message') ?? $response->status()));
        }

        return trim($response->json('choices.0.message.content') ?? '');
    }

    private function anthropic(array $messages, ?string $system, int $maxTokens): string
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->config->api_key,
            'anthropic-version' => '2023-06-01',
        ])
            ->timeout(30)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => $this->config->model,
                'max_tokens' => $maxTokens,
                'system' => $system,
                'messages' => $messages,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Anthropic: '.($response->json('error.message') ?? $response->status()));
        }

        return trim($response->json('content.0.text') ?? '');
    }
}
