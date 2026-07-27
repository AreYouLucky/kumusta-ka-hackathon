<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SafetyCircle extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'location_name',
        'description',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(SafetyCircleMember::class);
    }

    public function scopeVisibleTo(Builder $query, int $userId): Builder
    {
        return $query->where(function (Builder $query) use ($userId): void {
            $query
                ->where('owner_id', $userId)
                ->orWhereHas('memberships', fn (Builder $query) => $query->where('user_id', $userId));
        });
    }
}
