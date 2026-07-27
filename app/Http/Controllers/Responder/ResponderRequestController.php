<?php

namespace App\Http\Controllers\Responder;

use App\Events\CitizenAssistanceStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\SafetyCircleMember;
use App\Support\ResponderRequestData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ResponderRequestController extends Controller
{
    public function index(): Response
    {
        return $this->renderQueue();
    }

    public function assigned(Request $request): Response
    {
        return $this->renderQueue($request->user()->id);
    }

    private function renderQueue(?int $responderId = null): Response
    {
        $requests = SafetyCircleMember::query()
            ->with(['user', 'circle', 'responder'])
            ->whereIn('safety_status', ['help', 'rescue'])
            ->when($responderId !== null, fn ($query) => $query->where('responder_id', $responderId))
            ->latest('checked_in_at')
            ->take(100)
            ->get()
            ->map(fn (SafetyCircleMember $member): array => ResponderRequestData::fromMember($member));

        return Inertia::render('responders/index', [
            'initialRequests' => $requests,
            'view' => $responderId === null ? 'queue' : 'assigned',
            'currentResponderId' => $responderId,
        ]);
    }

    public function update(Request $request, SafetyCircleMember $member): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['accepted', 'resolved'])],
        ]);

        abort_unless(in_array($member->safety_status, ['help', 'rescue'], true), 422);
        abort_if($member->responder_id !== null && $member->responder_id !== $request->user()->id, 409, 'This request is assigned to another responder.');

        $member->update([
            'responder_id' => $request->user()->id,
            'responder_status' => $validated['status'],
            'accepted_at' => $member->accepted_at ?? now(),
            'resolved_at' => $validated['status'] === 'resolved' ? now() : null,
        ]);

        $member->refresh()->load(['user', 'circle', 'responder']);
        broadcast(new CitizenAssistanceStatusUpdated(ResponderRequestData::fromMember($member)));

        return back();
    }
}
