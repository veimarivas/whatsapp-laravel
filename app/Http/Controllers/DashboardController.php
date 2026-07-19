<?php

namespace App\Http\Controllers;

use App\Models\Automation;
use App\Models\Broadcast;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Deal;
use App\Models\Flow;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $accountId = $request->user()->account_id;

        // Mensajes por día (últimos 7 días), entrantes vs salientes.
        $daily = Message::whereHas('conversation', fn ($q) => $q->where('account_id', $accountId))
            ->where('messages.created_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw("DATE(messages.created_at) as day,
                SUM(sender_type = 'customer') as inbound,
                SUM(sender_type != 'customer') as outbound")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $chart = collect(range(6, 0))->map(function ($daysAgo) use ($daily) {
            $day = now()->subDays($daysAgo)->toDateString();

            return [
                'day' => $day,
                'inbound' => (int) ($daily[$day]->inbound ?? 0),
                'outbound' => (int) ($daily[$day]->outbound ?? 0),
            ];
        });

        return Inertia::render('Dashboard', [
            'stats' => [
                'contacts' => Contact::forAccount($accountId)->count(),
                'openConversations' => Conversation::forAccount($accountId)->where('status', 'open')->count(),
                'pendingConversations' => Conversation::forAccount($accountId)->where('status', 'pending')->count(),
                'unreadTotal' => (int) Conversation::forAccount($accountId)->sum('unread_count'),
                'pipelineValue' => (float) Deal::forAccount($accountId)->where('status', 'open')->sum('value'),
                'dealsWon' => Deal::forAccount($accountId)->where('status', 'won')->count(),
                'broadcastsSent' => Broadcast::forAccount($accountId)->where('status', 'sent')->count(),
                'activeAutomations' => Automation::forAccount($accountId)->where('is_active', true)->count(),
                'activeFlows' => Flow::forAccount($accountId)->where('status', 'active')->count(),
            ],
            'chart' => $chart,
            'recentConversations' => Conversation::forAccount($accountId)
                ->with('contact:id,name,phone')
                ->orderByDesc('last_message_at')
                ->limit(6)
                ->get(['id', 'contact_id', 'status', 'last_message_text', 'last_message_at', 'unread_count']),
            'currency' => $request->user()->account->default_currency,
        ]);
    }
}
