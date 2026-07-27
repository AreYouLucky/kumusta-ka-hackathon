<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SafetyCircleMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'safety_circle_id',
        'user_id',
        'relationship',
        'safety_status',
        'response_status',
        'assistance_type',
        'situation',
        'priority',
        'responder_id',
        'responder_status',
        'accepted_at',
        'resolved_at',
        'checked_in_at',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'accepted_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function circle(): BelongsTo
    {
        return $this->belongsTo(SafetyCircle::class, 'safety_circle_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }
}
