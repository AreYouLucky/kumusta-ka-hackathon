<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisasterIncident extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'title',
        'hazard_type',
        'severity',
        'status',
        'latitude',
        'longitude',
        'radius_meters',
        'color',
        'location_name',
        'description',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'radius_meters' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function affectedResidents(): HasMany
    {
        return $this->hasMany(AffectedResident::class);
    }
}
